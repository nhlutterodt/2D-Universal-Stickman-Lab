/**
 * Utility: SHA-256, Zod-style validator (1kB), assertValid
 * Deno only, no Node deps.
 */
export async function sha256(path: string): Promise<string> {
  // @ts-expect-error Deno global
  const buf = await Deno.readFile(path);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Minimal Zod-style validator (1kB)
export function assertValid(obj: any): void {
  if (!obj || typeof obj !== 'object') throw new Error('Invalid: not an object');
  if (!('version' in obj)) throw new Error('Missing version');
  // Add more schema checks as needed
}
