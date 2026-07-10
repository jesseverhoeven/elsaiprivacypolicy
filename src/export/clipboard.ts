/**
 * "Copy for Google Docs" — writes the assembled policy to the clipboard as rich
 * HTML (plus a plain-text fallback), so pasting into a new Google Doc keeps
 * headings, bullets and ELSA colours. No Google API, no external calls
 * (user decision D, 2026-07-10).
 */

import type { PolicyBlock } from '../types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function blocksToHtml(blocks: PolicyBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.removed) continue;
    switch (b.kind) {
      case 'title':
        parts.push(`<h1 style="color:#0A3087;font-family:Georgia,serif;text-align:center;">${esc(b.text ?? '')}</h1>`);
        break;
      case 'heading1':
        parts.push(`<h1 style="color:#0A3087;font-family:Georgia,serif;border-bottom:2px solid #F5913F;padding-bottom:4px;">${esc(b.text ?? '')}</h1>`);
        break;
      case 'heading2':
        parts.push(`<h2 style="color:#0A3087;font-family:Georgia,serif;">${esc(b.text ?? '')}</h2>`);
        break;
      case 'heading3':
        parts.push(`<h3 style="color:#F5913F;font-family:Georgia,serif;">${esc(b.text ?? '')}</h3>`);
        break;
      case 'basisLead':
        parts.push(
          `<p style="text-align:justify;border-left:3px solid #F5913F;padding-left:10px;">` +
          `<b style="color:#F5913F;">▸ ${esc(b.label ?? '')}:</b> ${esc(b.text ?? '')}</p>`,
        );
        break;
      case 'bullets':
        parts.push(`<ul>${(b.bullets ?? []).map((t) => `<li style="text-align:justify;">${esc(t)}</li>`).join('')}</ul>`);
        break;
      case 'notice':
        parts.push(`<p style="font-style:italic;font-size:0.85em;border-top:1px solid #F5913F;border-bottom:1px solid #F5913F;padding:6px 0;">${esc(b.text ?? '')}</p>`);
        break;
      default:
        parts.push(`<p style="text-align:justify;">${esc(b.text ?? '')}</p>`);
    }
  }
  return `<div style="font-family:Calibri,Arial,sans-serif;color:#1A2233;">${parts.join('\n')}</div>`;
}

export function blocksToPlainText(blocks: PolicyBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.removed) continue;
    if (b.kind === 'basisLead') parts.push(`${b.label}: ${b.text}`);
    else if (b.kind === 'bullets') parts.push((b.bullets ?? []).map((t) => `  • ${t}`).join('\n'));
    else if (b.kind.startsWith('heading') || b.kind === 'title') parts.push(`\n${(b.text ?? '').toUpperCase()}\n`);
    else parts.push(b.text ?? '');
  }
  return parts.join('\n');
}

export async function copyForGoogleDocs(blocks: PolicyBlock[]): Promise<void> {
  const html = blocksToHtml(blocks);
  const text = blocksToPlainText(blocks);
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    }),
  ]);
}
