import jsPDF from 'jspdf';
import type { ReciboData, IdiomaDoc } from '@/types/recibo';
import { CONCEPTOS, METODOS_PAGO, LABELS, FIRMA_BASE64 } from '@/types/recibo';
import { formatDate, formatMoney, generateReciboNumber } from './utils';

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

export async function generateReciboPdf(data: ReciboData): Promise<Blob> {
  const idiomas = getIdiomas(data.idiomaDoc);
  const [lang1, lang2] = idiomas;
  const reciboNum = generateReciboNumber();
  const isBilingual = lang2 !== null;
  
  const conceptoText1 = data.concepto === 'otro' 
    ? (data.conceptoCustom || CONCEPTOS.otro[lang1])
    : CONCEPTOS[data.concepto][lang1];
  const conceptoText2 = lang2 
    ? (data.concepto === 'otro' 
        ? (data.conceptoCustom || CONCEPTOS.otro[lang2])
        : CONCEPTOS[data.concepto][lang2])
    : null;
  
  const montoStr = formatMoney(data.monto, data.moneda);
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);
  const labelWidth = 45;
  
  let y = margin;
  
  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(26, 26, 26);
  doc.text('EXPAT ADVISOR MX', pageWidth / 2, y, { align: 'center' });
  
  y += 7;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.text('Puerto Vallarta · Riviera Nayarit', pageWidth / 2, y, { align: 'center' });
  
  // Línea decorativa
  y += 10;
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  
  // Título del recibo
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(201, 168, 76);
  const titulo = isBilingual 
    ? `${LABELS.recibo[lang1]} / ${LABELS.recibo[lang2!]}`
    : LABELS.recibo[lang1];
  doc.text(titulo, pageWidth / 2, y, { align: 'center' });
  
  // Contenido
  y += 20;
  const rowHeight = 12;
  
  function drawRow(
    label: { es: string; en: string; fr: string },
    value1: string,
    value2: string | null,
    highlight: boolean = false
  ) {
    if (highlight) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 4, contentWidth, rowHeight, 'F');
    }
    
    // Columna 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    doc.text(label[lang1] + ':', margin + 2, y + 2);
    
    doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    doc.setFontSize(highlight ? 12 : 10);
    doc.text(value1, margin + labelWidth, y + 2);
    
    // Columna 2 (si es bilingüe)
    if (isBilingual && value2 !== null) {
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.3);
      doc.line(pageWidth / 2, y - 4, pageWidth / 2, y + rowHeight - 4);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      doc.text(label[lang2!] + ':', pageWidth / 2 + 5, y + 2);
      
      doc.setFont('helvetica', highlight ? 'bold' : 'normal');
      doc.setFontSize(highlight ? 12 : 10);
      doc.text(value2, pageWidth / 2 + labelWidth + 3, y + 2);
    }
    
    // Línea inferior
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight - 4, pageWidth - margin, y + rowHeight - 4);
    
    y += rowHeight;
  }
  
  // Filas de datos
  drawRow(LABELS.numero, reciboNum, reciboNum, true);
  drawRow(LABELS.fecha, formatDate(data.fechaPago, lang1), lang2 ? formatDate(data.fechaPago, lang2) : null);
  drawRow(LABELS.cliente, data.cliente, data.cliente);
  drawRow(LABELS.concepto, conceptoText1, conceptoText2);
  drawRow(LABELS.monto, montoStr, montoStr, true);
  drawRow(LABELS.metodo, METODOS_PAGO[data.metodoPago][lang1], lang2 ? METODOS_PAGO[data.metodoPago][lang2] : null);
  
  if (data.referencia) {
    drawRow(LABELS.referencia, data.referencia, data.referencia);
  }
  
  if (data.notas) {
    drawRow(LABELS.notas, data.notas, data.notas);
  }
  
  // Gracias
  y += 20;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(102, 102, 102);
  const gracias = isBilingual 
    ? `${LABELS.gracias[lang1]} / ${LABELS.gracias[lang2!]}`
    : LABELS.gracias[lang1];
  doc.text(gracias, pageWidth / 2, y, { align: 'center' });
  
  // Firma (imagen o línea)
  y += 15;
  
  if (data.incluirFirma) {
    // Agregar imagen de firma
    try {
      doc.addImage(
        `data:image/jpeg;base64,${FIRMA_BASE64}`,
        'JPEG',
        pageWidth / 2 - 25,
        y,
        50,
        25
      );
      y += 30;
    } catch (e) {
      // Fallback a línea si falla la imagen
      doc.setDrawColor(204, 204, 204);
      doc.setLineWidth(0.3);
      doc.line(pageWidth / 2 - 40, y + 10, pageWidth / 2 + 40, y + 10);
      y += 18;
    }
  } else {
    // Solo línea para firma manual
    doc.setDrawColor(204, 204, 204);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 40, y + 10, pageWidth / 2 + 40, y + 10);
    y += 18;
  }
  
  // Nombre y título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 26);
  doc.text(LABELS.firma.es, pageWidth / 2, y, { align: 'center' });
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  const titulo2 = isBilingual 
    ? `${LABELS.titulo[lang1]} / ${LABELS.titulo[lang2!]}`
    : LABELS.titulo[lang1];
  doc.text(titulo2, pageWidth / 2, y, { align: 'center' });
  
  // Footer
  y = pageHeight - 15;
  doc.setFontSize(9);
  doc.setTextColor(201, 168, 76);
  doc.text('expatadvisormx.com', pageWidth / 2, y, { align: 'center' });
  
  return doc.output('blob');
}
