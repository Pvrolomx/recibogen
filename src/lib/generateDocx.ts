import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  WidthType,
  BorderStyle,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import type { ReciboData, IdiomaDoc } from '@/types/recibo';
import { CONCEPTOS, METODOS_PAGO, LABELS, LUGARES, loadFirmaBase64 } from '@/types/recibo';
import { formatDate, formatMoney } from './utils';

type Lang = 'es' | 'en' | 'fr';

function getIdiomas(idiomaDoc: IdiomaDoc): [Lang, Lang | null] {
  switch (idiomaDoc) {
    case 'es-en': return ['es', 'en'];
    case 'es-fr': return ['es', 'fr'];
    case 'en': return ['en', null];
    case 'fr': return ['fr', null];
    default: return ['es', 'en'];
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bilingualRow(
  label: { es: string; en: string; fr: string },
  value1: string,
  value2: string | null,
  idiomas: [Lang, Lang | null],
  opts: { bold?: boolean; size?: number; shade?: boolean } = {}
): TableRow {
  const { bold = false, size = 22, shade = false } = opts;
  const [lang1, lang2] = idiomas;
  
  const cells: TableCell[] = [];
  
  cells.push(
    new TableCell({
      width: { size: lang2 ? 50 : 100, type: WidthType.PERCENTAGE },
      shading: shade ? { fill: 'F5F5F5', type: 'clear' as any } : undefined,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        right: { style: BorderStyle.SINGLE, size: 1, color: lang2 ? 'C9A84C' : 'E5E5E5' },
      },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: label[lang1] + ': ', bold: true, size, font: 'Arial' }),
            new TextRun({ text: value1, bold, size, font: 'Arial' }),
          ],
        }),
      ],
    })
  );
  
  if (lang2 && value2 !== null) {
    cells.push(
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        shading: shade ? { fill: 'F5F5F5', type: 'clear' as any } : undefined,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
          left: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
        },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: label[lang2] + ': ', bold: true, size, font: 'Arial' }),
              new TextRun({ text: value2, bold, size, font: 'Arial' }),
            ],
          }),
        ],
      })
    );
  }
  
  return new TableRow({ children: cells });
}

export async function generateReciboDocx(data: ReciboData): Promise<Blob> {
  const idiomas = getIdiomas(data.idiomaDoc);
  const [lang1, lang2] = idiomas;
  
  let firmaBase64 = '';
  if (data.incluirFirma) {
    firmaBase64 = await loadFirmaBase64();
  }
  
  const conceptoText1 = data.concepto === 'otro' 
    ? (data.conceptoCustom || CONCEPTOS.otro[lang1])
    : CONCEPTOS[data.concepto][lang1];
  const conceptoText2 = lang2 
    ? (data.concepto === 'otro' 
        ? (data.conceptoCustom || CONCEPTOS.otro[lang2])
        : CONCEPTOS[data.concepto][lang2])
    : null;
  
  const montoStr = formatMoney(data.monto, data.moneda);
  
  const rows: TableRow[] = [];
  
  // Lugar en vez de número
  rows.push(bilingualRow(LABELS.lugar, LUGARES[data.lugar][lang1], lang2 ? LUGARES[data.lugar][lang2] : null, idiomas, { shade: true }));
  rows.push(bilingualRow(LABELS.fecha, formatDate(data.fechaPago, lang1), lang2 ? formatDate(data.fechaPago, lang2) : null, idiomas));
  rows.push(bilingualRow(LABELS.cliente, data.cliente, data.cliente, idiomas));
  rows.push(bilingualRow(LABELS.concepto, conceptoText1, conceptoText2, idiomas));
  rows.push(bilingualRow(LABELS.monto, montoStr, montoStr, idiomas, { bold: true, size: 26, shade: true }));
  rows.push(bilingualRow(LABELS.metodo, METODOS_PAGO[data.metodoPago][lang1], lang2 ? METODOS_PAGO[data.metodoPago][lang2] : null, idiomas));
  
  if (data.referencia) {
    rows.push(bilingualRow(LABELS.referencia, data.referencia, data.referencia, idiomas));
  }
  
  if (data.notas) {
    rows.push(bilingualRow(LABELS.notas, data.notas, data.notas, idiomas));
  }
  
  const firmaElements: Paragraph[] = [];
  
  if (data.incluirFirma && firmaBase64) {
    firmaElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
          new ImageRun({
            data: base64ToUint8Array(firmaBase64),
            transformation: { width: 150, height: 75 },
            type: 'jpg',
          }),
        ],
      })
    );
  } else {
    firmaElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [
          new TextRun({ text: '________________________', size: 20, font: 'Arial', color: 'CCCCCC' }),
        ],
      })
    );
  }
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: 'EXPAT ADVISOR MX', bold: true, size: 32, font: 'Arial', color: '1a1a1a' }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({ text: 'Puerto Vallarta · Riviera Nayarit', size: 20, font: 'Arial', color: '666666', italics: true }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 400 },
          children: [
            new TextRun({ 
              text: lang2 ? `${LABELS.recibo[lang1]} / ${LABELS.recibo[lang2]}` : LABELS.recibo[lang1],
              bold: true, size: 28, font: 'Arial', color: 'C9A84C',
            }),
          ],
        }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [
            new TextRun({ 
              text: lang2 ? `${LABELS.gracias[lang1]} / ${LABELS.gracias[lang2]}` : LABELS.gracias[lang1],
              size: 22, font: 'Arial', italics: true, color: '666666',
            }),
          ],
        }),
        ...firmaElements,
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [
            new TextRun({ text: LABELS.firma.es, bold: true, size: 22, font: 'Arial' }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ 
              text: lang2 ? `${LABELS.titulo[lang1]} / ${LABELS.titulo[lang2]}` : LABELS.titulo[lang1],
              size: 18, font: 'Arial', color: '666666',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          children: [
            new TextRun({ text: 'expatadvisormx.com', size: 16, font: 'Arial', color: 'C9A84C' }),
          ],
        }),
      ],
    }],
  });
  
  return await Packer.toBlob(doc);
}
