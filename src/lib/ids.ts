/**
 * EKEA — identifiants locaux
 * Aucune donnée ne quitte l’appareil, les identifiants sont donc générés côté client.
 */

export function makeId(prefix = 'ek'): string {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj && 'randomUUID' in cryptoObj) {
    return `${prefix}_${cryptoObj.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

/** Version lisible pour les fichiers exportés. */
export function stamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}`;
}
