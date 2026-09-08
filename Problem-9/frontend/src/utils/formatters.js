export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  SGD: 'S$'
};

export const CURRENCY_RATES = {
  INR: 1.0,
  USD: 86.50,
  EUR: 93.20,
  GBP: 110.50,
  AED: 23.55,
  CAD: 61.20,
  AUD: 55.40,
  SGD: 64.80,
  JPY: 0.58
};

export const formatCurrency = (amount, currencyOrShowSymbol = 'INR', maybeShowSymbol = true) => {
  let currency = 'INR';
  let showSymbol = true;

  if (typeof currencyOrShowSymbol === 'boolean') {
    showSymbol = currencyOrShowSymbol;
    currency = 'INR';
  } else if (typeof currencyOrShowSymbol === 'string') {
    currency = currencyOrShowSymbol.toUpperCase();
    showSymbol = maybeShowSymbol;
  }

  const sym = CURRENCY_SYMBOLS[currency] || '₹';
  if (amount === undefined || amount === null || isNaN(amount)) {
    return showSymbol ? `${sym}0.00` : '0.00';
  }

  const locale = currency === 'INR' ? 'en-IN' : currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : currency === 'GBP' ? 'en-GB' : 'en-US';
  const formatted = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const prefix = amount < 0 ? '-' : '';
  return showSymbol ? `${prefix}${sym}${formatted}` : `${prefix}${formatted}`;
};

export const formatTransactionDisplay = (tx) => {
  if (!tx) return '₹0.00';
  if (tx.currency && tx.currency !== 'INR' && tx.original_amount) {
    const orig = formatCurrency(tx.original_amount, tx.currency);
    const inr = formatCurrency(tx.amount, 'INR');
    return `${orig} (${inr})`;
  }
  return formatCurrency(tx.amount, tx.currency || 'INR');
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const toInputDateValue = (date = new Date()) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};
