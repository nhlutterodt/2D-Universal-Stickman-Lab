/**
 * Format helpers for .char.json <-> .lcb
 * Deno only, no Node deps.
 */
export async function parseJson(path: string): Promise<any> {
  // @ts-expect-error Deno global
  const text = await Deno.readTextFile(path);
  return JSON.parse(text);
}

export async function writeJson(path: string, data: any): Promise<void> {
  // @ts-expect-error Deno global
  await Deno.writeTextFile(path, JSON.stringify(data, null, 2));
}

export async function readLcb(path: string): Promise<any> {
  // @ts-expect-error Deno global
  const buf = await Deno.readFile(path);
  // Minimal: assume .lcb is just a JSON string for demo; real impl is zero-copy
  return JSON.parse(new TextDecoder().decode(buf));
}

export async function writeLcb(path: string, data: any): Promise<void> {
  // @ts-expect-error Deno global
  await Deno.writeFile(path, new TextEncoder().encode(JSON.stringify(data)));
}
