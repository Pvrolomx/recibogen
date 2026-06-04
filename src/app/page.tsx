'use client';

import { useState, useEffect } from 'react';
import type { ReciboData, ConceptoKey, MetodoPago, IdiomaDoc, FormatoDoc } from '@/types/recibo';
import { DEFAULT_RECIBO, CONCEPTOS, METODOS_PAGO } from '@/types/recibo';

export default function Home() {
  const [data, setData] = useState<ReciboData>(DEFAULT_RECIBO);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const updateData = (partial: Partial<ReciboData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setGenerated(false);
  };

  // Auto-save to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recibogen_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) setData(parsed.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem('recibogen_draft', JSON.stringify({ data }));
      } catch {}
    }, 1000);
    return () => clearTimeout(t);
  }, [data]);

  const handleGenerate = async () => {
    if (!data.cliente || data.monto <= 0) {
      alert('Por favor completa al menos el cliente y el monto');
      return;
    }

    setLoading(true);
    try {
      let blob: Blob;
      let ext: string;

      if (data.formato === 'pdf') {
        const { generateReciboPdf } = await import('@/lib/generatePdf');
        blob = await generateReciboPdf(data);
        ext = 'pdf';
      } else {
        const { generateReciboDocx } = await import('@/lib/generateDocx');
        blob = await generateReciboDocx(data);
        ext = 'docx';
      }

      const nombreLimpio = data.cliente.split(' ')[0].toUpperCase() || 'RECIBO';
      const fecha = new Date().toISOString().slice(0, 10);
      const filename = `RECIBO_${nombreLimpio}_${fecha}.${ext}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setGenerated(true);
    } catch (e) {
      console.error(e);
      alert('Error generando el recibo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(DEFAULT_RECIBO);
    setGenerated(false);
    try { localStorage.removeItem('recibogen_draft'); } catch {}
  };

  const canGenerate = data.cliente && data.monto > 0;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light tracking-wide text-gray-800 mb-1">
            RECIBOGEN
          </h1>
          <p className="text-gray-400 text-sm">Generador de Recibos de Pago</p>
          <p className="text-brand-gold text-xs mt-1">Expat Advisor MX</p>
        </div>

        {/* Form Card */}
        <div className="rg-card space-y-6">
          {/* Cliente */}
          <div>
            <label className="rg-label">Cliente / Client</label>
            <input
              type="text"
              className="rg-input"
              placeholder="Nombre completo"
              value={data.cliente}
              onChange={(e) => updateData({ cliente: e.target.value })}
            />
          </div>

          {/* Concepto */}
          <div>
            <label className="rg-label">Concepto / Concept</label>
            <select
              className="rg-select"
              value={data.concepto}
              onChange={(e) => updateData({ concepto: e.target.value as ConceptoKey })}
            >
              {Object.entries(CONCEPTOS).map(([key, labels]) => (
                <option key={key} value={key}>
                  {labels.es} / {labels.en}
                </option>
              ))}
            </select>
          </div>

          {/* Campo custom si es "otro" */}
          {data.concepto === 'otro' && (
            <div>
              <label className="rg-label">Especificar concepto</label>
              <input
                type="text"
                className="rg-input"
                placeholder="Descripción del servicio"
                value={data.conceptoCustom || ''}
                onChange={(e) => updateData({ conceptoCustom: e.target.value })}
              />
            </div>
          )}

          {/* Monto y Moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="rg-label">Monto / Amount</label>
              <input
                type="number"
                className="rg-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={data.monto || ''}
                onChange={(e) => updateData({ monto: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="rg-label">Moneda</label>
              <select
                className="rg-select"
                value={data.moneda}
                onChange={(e) => updateData({ moneda: e.target.value as 'USD' | 'MXN' })}
              >
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="rg-label">Fecha de pago / Payment date</label>
            <input
              type="date"
              className="rg-input"
              value={data.fechaPago}
              onChange={(e) => updateData({ fechaPago: e.target.value })}
            />
          </div>

          {/* Método de pago */}
          <div>
            <label className="rg-label">Método de pago / Payment method</label>
            <div className="rg-radio-group">
              {Object.entries(METODOS_PAGO).map(([key, labels]) => (
                <div key={key} className="rg-radio-option">
                  <input
                    type="radio"
                    id={`metodo-${key}`}
                    name="metodoPago"
                    value={key}
                    checked={data.metodoPago === key}
                    onChange={() => updateData({ metodoPago: key as MetodoPago })}
                  />
                  <label htmlFor={`metodo-${key}`}>{labels.es}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Referencia */}
          <div>
            <label className="rg-label">Referencia (opcional)</label>
            <input
              type="text"
              className="rg-input"
              placeholder="No. de confirmación, transacción, etc."
              value={data.referencia || ''}
              onChange={(e) => updateData({ referencia: e.target.value })}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="rg-label">Notas (opcional)</label>
            <textarea
              className="rg-input resize-none"
              rows={2}
              placeholder="Notas adicionales"
              value={data.notas || ''}
              onChange={(e) => updateData({ notas: e.target.value })}
            />
          </div>

          {/* Separador */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Opciones del documento</p>
            
            {/* Idioma */}
            <div className="mb-4">
              <label className="rg-label">Idioma del recibo</label>
              <div className="rg-radio-group">
                <div className="rg-radio-option">
                  <input type="radio" id="idioma-es-en" name="idioma" value="es-en"
                    checked={data.idiomaDoc === 'es-en'}
                    onChange={() => updateData({ idiomaDoc: 'es-en' })}
                  />
                  <label htmlFor="idioma-es-en">🇲🇽🇺🇸 ES+EN</label>
                </div>
                <div className="rg-radio-option">
                  <input type="radio" id="idioma-es-fr" name="idioma" value="es-fr"
                    checked={data.idiomaDoc === 'es-fr'}
                    onChange={() => updateData({ idiomaDoc: 'es-fr' })}
                  />
                  <label htmlFor="idioma-es-fr">🇲🇽🇫🇷 ES+FR</label>
                </div>
                <div className="rg-radio-option">
                  <input type="radio" id="idioma-en" name="idioma" value="en"
                    checked={data.idiomaDoc === 'en'}
                    onChange={() => updateData({ idiomaDoc: 'en' })}
                  />
                  <label htmlFor="idioma-en">🇺🇸 EN</label>
                </div>
                <div className="rg-radio-option">
                  <input type="radio" id="idioma-fr" name="idioma" value="fr"
                    checked={data.idiomaDoc === 'fr'}
                    onChange={() => updateData({ idiomaDoc: 'fr' })}
                  />
                  <label htmlFor="idioma-fr">🇫🇷 FR</label>
                </div>
              </div>
            </div>

            {/* Formato */}
            <div>
              <label className="rg-label">Formato de salida</label>
              <div className="rg-radio-group">
                <div className="rg-radio-option">
                  <input type="radio" id="formato-pdf" name="formato" value="pdf"
                    checked={data.formato === 'pdf'}
                    onChange={() => updateData({ formato: 'pdf' })}
                  />
                  <label htmlFor="formato-pdf">📄 PDF</label>
                </div>
                <div className="rg-radio-option">
                  <input type="radio" id="formato-docx" name="formato" value="docx"
                    checked={data.formato === 'docx'}
                    onChange={() => updateData({ formato: 'docx' })}
                  />
                  <label htmlFor="formato-docx">📝 DOCX</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !canGenerate}
            className="rg-btn-primary"
          >
            {loading ? 'Generando...' : generated ? '✓ Descargar de nuevo' : 'Generar Recibo'}
          </button>
          
          <button onClick={handleReset} className="rg-btn-secondary">
            Limpiar formulario
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-300 text-xs mt-8 tracking-wider">
          EXPAT ADVISOR MX · PUERTO VALLARTA · 2026
        </p>
      </div>
    </div>
  );
}
