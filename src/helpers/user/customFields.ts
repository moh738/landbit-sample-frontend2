export const buildCustomUserData = (
  fields: any
): { label: string; value: string }[] => {
  if (!fields) return [];
  if (Array?.isArray(fields)) {
    return fields?.map((f: any) => ({
      label: f.title || f.label || '-',
      value: String(f.subTitle ?? f.value ?? '-'),
    }));
  }
  return Object?.entries(fields)?.map(([key, value]) => ({
    label: key,
    value: String(value ?? '-'),
  }));
};

export const parseCustomFields = (customFields: string | object | null) => {
  try {
    if (!customFields) return {};
    if (typeof customFields === 'object' && !Array.isArray(customFields))
      return customFields;
    let parsed: any = customFields;
    const maxParseAttempts = 20; 
    for (let i = 0; i < maxParseAttempts; i++) {
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed)
          if (typeof parsed === 'object') {
            return parsed;
          }
        } catch (e) {
          return {};
        }
      } else {
        return parsed || {};
      }
    }
    return typeof parsed === 'string' ? {} : parsed || {};
  } catch (error) {
    console.error('Error parsing customFields:', error);
    return {};
  }
};
