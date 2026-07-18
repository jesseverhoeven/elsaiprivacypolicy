/**
 * "Copy for Google Docs" — writes the assembled policy to the clipboard as rich
 * HTML (plus a plain-text fallback), so pasting into a new Google Doc keeps
 * headings, bullets and ELSA colours. No Google API, no external calls
 * (user decision D, 2026-07-10).
 *
 * Google Docs cannot receive page headers/footers or page numbers through a
 * clipboard paste (those live outside the document body), so — unlike Word/PDF —
 * the controller contact line is pasted inline at the very bottom, keeping the
 * closing contact details that would otherwise be lost. No logo is added: a
 * single big logo in the body looked wrong, and a paste can't put it in the page
 * header on every page (user request 2026-07-18).
 */

import type { PolicyBlock } from '../types';
import type { DocxContact } from './docxExport';

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
      case 'toc':
        parts.push(
          `<h2 style="color:#0A3087;font-family:Georgia,serif;">Contents</h2>` +
          `<ul style="list-style:none;padding-left:0;">${(b.entries ?? [])
            .map((e) => `<li style="${/^\d/.test(e) || e === 'Summary' || e === 'More details' ? '' : 'padding-left:18px;'}">${esc(e)}</li>`)
            .join('')}</ul>`,
        );
        break;
      case 'basisTable':
        parts.push(
          `<table style="border-collapse:collapse;width:100%;">` +
          `<tr><th style="background:#0A3087;color:#fff;text-align:left;padding:6px 10px;border:1px solid #0A3087;">Legal basis</th>` +
          `<th style="background:#0A3087;color:#fff;text-align:left;padding:6px 10px;border:1px solid #0A3087;">Purposes</th></tr>` +
          (b.rows ?? [])
            .map((row) =>
              `<tr><td style="border:1px solid #0A3087;padding:6px 10px;vertical-align:top;width:38%;">` +
              `<b style="color:#0A3087;">${esc(row.label)}</b><br/><span style="font-size:0.85em;text-align:left;display:block;">${esc(row.lead)}</span></td>` +
              `<td style="border:1px solid #0A3087;padding:6px 10px;vertical-align:top;">` +
              `<ul>${row.purposes.map((p) => `<li style="text-align:left;">${esc(p)}</li>`).join('')}</ul></td></tr>`,
            )
            .join('') +
          `</table>`,
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
    if (b.kind === 'toc') parts.push('CONTENTS\n' + (b.entries ?? []).join('\n'));
    else if (b.kind === 'basisTable')
      parts.push((b.rows ?? []).map((r) => `${r.label}: ${r.lead}\n${r.purposes.map((p) => `  • ${p}`).join('\n')}`).join('\n\n'));
    else if (b.kind === 'bullets') parts.push((b.bullets ?? []).map((t) => `  • ${t}`).join('\n'));
    else if (b.kind.startsWith('heading') || b.kind === 'title') parts.push(`\n${(b.text ?? '').toUpperCase()}\n`);
    else parts.push(b.text ?? '');
  }
  return parts.join('\n');
}

/** Closing contact line, matching the Word/PDF footer (page numbers can only be
 *  added from the Google Docs Insert menu, so they are not included here). */
function footerHtml(contact: DocxContact): string {
  const tel = contact.phone ? `&nbsp;&nbsp;&nbsp;tel.: ${esc(contact.phone)}` : '';
  return (
    `<p style="text-align:center;font-size:0.8em;border-top:1px solid #F5913F;padding-top:6px;margin-top:18px;">` +
    `<b style="color:#0A3087;">${esc(contact.controllerName)}</b>&nbsp;&nbsp;&nbsp;e-mail: ${esc(contact.email)}${tel}</p>`
  );
}

function footerText(contact: DocxContact): string {
  const tel = contact.phone ? `   tel.: ${contact.phone}` : '';
  return `\n\n${contact.controllerName}   e-mail: ${contact.email}${tel}`;
}

export async function copyForGoogleDocs(blocks: PolicyBlock[], contact: DocxContact): Promise<void> {
  const inner = blocksToHtml(blocks);
  // Append the contact line just before the wrapping <div> closes. No logo at the
  // top: a paste can't put it in the page header on every page (a Docs page
  // setting), and a single big logo in the body looked wrong (user request
  // 2026-07-18). The function replacer avoids any `$` in the contact text being
  // read as a replacement pattern.
  const html = inner.replace(/<\/div>$/, () => footerHtml(contact) + '</div>');
  const text = blocksToPlainText(blocks) + footerText(contact);
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    }),
  ]);
}
