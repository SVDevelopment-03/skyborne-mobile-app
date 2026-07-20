export const normalizeErrorMessage = (
  raw: unknown,
  fallback: string = 'Something went wrong',
): string => {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    const joined = raw.filter(Boolean).join(', ');
    return joined.length > 0 ? joined : fallback;
  }
  if (raw && typeof raw === 'object') {
    const maybeMessage = (raw as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') return maybeMessage;
    try {
      const asJson = JSON.stringify(raw);
      return asJson && asJson !== '{}' ? asJson : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};
