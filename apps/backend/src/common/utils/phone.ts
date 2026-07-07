export function normalizePhoneNumber(raw: string): string {
  const stripped = raw.replace('whatsapp:', '').trim().replace(/\s+/g, '');

  return stripped.startsWith('+') ? stripped : `+${stripped}`;
}
