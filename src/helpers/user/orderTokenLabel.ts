/**
 * Returns the token prefix for order display (Order ID line and Token Quantity) based on type.
 * - Fractional Property → LBITTF
 * - Equity (type or equityEnable) → LBITTE
 * - Full / default → LBITT
 */
export const getOrderTokenPrefix = (item: { type?: string; equityEnable?: boolean } | null | undefined): string => {
  if (!item) return 'LBITT';
  const type = (item.type || '').trim();
  const isEquity = item.equityEnable === true || /equity/i.test(type);
  if (type === 'Fractional Property') return 'LBITTF';
  if (isEquity || type === 'Equity') return 'LBITTE';
  return 'LBITT';
};
