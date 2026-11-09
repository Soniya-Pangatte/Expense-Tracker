/**
 * SpendWise Supported Payment Methods & Transaction Sources
 */

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Net Banking',
  'Wallet',
  'Other',
];

export const TRANSACTION_SOURCES = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'receipt', label: 'Receipt Scan' },
  { value: 'bank', label: 'Bank Statement Import' },
  { value: 'recurring', label: 'Recurring Transaction' },
  { value: 'other', label: 'Other' },
];

export function getSourceLabel(source) {
  if (!source) return 'Manual Entry';
  const s = source.toLowerCase();
  if (s.includes('receipt')) return 'Receipt Scan';
  if (s.includes('bank')) return 'Bank Statement Import';
  if (s.includes('recurring')) return 'Recurring Transaction';
  if (s.includes('other')) return 'Other';
  return 'Manual Entry';
}

export function normalizeSourceValue(source) {
  if (!source) return 'manual';
  const s = source.toLowerCase();
  if (s.includes('receipt')) return 'receipt';
  if (s.includes('bank')) return 'bank';
  if (s.includes('recurring')) return 'recurring';
  if (s.includes('other')) return 'other';
  return 'manual';
}

