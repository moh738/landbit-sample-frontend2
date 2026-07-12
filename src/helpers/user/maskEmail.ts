export const maskEmail = (email: string, maxLength: number = 20): string => {
  if (!email || !email?.includes('@')) {
    return 'Invalid email';
  }
  if (email?.length <= maxLength) {
    return email;
  }

  const [localPart, domain] = email?.split('@');
  if (!localPart || !domain) return 'Invalid email';
  const shortLocal = localPart?.slice(0, 2) + '..';
  const domainParts = domain?.split('.');
  const mainDomain = domainParts[0];
  const tld = domainParts?.slice(1).join('.');
  const shortDomain = mainDomain?.slice(0, 3) + '..' + (tld ? `.${tld}` : '');
  return `${shortLocal}@${shortDomain}`;
};

export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return '';
  return text?.charAt(0)?.toUpperCase() + text?.slice(1);
};

export const capitalizeEachWord = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatCurrency = (
  value: number | string | undefined,
  currency: 'INR' | 'USD' | 'EUR' = 'INR',
  useShortForm = false
): string => {
  const num = Number(value) || 0;

  if (useShortForm) {
    if (Math?.abs(num) >= 1.0e12) {
      return (num / 1.0e12)?.toFixed(2) + 'T';
    }
    if (Math?.abs(num) >= 1.0e9) {
      return (num / 1.0e9)?.toFixed(2) + 'B';
    }
    if (Math?.abs(num) >= 1.0e6) {
      return (num / 1.0e6)?.toFixed(2) + 'M';
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(num);
};

export const truncateMiddle = (value: string, max = 20) => {
  if (!value) return '';
  if (value.length <= max) return value;

  const keep = max - 6; // minus "..."
  const start = Math.ceil(keep / 2);
  const end = Math.floor(keep / 2);

  return value.slice(0, start) + '...' + value.slice(-end);
};

/** Truncate display name with ellipsis for UI (e.g. header). Default max 25 chars. */
export const truncateDisplayName = (name: string, maxLength: number = 25): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trim() + '…';
};

export const formatCurrencyDecimal = (value: number | string): string => {
  if (!value) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
};

export const formatAmount = (value: number | string | undefined | null): string => {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return '';

  const [integer, decimal] = num?.toString()?.split('.');
  if (!decimal) return integer;
  return `${integer}.${decimal?.slice(0, 2)}`;
};

/** Format referral/points to 2 decimal places without rounding (truncate) to avoid float noise (e.g. 60.32999999999999 → 60.32). */
export const formatReferralPoints = (value: number | string | undefined | null): string => {
  if (value == null || value === '') return '0.00';
  const num = Number(value);
  if (isNaN(num)) return '0.00';
  const [integer, decimal] = num.toString().split('.');
  if (!decimal) return `${integer}.00`;
  return `${integer}.${decimal.slice(0, 2)}`;
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatMonthYear = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';

  try {
    if (
      typeof dateString === 'string' &&
      dateString?.includes('/') &&
      !dateString.includes('-')
    ) {
      const [month, year] = dateString?.split('/');
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (monthNum >= 1 && monthNum <= 12 && yearNum > 0) {
        const date = new Date(yearNum, monthNum - 1, 1);
        return date?.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
      }
    }
    const date = new Date(dateString);
    if (isNaN(date?.getTime())) return '-';

    return date?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (error) {
    return '-';
  }
};

export const formatTxId = (txid?: string) => {
  if (!txid || typeof txid !== 'string') return '-';
  const clean = txid.trim();

  if (clean.length <= 10) return clean;

  const start = clean.slice(0, 6);
  const end = clean.slice(-6);

  return `${start}...${end}`;
};
/** Format number with Indian comma style (e.g. 9,72,880). Use for INR amounts. */
export const formatWithCommas = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const formatTicker = (ticker: string, index?: number) => {
  if (!ticker) {
    return `TICK-${String((index ?? 0) + 1)?.padStart(2, '0')}`;
  }

  const baseTicker = ticker.replace(/-\d+$/, '');
  return `${baseTicker}-${String((index ?? 0) + 1)?.padStart(2, '0')}`;
};

export const formatCompactNumber = (num?: number | string): string => {
  const value = Number(num);
  if (isNaN(value) || value === 0) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  // Truncate decimals without rounding; show 2 decimal places for compact (K/L/Cr)
  const truncate = (n: number, twoDecimals = false): string => {
    const str = n.toString();
    if (!str.includes('.')) return twoDecimals ? `${str}.00` : str;

    const [int, dec] = str.split('.');
    const trimmed = dec.substring(0, 2);
    const decimals = twoDecimals ? trimmed.padEnd(2, '0') : trimmed;
    return decimals ? `${int}.${decimals}` : int;
  };

  if (absValue >= 1_00_00_000) {
    return `${sign}${truncate(absValue / 1_00_00_000, true)}Cr`;
  } else if (absValue >= 1_00_000) {
    return `${sign}${truncate(absValue / 1_00_000, true)}L`;
  } else if (absValue >= 1_000) {
    return `${sign}${truncate(absValue / 1_000, true)}K`;
  }

  return `${sign}${truncate(absValue)}`;
};

export const safeNumber = (value: number | undefined | null): number => {
  if (value === undefined || value === null || isNaN(value)) return 0;

  // Handle very small floating numbers like 7.2759e-12 → 0
  const num = Number(value);
  return Math.abs(num) < 1e-6 ? 0 : num;
};

// Helper function to format number with custom decimal places without rounding
const toCustomFixed = (value: number, decimals: number): string => {
  if (value === 0 || isNaN(value)) return '0.0';

  // Convert to string to preserve exact value
  let valueStr = value.toString();

  // Handle scientific notation
  if (valueStr.includes('e') || valueStr.includes('E')) {
    valueStr = value.toFixed(18);
  }

  const [integerPart, decimalPart = ''] = valueStr.split('.');

  // Pad or trim decimal part to desired length
  if (decimalPart.length === 0) {
    return `${integerPart}.${'0'.repeat(decimals)}`;
  } else if (decimalPart.length < decimals) {
    return `${integerPart}.${decimalPart.padEnd(decimals, '0')}`;
  } else {
    // Show exact decimals without rounding, but limit to requested decimals
    const trimmed = decimalPart.slice(0, decimals).replace(/0+$/, '');
    return trimmed
      ? `${integerPart}.${trimmed.padEnd(decimals, '0')}`
      : `${integerPart}.${'0'.repeat(decimals)}`;
  }
};

// Format crypto balance without roundoff - supports 6 decimals for USDT across all value ranges
export const balanceFormatWithoutRoundOffCrypto = (value: number): string => {
  if (value === 0 || value < 0.00000005) {
    return '0.0';
  }
  // USDT supports 6 decimals across all platforms - use 6 decimals for all values
  return toCustomFixed(value, 6);
};

// Format currency value (Current Valuation/Token Price) with crypto support
export const formatCurrencyWithCrypto = (
  value: number | string | undefined | null,
  usdtPrice?: number | null,
  cryptoEnable?: boolean | null,
  paymentMethod?: string | null
): string => {
  if (value == null || value === '' || value === undefined) {
    return cryptoEnable ? '0.0 USDT' : '₹0.00';
  }
  const num = Number(value);
  if (isNaN(num) || num === 0) {
    return cryptoEnable ? '0.0 USDT' : '₹0.00';
  }

  // If crypto is enabled → USDT with Western comma format (e.g. 1,111,111.11 USDT)
  if (cryptoEnable) {
    let valueToFormat = num;
    if (paymentMethod !== 'USDT' && usdtPrice && usdtPrice > 0) {
      valueToFormat = num / usdtPrice;
    }
    const raw = balanceFormatWithoutRoundOffCrypto(valueToFormat);
    const [integerPart, decimalPart = ''] = raw.split('.');
    const formattedInteger = Number(integerPart || '0').toLocaleString('en-US');
    const formatted = decimalPart
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
    return `${formatted} USDT`;
  }

  // crypto false → INR with Indian comma format (e.g. ₹1,11,11,111.00)
  return formatCurrencyDecimal(num);
};

// Format with roundoff for dollar - different decimal places based on value range
export const decimalFormatWithRoundOffDollar = (value: any): string => {
  let formatter = new Intl.NumberFormat('en-US', {
    currency: 'USD',
  });

  if (value == 0 || value == '' || value == undefined) {
    return '0.0';
  } else if ((value > 0 && value <= 9) || (value < 0 && value >= -9)) {
    return value?.toFixed(2);
  } else if ((value > 9 && value <= 99) || (value < -9 && value >= -99)) {
    return value?.toFixed(1);
  } else if ((value > 99 && value <= 999) || (value < -99 && value >= -999)) {
    return value?.toFixed();
  } else if ((value > 999 && value <= 9999) || (value < -999 && value >= -9999)) {
    return value?.toFixed();
  } else if (value > 9999 || value < -9999) {
    let data;
    data = Number(value?.toFixed());
    data = formatter.format(data);
    return data.replace(/,/g, '');
  }
  return '0.0';
};

// Format USDT using crypto format - different decimal places based on value range
export const formatUSDT = (value: number | string | undefined | null): string => {
  if (value == null || value === '') return '0.0';
  const num = Number(value);
  if (isNaN(num)) return '0.0';

  // Use crypto format without roundoff
  return balanceFormatWithoutRoundOffCrypto(num);
};

/** Format number with Western comma style (e.g. 1,234,567.89). Use for USDT amounts. */
export const formatUSDTWithCommas = (
  value: number | string | undefined | null
): string => {
  if (value == null || value === '') return '0.0';
  const num = Number(value);
  if (isNaN(num)) return '0.0';

  // Get formatted value using crypto format
  const formatted = balanceFormatWithoutRoundOffCrypto(num);
  const [integerPart, decimalPart = ''] = formatted.split('.');

  // Format integer part with Western (en-US) commas
  const formattedInteger = Number(integerPart || '0').toLocaleString('en-US');

  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

// Format USDT compact number (for cards) - using crypto format with 2 decimals for K/M
export const formatUSDTCompact = (num?: number | string): string => {
  const value = Number(num);
  if (isNaN(value) || value === 0) return '0.00';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  const truncateCompactTwoDecimals = (n: number): string => {
    const str = n.toString();
    if (!str.includes('.')) return `${str}.00`;
    const [int, dec] = str.split('.');
    const trimmed = (dec.substring(0, 2) + '00').slice(0, 2);
    return `${int}.${trimmed}`;
  };

  if (absValue >= 1_000_000) {
    const divided = absValue / 1_000_000;
    return `${sign}${truncateCompactTwoDecimals(divided)}M`;
  } else if (absValue >= 1_000) {
    const divided = absValue / 1_000;
    return `${sign}${truncateCompactTwoDecimals(divided)}K`;
  }

  // For values < 1000, use full crypto format
  return `${sign}${balanceFormatWithoutRoundOffCrypto(absValue)}`;
};
