/**
 * Show KYC dates as DD-MM-YYYY (common on Indian DLs). Parses API values like
 * YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, or ISO datetimes.
 */
export function formatKycDateDisplay(raw: string | undefined | null): string {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (!s || s === '-') return s;

  if (s.includes('T')) {
    s = s.split('T')[0] ?? s;
  }

  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const [, y, mo, d] = ymd;
    return `${d}-${mo}-${y}`;
  }

  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    return `${dd}-${mm}-${dmy[3]}`;
  }

  return s;
}
