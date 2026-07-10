/**
 * Word (.docx) export in ELSA style — client-side via the `docx` library.
 * Layout follows the approved LeCercle Supporters policy: ELSA logo top-right on
 * every page, controller contact details + page number in every footer.
 * ELSA navy #0A3087, orange #F5913F. The file contains no generator branding —
 * it is a public-facing document (user decision 2026-07-10).
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
  Header, Footer, ImageRun, PageNumber, Table, TableRow, TableCell, WidthType, VerticalAlign,
} from 'docx';
import { saveAs } from 'file-saver';
import type { PolicyBlock } from '../types';
import logoUrl from '../assets/elsa-logo.png';

const NAVY = '0A3087';
const ORANGE = 'F5913F';
const INK = '1A2233';

export interface DocxContact {
  controllerName: string; // e.g. "ELSA International"
  email: string;
  phone: string;
}

function blockToChildren(b: PolicyBlock): (Paragraph | Table)[] {
  switch (b.kind) {
    case 'title':
      return [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: b.text ?? '', bold: true, size: 48, color: NAVY, font: 'Georgia' })],
      })];
    case 'toc':
      return [
        new Paragraph({
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: 'Contents', bold: true, size: 28, color: NAVY, font: 'Georgia' })],
        }),
        ...(b.entries ?? []).map((e) => new Paragraph({
          spacing: { after: 40 },
          indent: { left: e.match(/^\d/) || e === 'Summary' || e === 'More details' ? 0 : 360 },
          children: [new TextRun({ text: e, size: 20, color: INK })],
        })),
      ];
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
    case 'basisTable': {
      const headerRow = new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 38, type: WidthType.PERCENTAGE },
            shading: { fill: NAVY },
            children: [new Paragraph({ children: [new TextRun({ text: 'Legal basis', bold: true, color: 'FFFFFF', size: 22 })] })],
          }),
          new TableCell({
            width: { size: 62, type: WidthType.PERCENTAGE },
            shading: { fill: NAVY },
            children: [new Paragraph({ children: [new TextRun({ text: 'Purposes', bold: true, color: 'FFFFFF', size: 22 })] })],
          }),
        ],
      });
      const rows = (b.rows ?? []).map((row) => new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({ children: [new TextRun({ text: row.label, bold: true, color: NAVY, size: 22 })] }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [new TextRun({ text: row.lead, size: 18, color: INK })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: row.purposes.map((p) => new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [new TextRun({ text: p, size: 22, color: INK })],
            })),
          }),
        ],
      }));
      return [new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...rows],
      })];
    }
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

export async function exportDocx(blocks: PolicyBlock[], filename: string, contact: DocxContact): Promise<void> {
  const logoData = await fetch(logoUrl).then((r) => r.arrayBuffer());

  const header = new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new ImageRun({
        type: 'png',
        data: logoData,
        transformation: { width: 118, height: 46 },
      })],
    })],
  });

  const footer = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { color: ORANGE, style: BorderStyle.SINGLE, size: 6, space: 4 } },
      children: [
        new TextRun({ text: `${contact.controllerName}`, bold: true, size: 16, color: NAVY }),
        new TextRun({ text: `   e-mail: ${contact.email}${contact.phone ? `   tel.: ${contact.phone}` : ''}   `, size: 16, color: INK }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: INK }),
      ],
    })],
  });

  const doc = new Document({
    creator: 'European Law Students’ Association (ELSA)',
    styles: { default: { document: { run: { font: 'Calibri', size: 22, color: INK } } } },
    sections: [{
      properties: {
        page: { margin: { top: 1000, bottom: 900, left: 1134, right: 1134 } },
      },
      headers: { default: header },
      footers: { default: footer },
      children: blocks.filter((b) => !b.removed).flatMap(blockToChildren),
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
