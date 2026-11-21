export const money = (n: number, decimals = 0) =>
  (n < 0 ? '−$' : '$') +
  Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const pct = (n: number) => `${Math.round(n * 100)}%`;

export const qty = (n: number, unit: string) =>
  `${n.toLocaleString('es-MX', { maximumFractionDigits: unit === 'kg' ? 2 : 0 })} ${unit}`;
