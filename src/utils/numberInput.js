export function sanitizeDecimalInput(value) {
  const next = String(value ?? '').replace(/[^0-9.]/g, '');
  const parts = next.split('.');
  if (parts.length <= 2) {
    return next;
  }
  return `${parts[0]}.${parts.slice(1).join('')}`;
}

export function toNumber(value) {
  const sanitized = sanitizeDecimalInput(value);
  if (!sanitized || sanitized === '.') {
    return 0;
  }
  return Number(sanitized);
}
