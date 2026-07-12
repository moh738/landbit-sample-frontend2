/**
 * Domestic KYC OCR responses may be flat strings or nested:
 * { ocrResult: { dlNo: { value, confidence }, name: { value, confidence } } }
 */
export type OcrFieldEntry = { value?: string; confidence?: number } | string | null | undefined;

/**
 * KYC details may return `ocrDataFront` / `ocrDataBack` / `ocrData` as JSON strings or objects.
 */
export function parseOcrJsonRecord(
  value: unknown
): Record<string, OcrFieldEntry> | null {
  if (value == null) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, OcrFieldEntry>;
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, OcrFieldEntry>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function unwrapField(entry: OcrFieldEntry): string {
  if (entry == null) return '';
  if (typeof entry === 'string') return entry.trim();
  if (typeof entry === 'object' && typeof entry.value === 'string') return entry.value.trim();
  return '';
}

function toIsoDate(input: string): string {
  const s = typeof input === 'string' ? input.trim() : '';
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/); // DD/MM/YYYY or DD-MM-YYYY
  if (!m) return '';
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!yyyy || mm < 1 || mm > 12 || dd < 1 || dd > 31) return '';
  return `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

/**
 * Returns a flat map of string values for prefilling verify step.
 */
export function normalizeDomesticOcr(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw == null || typeof raw !== 'object') return out;

  const root = raw as Record<string, unknown>;
  const rawSources: Array<Record<string, OcrFieldEntry> | null> = [
    parseOcrJsonRecord(root.ocrResult),
    parseOcrJsonRecord(root.ocrDataFront),
    parseOcrJsonRecord(root.ocrDataBack),
    parseOcrJsonRecord(root.ocrData),
    root && typeof root === 'object' && !Array.isArray(root)
      ? (root as Record<string, OcrFieldEntry>)
      : null,
  ];
  const sources = rawSources.filter(
    (src): src is Record<string, OcrFieldEntry> => src !== null
  );

  const keys = [
    'name',
    'fullName',
    'dob',
    'dateOfBirth',
    'doi',
    'doe',
    'relationName',
    'address',
    'pin',
    'dlNo',
    'voterId',
    'passportNo',
    'passportNumber',
    'documentNumber',
    'documentNo',
    'idNumber',
    'fileNo',
    'fileNumber',
    'givenName',
    'surname',
    'gender',
    'age',
    'ageAsPerDate',
    'lastUpdateDate',
  ] as const;

  for (const k of keys) {
    for (const src of sources) {
      const v = unwrapField(src[k] as OcrFieldEntry);
      if (v) {
        out[k] = v;
        break;
      }
    }
  }

  if (!out.fullName && out.name) out.fullName = out.name;
  if (!out.name && out.fullName) out.name = out.fullName;
  if (!out.dateOfBirth && out.dob) out.dateOfBirth = out.dob;
  if (!out.dob && out.dateOfBirth) out.dob = out.dateOfBirth;

  // Passport variants
  if (!out.passportNo && out.passportNumber) out.passportNo = out.passportNumber;
  if (!out.fileNo && out.fileNumber) out.fileNo = out.fileNumber;

  // Passport name sometimes comes as givenName + surname
  if (!out.fullName) {
    const given = out.givenName?.trim?.() || '';
    const sur = out.surname?.trim?.() || '';
    const combined = `${given} ${sur}`.trim();
    if (combined) out.fullName = combined;
  }
  if (!out.name && out.fullName) out.name = out.fullName;

  const dobIso = toIsoDate(out.dob || out.dateOfBirth || '');
  if (dobIso) {
    out.dob = dobIso;
    out.dateOfBirth = dobIso;
  }
  const doiIso = toIsoDate(out.doi || '');
  if (doiIso) out.doi = doiIso;
  const doeIso = toIsoDate(out.doe || '');
  if (doeIso) out.doe = doeIso;
  const lastUpdateIso = toIsoDate(out.lastUpdateDate || '');
  if (lastUpdateIso) out.lastUpdateDate = lastUpdateIso;

  const docNo =
    out.documentNumber ||
    out.documentNo ||
    out.idNumber ||
    out.dlNo ||
    out.voterId ||
    out.passportNo ||
    '';
  if (docNo) {
    out.documentNumber = docNo;
    out.documentNo = docNo;
  }

  return out;
}

export function getNormalizedOcrValue(
  normalized: Record<string, string>,
  ...aliases: string[]
): string {
  for (const key of aliases) {
    const v = normalized[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}
