/** djb2 hash → unsigned 32-bit integer */
export function hash32(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Return a float in [min, max) seeded from key + salt */
export function seeded(key: string, salt: string, min: number, max: number): number {
  const h = hash32(key.toLowerCase() + salt);
  return min + ((h % 10_000) / 10_000) * (max - min);
}

/** Return a seeded integer in [min, max] */
export function seededInt(key: string, salt: string, min: number, max: number): number {
  return Math.round(seeded(key, salt, min, max));
}

/** Pick a seeded element from an array */
export function seededPick<T>(key: string, salt: string, arr: T[]): T {
  const idx = seededInt(key, salt, 0, arr.length - 1);
  return arr[idx];
}

export function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "_");
}
