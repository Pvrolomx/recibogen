export function formatDate(dateStr: string, idioma: 'es' | 'en' | 'fr'): string {
  const date = new Date(dateStr + 'T12:00:00');
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const locale = idioma === 'es' ? 'es-MX' : idioma === 'en' ? 'en-US' : 'fr-FR';
  return date.toLocaleDateString(locale, options);
}

export function formatMoney(amount: number, currency: 'USD' | 'MXN'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
