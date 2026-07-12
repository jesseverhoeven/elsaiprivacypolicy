/**
 * Dev-only audit harness: run the real parseUploadedPolicy over every policy file
 * (same extraction as extractFiles.ts — mammoth for .docx, pdf.js hasEOL for .pdf)
 * and flag anomalies. Not shipped. Run: npx tsx scripts/audit-uploads.mts "<folder>"
 */
import { readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import mammoth from 'mammoth';
// eslint-disable-next-line import/no-unresolved
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parseUploadedPolicy } from '../src/logic/parsePolicy.ts';

const root = process.argv[2];
if (!root) { console.error('usage: tsx audit-uploads.mts <folder>'); process.exit(1); }

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(pdf|docx)$/i.test(e)) out.push(p);
  }
  return out;
}

async function extract(path: string): Promise<string> {
  if (extname(path).toLowerCase() === '.docx') {
    return (await mammoth.extractRawText({ path })).value;
  }
  const data = new Uint8Array((await import('node:fs')).readFileSync(path));
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it: any) => ('str' in it ? it.str + (it.hasEOL ? '\n' : ' ') : '')).join(''));
  }
  return pages.join('\n');
}

const files = walk(root).sort();
let parsed = 0; let skipped = 0; const problems: string[] = [];

for (const f of files) {
  const name = basename(f);
  try {
    const text = await extract(f);
    const r = parseUploadedPolicy(text, name);
    if (!r) {
      skipped++;
      const low = text.toLowerCase();
      const reason = low.includes('what data do we collect') ? 'legacy-template'
        : !low.slice(0, 3000).includes('privacy policy') ? 'not-a-policy'
        : 'no-annex4-anchors';
      console.log(`SKIP  ${name.slice(0, 60).padEnd(60)} [${reason}]`);
      continue;
    }
    parsed++;
    const flags: string[] = [];
    if (r.purposes.length === 0) flags.push('0-purposes');
    if (r.categories.length + r.customCategories.length === 0) flags.push('0-categories');
    if (r.subjects.length === 0) flags.push('0-subjects');
    const longP = r.purposes.filter((p) => p.text.length > 350).length;
    const shortP = r.purposes.filter((p) => p.text.length < 12).length;
    if (shortP) flags.push(`${shortP}-tiny-purpose`);
    const badCustom = r.customCategories.filter((c) => /[)]{2}|^\(|^to |lorem/i.test(c.label) || c.label.length < 4).length;
    if (badCustom) flags.push(`${badCustom}-bad-customcat`);
    const leadIn = r.purposes.filter((p) => /^(we |our |in particular|you may)/i.test(p.text)).length;
    if (leadIn) flags.push(`${leadIn}-leadin-as-purpose`);
    const line = `${flags.length ? 'FLAG' : 'ok  '}  ${name.slice(0, 60).padEnd(60)} P${r.purposes.length} C${r.categories.length}+${r.customCategories.length} S${r.subjects.length} R${r.recipients.length}${longP ? ` (${longP} long)` : ''}  ${flags.join(' ')}`;
    console.log(line);
    if (flags.length) problems.push(`${name}: ${flags.join(', ')}`);
  } catch (e) {
    problems.push(`${name}: ERROR ${(e as Error).message}`);
    console.log(`ERR   ${name}  ${(e as Error).message}`);
  }
}

console.log(`\n=== parsed ${parsed}, skipped ${skipped}, flagged ${problems.length} ===`);
for (const p of problems) console.log('  • ' + p);
