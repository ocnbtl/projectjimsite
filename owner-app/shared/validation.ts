export class InputError extends Error {}
export function text(value: unknown, label: string, max = 250, required = true): string {
  if (typeof value !== 'string') throw new InputError(`${label} must be text.`);
  const clean = value.trim();
  if ((required && !clean) || clean.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(clean)) throw new InputError(`Check ${label.toLowerCase()}.`);
  return clean;
}
export function integer(value: unknown, label: string, min = 0, max = 1000000000): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new InputError(`Check ${label.toLowerCase()}.`);
  return value;
}
export function money(value: string): number {
  const clean = value.trim().replace(/^\$/, '').replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) throw new InputError('Use an amount such as 125.50.');
  const [whole, fraction = ''] = clean.split('.');
  return integer(Number(whole) * 100 + Number(fraction.padEnd(2, '0')), 'amount');
}
export function date(value: unknown): string {
  const clean = text(value, 'Date', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean) || Number.isNaN(Date.parse(clean)) || new Date(clean).toISOString().slice(0,10) !== clean) throw new InputError('Use a valid date (YYYY-MM-DD).');
  return clean;
}
export function choice<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) throw new InputError(`Check ${label.toLowerCase()}.`);
  return value as T;
}
export function email(value: unknown): string {
  const clean = text(value, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new InputError('Enter a valid email.');
  return clean;
}
export function id(value: unknown): string {
  const clean = text(value, 'ID', 80);
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(clean)) throw new InputError('Invalid record ID.');
  return clean;
}
export const categories = ['Materials', 'Fuel', 'Tools', 'Travel', 'Meals', 'Subcontractors', 'Insurance', 'Other'] as const;
export const statuses = ['lead', 'scheduled', 'in_progress', 'completed', 'archived'] as const;
