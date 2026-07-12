/**
 * Structural parser for an UPLOADED previous privacy policy (new event → step 1,
 * upload under A). ELSA policies follow the same Annex 4 framework, so the
 * variable details are copied 1-on-1 into step 2 — exactly like choosing a
 * previous event (user request 2026-07-12): purposes verbatim (unmatched ones
 * become "Added / new purposes"), categories ticked with their literal items
 * (unmatched wording becomes an added custom category), subjects, recipients,
 * sources and transfers.
 *
 * Mirrors scripts/build-presets.py `parse_policy`. Returns null when the text is
 * not recognisably an Annex 4-style policy; the keyword analyser then remains the
 * only (suggest-only) signal.
 */

import type { GeneratedPreset } from '../data/presets';

const clean = (s: string): string => s.normalize('NFC').replace(/\s+/g, ' ').trim();

/**
 * One logical line per paragraph/bullet. The PDF extractor (extractFiles.ts) has
 * already reflowed wrapped visual lines using the page geometry, and mammoth gives
 * one paragraph per line for DOCX — so here we only split on newlines, clean, strip
 * a leftover leading bullet glyph, and drop page furniture (running titles, page
 * numbers, the repeated contact footer).
 */
function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((t) => clean(t).replace(/^[•●▪‣·]\s*/, ''))
    .filter((t) => t
      && !/^privacy policy [-–]/i.test(t)
      && !/^\d{1,3}$/.test(t)
      && !(/e-?mail:/i.test(t) && /tel\.?:/i.test(t)));
}

const LANDMARKS: [string, RegExp][] = [
  ['summary_data', /^personal data we process$/i],
  ['summary_purposes', /^purposes of the processing$/i],
  ['summary_rights', /^your rights$/i],
  ['about', /^1\s*[-–]\s*about us/i],
  ['applies', /^this policy applies to/i],
  ['collection', /^2\s*[-–]\s*personal data collection/i],
  ['direct', /^direct collection$/i],
  ['indirect', /^indirect collection$/i],
  ['legal', /^3\s*[-–]\s*legal basis/i],
  ['retention', /^4\s*[-–]\s*data retention/i],
  ['transfers', /^5\s*[-–]\s*data transfers/i],
  ['recipients_list', /^types of data recipients/i],
  ['third_country_h', /^third[- ]country and international organisation transfers?/i],
  ['countries', /these countries include/i],
  ['orgs', /these organisations are/i],
  ['disclosure', /^data disclosure$/i],
  ['security', /^6\s*[-–]\s*data security/i],
];

/**
 * Landmark -> line index. The LAST occurrence wins: policies with a table of
 * contents list the same headings once in the TOC and once for real.
 */
function sectionSlices(lines: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  lines.forEach((t, i) => {
    for (const [key, pat] of LANDMARKS) if (pat.test(t)) idx[key] = i;
  });
  return idx;
}

/** Raw lines in a range, minus obvious furniture/boilerplate — before reflow. */
function rangeLines(lines: string[], start: number, end: number): string[] {
  return lines.slice(Math.max(0, start), Math.min(end, lines.length))
    .filter((t) => t.length < 400
      && !/^(in particular|specifically|unless|the data controller|types of|this policy applies)/i.test(t)
      && !/e-?mail:|^address:|^phone:/i.test(t));
}

/** Variable list items in a range — template/boilerplate sentences filtered out. */
function bulletsBetween(lines: string[], start: number, end: number): string[] {
  const out: string[] = [];
  for (const t of rangeLines(lines, start, end)) {
    if (/^(we |you |our )/i.test(t)) continue;
    const v = t.replace(/[;.]+$/, '').trim();
    if (v) out.push(v);
  }
  return out;
}

/**
 * Reflow wrapped category lines: a summary category is "Label (items)" whose
 * parentheses may span several wrapped visual lines. Join lines until the
 * parentheses balance, so each category ends up on one logical line.
 */
function reflowByParens(items: string[]): string[] {
  const out: string[] = [];
  let buf = '';
  for (const line of items) {
    buf = buf ? `${buf} ${line}` : line;
    const opens = (buf.match(/\(/g) ?? []).length;
    const closes = (buf.match(/\)/g) ?? []).length;
    if (opens === 0 || opens <= closes) { out.push(buf.trim()); buf = ''; }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/**
 * ELSA purposes start with an imperative verb ("Record…", "Identify…", "To
 * contact…"). A wrapped continuation line does not, so join any non-verb line onto
 * the previous purpose — recovering each purpose verbatim from wrapped PDF text.
 */
const PURPOSE_VERB =
  /^(to\s+)?(record|identify|communicate|assess|keep|maintain|comply|notify|establish|provide|organi[sz]e|manage|process|contact|publish|send|share|transfer|register|collect|handle|use|ensure|facilitate|verify|store|analy[sz]e|improve|respond|monitor|evaluate|coordinate|promote|distribute|arrange|deliver|support|enable|inform|create|develop|conduct|review|report|update|track|allow|grant|issue|prepare|receive|obtain|protect|prevent|detect|carry out|fulfil|meet|administer|run|host|award|select|assign|record)\b/i;

/** A line ending in a conjunction/article/preposition/comma is clearly unfinished. */
const DANGLING = /(\b(and|or|the|of|to|their|its|our|your|a|an|for|with|in|on|at|by|from|as)|,)$/i;

function reflowVerbBullets(items: string[]): string[] {
  const out: string[] = [];
  for (const line of items) {
    const prev = out[out.length - 1];
    // Join a continuation line onto the previous purpose when it doesn't itself start
    // a new purpose (no imperative verb) OR the previous line is clearly unfinished
    // (ends "…and" / "…," etc.) — the latter guards nouns like "contact persons".
    if (prev !== undefined && (!PURPOSE_VERB.test(line) || DANGLING.test(prev))) out[out.length - 1] = `${prev} ${line}`;
    else out.push(line);
  }
  return out.map((s) => s.trim());
}

/** Mirrors STD_CATEGORIES in build-presets.py — label phrases -> standard category ids. */
const STD_CATEGORIES: [string, string[]][] = [
  ['personal-identification', ['personal identification']],
  ['contact-information', ['contact information', 'contact detail']],
  ['billing-contribution', ['billing', 'contribution']],
  ['financial-information', ['financial']],
  ['elsa-activity', ['elsa activity', 'elsa affiliation', 'elsa career', 'elsa background']],
  ['emergency-contact', ['emergency contact']],
  ['professional-educational', ['professional and educational', 'professional details', 'educational details', 'professional & educational']],
  ['application-process', ['application process', 'application details', 'application data']],
  ['meal-details', ['meal details', 'meal preferences']],
  ['health-data', ['health data', 'dietary']],
  ['transfer-details', ['transfer details', 'travel details', 'travel data']],
  ['accommodation-details', ['accommodation']],
  ['additional-services', ['additional services']],
  ['event-activity', ['event activity']],
  ['photos-recordings', ['photograph', 'recording', 'image', 'photo']],
  ['communication-data', ['communication data']],
  ['religious-beliefs', ['religious']],
  ['political-opinions', ['political']],
  ['trade-union', ['trade union']],
];

function splitCategory(b: string): { id?: string; custom?: string; items: string } {
  const m = /^(.*?)\s*\((.*)\)\s*$/.exec(b);
  let [label, items] = m ? [m[1], m[2]] : [b, ''];
  // Some policies double the label inside the parentheses:
  // "Contact information (Contact information (e-mail address...))". Unwrap it.
  const dup = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\((.*)\\)$`, 'i');
  const dm = dup.exec(items.trim());
  if (dm) items = dm[1];
  const l = label.toLowerCase();
  for (const [cid, keys] of STD_CATEGORIES) {
    if (keys.some((k) => l.includes(k))) return { id: cid, items: items.trim() };
  }
  return { custom: label, items: items.trim() };
}

/** Basis lead-ins — prose ("Consent: We may rely…") or bare table label ("Consent"). */
const BASIS_HEADS: [string, RegExp][] = [
  ['contract', /^contractual obligations?\s*(:|$|we\b)/i],
  ['consent', /^consent\s*(:|$|we\b)/i],
  ['legitimateInterest', /^legitimate interests?\s*(:|$|we\b)/i],
  ['legalObligation', /^legal (compliance|obligations?)\s*(:|$|we\b)/i],
];

/**
 * Best-effort legal basis for a purpose taken from the Summary list (which has no
 * basis column). The officer confirms/edits the basis per purpose in step 2, so a
 * reasonable guess is enough. Consent-specific signals are checked first.
 */
function guessBasis(text: string): string {
  const t = text.toLowerCase();
  if (/pronoun|dietary|allerg|\bphoto|image|recording|voluntar(y|ily)|newsletter|marketing|invitation link|group chat/.test(t)) return 'consent';
  if (/compl(y|iance)|legal|tax|accounting|regulatory|\bclaims\b|changes to (this|our) privacy/.test(t)) return 'legalObligation';
  if (/improve|records|maintain|assess|internal|quality|coordinate|previous experience|human resources|optimi[sz]|secure|statistic/.test(t)) return 'legitimateInterest';
  return 'contract';
}

function nameFromFilename(filename: string): string {
  let stem = filename.replace(/\.(pdf|docx|txt|md)$/i, '');
  stem = stem.replace(/\(last.?updated.*?\)?|\d{2}[._-]\d{2}[._-]\d{2,4}/gi, '');
  stem = stem.replace(/_/g, ' ').replace(/[()]/g, ' ');
  stem = stem.replace(/\bamended\b|\bdraft\b|\bspecification form\b/gi, '');
  stem = stem.replace(/\b\d{2}-\d{2}\b/g, '').replace(/^[\s\-–.]+|[\s\-–.]+$/g, '');
  stem = stem.replace(/^\d+\.?\d*\s*/, '');
  stem = clean(stem).replace(/^(old )?privacy policy( for\b| the\b|[-–\s])*/i, '');
  return clean(stem).replace(/^[\s\-–.:]+|[\s\-–.:]+$/g, '');
}

function parseDate(filename: string, lines: string[]): string {
  const pat = /last updated[:\s]*([\d]{1,2}[._/-][\d]{1,2}[._/-][\d]{2,4})/i;
  const hays = [filename, ...lines.slice(0, 40)];
  for (const hay of hays) {
    const m = pat.exec(hay) ?? (hay === filename ? /([\d]{1,2}[._/-][\d]{1,2}[._/-][\d]{4})/.exec(hay) : null);
    if (m) {
      const parts = m[1].split(/[._/-]/);
      if (parts.length === 3) {
        const [d, mo, yRaw] = parts;
        const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
        const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
        if (!Number.isNaN(Date.parse(iso))) return iso;
      }
    }
  }
  return '';
}

export function parseUploadedPolicy(text: string, filename: string): GeneratedPreset | null {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  const all = lines.join(' ').toLowerCase();
  if (!all.slice(0, 3000).includes('privacy policy')) return null;
  // Legacy pre-Annex-4 template — its structure predates the Handbook Ch. 4.2 mapping
  if (all.includes('what data do we collect')) return null;

  const idx = sectionSlices(lines);
  const anchors = ['legal', 'applies', 'summary_data', 'summary_purposes', 'collection', 'transfers'].filter((k) => k in idx);
  if (anchors.length < 2) return null; // not recognisably the Annex 4 framework

  // ---- event name: the filename encodes it; fall back to the title line
  let name = nameFromFilename(filename);
  if (!name || name.length < 3) {
    const title = lines.slice(0, 8).find((t) => /privacy policy/i.test(t)) ?? '';
    name = clean(title.replace(/privacy policy( for| -| –|:)?/i, '').replace(/[–-]\s*/, ''));
  }
  if (!name || name.length < 3) return null;

  // ---- summary data categories (literal copy of label + items)
  const categories: { id: string; items: string }[] = [];
  const customCategories: { label: string; items: string }[] = [];
  if ('summary_data' in idx && 'summary_purposes' in idx) {
    const raw = rangeLines(lines, idx['summary_data'] + 1, idx['summary_purposes']);
    for (const b of reflowByParens(raw)) {
      const c = splitCategory(b);
      if (c.id) {
        if (!categories.some((x) => x.id === c.id)) categories.push({ id: c.id, items: c.items });
      } else if (c.custom && c.custom.length >= 3 && c.custom.length < 80) {
        customCategories.push({ label: c.custom, items: c.items });
      }
    }
  }

  // ---- purposes: prefer the Summary "Purposes of the Processing" list — it is a
  // clean single-column list in both PDF and DOCX; the §3 basis TABLE is unreadable
  // once a PDF flattens its columns. Basis is guessed and confirmed by the officer.
  const purposes: { text: string; basis: string }[] = [];
  const addPurpose = (textIn: string, basis: string) => {
    const v = textIn.replace(/[;.]+$/, '').trim();
    if (v.length > 4 && !purposes.some((p) => p.text.toLowerCase() === v.toLowerCase())) purposes.push({ text: v, basis });
  };
  if ('summary_purposes' in idx) {
    const end = idx['summary_rights'] ?? idx['about'] ?? lines.length;
    const raw = rangeLines(lines, idx['summary_purposes'] + 1, end);
    for (const b of reflowVerbBullets(raw)) {
      if (PURPOSE_VERB.test(b)) addPurpose(b, guessBasis(b));
    }
  }
  if (purposes.length === 0 && 'legal' in idx) {
    // Fallback: §3 as prose (clean DOCX layouts) — basis from its lead-in headings.
    const end = idx['retention'] ?? idx['transfers'] ?? lines.length;
    let current: string | null = null;
    for (const t of lines.slice(idx['legal'], end)) {
      const head = BASIS_HEADS.find(([, pat]) => pat.test(t));
      if (head) { current = head[0]; continue; }
      if (!current || t.length <= 5 || t.length >= 300) continue;
      if (/^(you may|the withdrawal|in particular|we |where you|no automated|our justification|legal basis$|purposes$)/i.test(t)) continue;
      if (/to:$/.test(t)) continue;
      addPurpose(t, current);
    }
  }

  // ---- data subjects: "processing of personal data of X"
  const subjects: string[] = [];
  const scanEnd = idx['collection'] ?? Math.min(lines.length, 80);
  for (const t of lines.slice(idx['about'] ?? 0, scanEnd)) {
    for (const m of t.matchAll(/(?:the )?processing of personal data of\s*\[?([^;.\]]{3,70})\]?/gi)) {
      const s = clean(m[1]).replace(/^[\s[\];.]+|[\s[\];.]+$/g, '');
      if (s && !subjects.some((x) => x.toLowerCase() === s.toLowerCase())) subjects.push(s);
    }
  }

  // ---- recipients
  let recipients: string[] = [];
  if ('recipients_list' in idx) {
    const stop = idx['third_country_h'] ?? idx['disclosure'] ?? idx['security'] ?? lines.length;
    recipients = bulletsBetween(lines, idx['recipients_list'] + 1, stop);
  }

  // ---- transfers
  const transfersOutsideEEA = 'third_country_h' in idx;
  let thirdCountries: string[] = [];
  let internationalOrgs: string[] = [];
  if ('countries' in idx) {
    thirdCountries = bulletsBetween(lines, idx['countries'] + 1, idx['countries'] + 8)
      .slice(0, 6)
      .filter((c) => c.length < 60 && !c.toLowerCase().startsWith('in cases'));
  }
  if ('orgs' in idx) {
    internationalOrgs = bulletsBetween(lines, idx['orgs'] + 1, idx['orgs'] + 6)
      .slice(0, 4)
      .filter((o) => o.length < 80 && !o.toLowerCase().startsWith('in cases'));
  }
  // International organisations are never countries
  const IO_RE = /foundation|organisation|organization|council of europe|united nations|\bun\b|world trade|committee|institute|association|european youth/i;
  for (const c of [...thirdCountries]) {
    if (IO_RE.test(c)) {
      thirdCountries = thirdCountries.filter((x) => x !== c);
      if (!internationalOrgs.includes(c)) internationalOrgs.push(c);
    }
  }

  // ---- sources
  const directSources = 'direct' in idx
    ? bulletsBetween(lines, idx['direct'] + 1, idx['indirect'] ?? idx['direct'] + 8) : [];
  const indirectSources = 'indirect' in idx
    ? bulletsBetween(lines, idx['indirect'] + 1, idx['legal'] ?? idx['indirect'] + 6) : [];

  // ---- controller (no ELSA-International defaults here — an upload can be any group)
  const controller = { name: '', address: '', email: '', phone: '' };
  for (const t of lines.slice(0, 60)) {
    let m = /\(ELSA\)\s+([A-ZÀ-Ž][\w’' -]{2,40})[,:]/.exec(t);
    if (m && !m[1].toLowerCase().includes('located')) controller.name = clean(m[1]);
    m = /address:\s*(.+)/i.exec(t);
    if (m) controller.address = clean(m[1]);
    m = /e-?mail:\s*([\w.+-]+@[\w.-]+\w)/i.exec(t);
    if (m && !controller.email) controller.email = m[1];
    m = /phone:\s*(\+?[\d\s()./-]{7,20})/i.exec(t);
    if (m) controller.phone = clean(m[1]);
  }

  return {
    file: filename,
    name,
    area: 'Uploaded policy',
    lastUpdated: parseDate(filename, lines),
    audience: '', // derived from subjects/purposes by toPresetEvent
    controller,
    subjects,
    categories,
    customCategories,
    purposes,
    recipients,
    transfersOutsideEEA,
    thirdCountries,
    internationalOrgs,
    directSources,
    indirectSources,
  };
}
