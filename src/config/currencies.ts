export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  rateToEUR: number;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'EUR', symbol: '€', label: 'Euro', rateToEUR: 1 },
  { code: 'USD', symbol: '$', label: 'Dollar US', rateToEUR: 0.92 },
  { code: 'GBP', symbol: '£', label: 'Livre sterling', rateToEUR: 1.17 },
  { code: 'CHF', symbol: 'CHF', label: 'Franc suisse', rateToEUR: 1.05 },
  { code: 'MAD', symbol: 'MAD', label: 'Dirham marocain', rateToEUR: 0.093 },
  { code: 'TND', symbol: 'TND', label: 'Dinar tunisien', rateToEUR: 0.30 },
  { code: 'CAD', symbol: 'CA$', label: 'Dollar canadien', rateToEUR: 0.68 },
  { code: 'JPY', symbol: '¥', label: 'Yen japonais', rateToEUR: 0.0061 },
  { code: 'CNY', symbol: '¥', label: 'Yuan chinois', rateToEUR: 0.13 },
  { code: 'AED', symbol: 'AED', label: 'Dirham émirati', rateToEUR: 0.25 },
  { code: 'SAR', symbol: 'SAR', label: 'Riyal saoudien', rateToEUR: 0.25 },
  { code: 'SEK', symbol: 'kr', label: 'Couronne suédoise', rateToEUR: 0.088 },
  { code: 'NOK', symbol: 'kr', label: 'Couronne norvégienne', rateToEUR: 0.085 },
  { code: 'DKK', symbol: 'kr', label: 'Couronne danoise', rateToEUR: 0.134 },
  { code: 'PLN', symbol: 'zł', label: 'Zloty polonais', rateToEUR: 0.23 },
];

export const DEFAULT_CURRENCY = 'EUR';

export function getCurrency(code: string): CurrencyConfig {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]!;
}

export function convertToEUR(amount: number, fromCurrency: string): number {
  const config = getCurrency(fromCurrency);
  return amount * config.rateToEUR;
}

export function formatAmount(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
