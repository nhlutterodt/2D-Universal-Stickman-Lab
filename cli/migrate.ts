/**
 * charlab-cli migrate: migrate .char.json/.lcb to latest version.
 * Deno only, no Node deps.
 */
import { parseJson, writeJson, readLcb, writeLcb } from './format';
import { assertValid } from './util';

if (import.meta.url === (globalThis.Deno?.mainModule ?? '')) {
  // @ts-expect-error Deno global
  const [cmd, input, output] = Deno.args;
  if (cmd !== 'migrate' || !input || !output) {
    console.error('Usage: deno run charlab-cli migrate <in.char.json|in.lcb> <out.char.json|out.lcb>');
    // @ts-expect-error Deno global
    Deno.exit(1);
  }
  let data;
  if (input.endsWith('.char.json')) {
    data = await parseJson(input);
  } else if (input.endsWith('.lcb')) {
    data = await readLcb(input);
  } else {
    console.error('Unknown input format.');
    // @ts-expect-error Deno global
    Deno.exit(1);
  }
  // Example: migrate version field
  data.version = 'latest';
  assertValid(data);
  if (output.endsWith('.char.json')) await writeJson(output, data);
  else await writeLcb(output, data);
}
