/**
 * Word (.docx) export in ELSA style — client-side via the `docx` library.
 * ELSA navy #0A3087, orange #F5913F (sampled from the Data Protection Handbook artwork).
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import type { PolicyBlock } from '../types';
import { TEMPLATE_VERSION } from '../data/clauses';

const NAVY = '0A3087';
const ORANGE = 'F5913F';
const INK = '1A2233';

function blockToParagraphs(b: PolicyBlock): Paragraph[] {
  switch (b.kind) {
    case 'title':
      return [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: b.text ?? '', bold: true, size: 56, color: NAVY, font: 'Georgia' })],
      })];
    case 'heading1':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 160 },
        border: { bottom: { color: ORANGE, style: BorderStyle.SINGLE, size: 12, space: 4 } },
        children: [new TextRun({ text: b.text ?? '', bold: true, size: 34, color: NAVY, font: 'Georgia' })],
      })];
    case 'heading2':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        children: [new TextRun({ text: b.text ?? '', bold: true, size: 27, color: NAVY, font: 'Georgia' })],
      })];
    case 'heading3':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: b.text ?? '', bold: true, size: 23, color: ORANGE, font: 'Georgia' })],
      })];
    case 'bullets':
      return (b.bullets ?? []).map((t) => new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: t, size: 22, color: INK })],
      }));
    case 'basisLead':
      return [new Paragraph({
        spacing: { before: 160, after: 100 },
        alignment: AlignmentType.JUSTIFIED,
        border: { left: { color: ORANGE, style: BorderStyle.SINGLE, size: 18, space: 8 } },
        children: [
          new TextRun({ text: `▸ ${b.label ?? ''}: `, bold: true, size: 22, color: ORANGE }),
          new TextRun({ text: b.text ?? '', size: 22, color: INK }),
        ],
      })];
    case 'notice':
      return [new Paragraph({
        spacing: { before: 200, after: 200 },
        border: {
          top: { color: ORANGE, style: BorderStyle.SINGLE, size: 8, space: 6 },
          bottom: { color: ORANGE, style: BorderStyle.SINGLE, size: 8, space: 6 },
        },
        children: [new TextRun({ text: b.text ?? '', italics: true, size: 18, color: INK })],
      })];
    default:
      return [new Paragraph({
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: b.text ?? '', size: 22, color: INK })],
      })];
  }
}

export async function exportDocx(blocks: PolicyBlock[], filename: string): Promise<void> {
  // Provenance lives in invisible document properties (user decision 2026-07-10:
  // data subjects reading the published policy should not see generator notices).
  const doc = new Document({
    creator: 'elsaiprivacypolicy (deterministic generator)',
    subject: `Template set ${TEMPLATE_VERSION} — generated ${new Date().toISOString().slice(0, 10)}`,
    description:
      'Generated draft privacy policy — an aid only, not legal advice; no claim of completeness or legal validity. ' +
      'National laws must be observed. Review by a qualified person required before use. Questions: dataprotection@elsa.org.',
    styles: { default: { document: { run: { font: 'Calibri', size: 22, color: INK } } } },
    sections: [{
      properties: {
        page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
      },
      children: blocks.filter((b) => !b.removed).flatMap(blockToParagraphs),
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
