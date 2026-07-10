/**
 * In-browser text extraction for uploaded files — PDF (incl. JotForm PDF exports),
 * Word .docx (incl. files downloaded/exported from Google Drive), and plain text.
 * Everything runs locally; no file ever leaves the browser.
 */

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }
  if (name.endsWith('.pdf')) {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((it) => ('str' in it ? it.str : ''))
          .join(' '),
      );
    }
    return pages.join('\n');
  }
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) {
    return file.text();
  }
  if (name.endsWith('.doc')) {
    throw new Error('Legacy .doc files are not supported — please save as .docx (File → Save As in Word, or File → Download → Microsoft Word in Google Docs) and upload again.');
  }
  throw new Error(`Unsupported file type: ${file.name}. Upload a PDF, Word (.docx) or text file.`);
}
