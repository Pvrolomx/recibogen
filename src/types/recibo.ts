export type Idioma = 'es' | 'en' | 'fr';
export type IdiomaDoc = 'es-en' | 'es-fr' | 'en' | 'fr';
export type FormatoDoc = 'docx' | 'pdf';
export type Lugar = 'puerto_vallarta' | 'riviera_nayarit';

export type MetodoPago = 
  | 'zelle'
  | 'venmo'
  | 'paypal'
  | 'wise'
  | 'stripe'
  | 'wire'
  | 'efectivo'
  | 'otro';

export type ConceptoKey =
  | 'consultoria_legal'
  | 'servicios_migratorios'
  | 'servicios_inmobiliarios'
  | 'consultoria_inmobiliaria'
  | 'representacion_legal'
  | 'asesoria_fiscal'
  | 'fideicomiso'
  | 'otro';

export interface ReciboData {
  cliente: string;
  lugar: Lugar;
  concepto: ConceptoKey;
  conceptoCustom?: string;
  monto: number;
  moneda: 'USD' | 'MXN';
  fechaPago: string;
  metodoPago: MetodoPago;
  referencia?: string;
  notas?: string;
  idiomaDoc: IdiomaDoc;
  formato: FormatoDoc;
  incluirFirma: boolean;
}

export const DEFAULT_RECIBO: ReciboData = {
  cliente: '',
  lugar: 'puerto_vallarta',
  concepto: 'consultoria_legal',
  monto: 0,
  moneda: 'USD',
  fechaPago: new Date().toISOString().slice(0, 10),
  metodoPago: 'zelle',
  referencia: '',
  notas: '',
  idiomaDoc: 'es-en',
  formato: 'pdf',
  incluirFirma: true,
};

export const LUGARES: Record<Lugar, { es: string; en: string; fr: string }> = {
  puerto_vallarta: {
    es: 'Puerto Vallarta, Jalisco',
    en: 'Puerto Vallarta, Jalisco',
    fr: 'Puerto Vallarta, Jalisco',
  },
  riviera_nayarit: {
    es: 'Riviera Nayarit',
    en: 'Riviera Nayarit',
    fr: 'Riviera Nayarit',
  },
};

export const CONCEPTOS: Record<ConceptoKey, { es: string; en: string; fr: string }> = {
  consultoria_legal: {
    es: 'Consultoría legal',
    en: 'Legal consulting',
    fr: 'Consultation juridique',
  },
  servicios_migratorios: {
    es: 'Servicios migratorios',
    en: 'Immigration services',
    fr: "Services d'immigration",
  },
  servicios_inmobiliarios: {
    es: 'Servicios inmobiliarios',
    en: 'Real estate services',
    fr: 'Services immobiliers',
  },
  consultoria_inmobiliaria: {
    es: 'Consultoría inmobiliaria',
    en: 'Real estate consulting',
    fr: 'Consultation immobilière',
  },
  representacion_legal: {
    es: 'Representación legal',
    en: 'Legal representation',
    fr: 'Représentation juridique',
  },
  asesoria_fiscal: {
    es: 'Asesoría fiscal',
    en: 'Tax advisory',
    fr: 'Conseil fiscal',
  },
  fideicomiso: {
    es: 'Servicios de fideicomiso',
    en: 'Trust services',
    fr: 'Services fiduciaires',
  },
  otro: {
    es: 'Otros servicios',
    en: 'Other services',
    fr: 'Autres services',
  },
};

export const METODOS_PAGO: Record<MetodoPago, { es: string; en: string; fr: string }> = {
  zelle: { es: 'Zelle', en: 'Zelle', fr: 'Zelle' },
  venmo: { es: 'Venmo', en: 'Venmo', fr: 'Venmo' },
  paypal: { es: 'PayPal', en: 'PayPal', fr: 'PayPal' },
  wise: { es: 'Wise', en: 'Wise', fr: 'Wise' },
  stripe: { es: 'Tarjeta de crédito', en: 'Credit card', fr: 'Carte de crédit' },
  wire: { es: 'Transferencia bancaria', en: 'Wire transfer', fr: 'Virement bancaire' },
  efectivo: { es: 'Efectivo', en: 'Cash', fr: 'Espèces' },
  otro: { es: 'Otro', en: 'Other', fr: 'Autre' },
};

export const LABELS: Record<string, { es: string; en: string; fr: string }> = {
  recibo: { es: 'RECIBO DE PAGO', en: 'PAYMENT RECEIPT', fr: 'REÇU DE PAIEMENT' },
  lugar: { es: 'Lugar', en: 'Place', fr: 'Lieu' },
  fecha: { es: 'Fecha', en: 'Date', fr: 'Date' },
  cliente: { es: 'Recibido de', en: 'Received from', fr: 'Reçu de' },
  concepto: { es: 'Concepto', en: 'Concept', fr: 'Objet' },
  monto: { es: 'Monto', en: 'Amount', fr: 'Montant' },
  metodo: { es: 'Método de pago', en: 'Payment method', fr: 'Mode de paiement' },
  referencia: { es: 'Referencia', en: 'Reference', fr: 'Référence' },
  notas: { es: 'Notas', en: 'Notes', fr: 'Notes' },
  gracias: { 
    es: 'Gracias por su confianza', 
    en: 'Thank you for your trust', 
    fr: 'Merci pour votre confiance' 
  },
  firma: { es: 'Lic. Rolando Romero García', en: 'Lic. Rolando Romero García', fr: 'Lic. Rolando Romero García' },
  titulo: { es: 'Abogado / Asesor de Expatriados', en: 'Attorney / Expat Advisor', fr: 'Avocat / Conseiller aux expatriés' },
};

export async function loadFirmaBase64(): Promise<string> {
  try {
    const response = await fetch('/firma.b64');
    return await response.text();
  } catch {
    return '';
  }
}

export async function loadLogoBase64(): Promise<string> {
  try {
    const response = await fetch('/logo.b64');
    return await response.text();
  } catch {
    return '';
  }
}
