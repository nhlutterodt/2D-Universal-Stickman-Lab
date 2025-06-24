/**
 * charlab-cli convert: .char.json <-> .lcb
 * Deno only, no Node deps.
 */
import { parseJson, writeLcb, readLcb, writeJson } from './format';
import { sha256, assertValid } from './util';

if (import.meta.url === (globalThis.Deno?.mainModule ?? '')) {
  // @ts-expect-error Deno global
  const [cmd, input, output] = Deno.args;
  if (cmd !== 'convert' || !input || !output) {
    console.error('Usage: deno run charlab-cli convert <in.char.json|in.lcb> <out.lcb|out.char.json>');
    // @ts-expect-error Deno global
    Deno.exit(1);
  }
  if (input.endsWith('.char.json')) {
    const json = await parseJson(input);
    assertValid(json);
    await writeLcb(output, json);
    console.log('SHA-256:', await sha256(output));
  } else if (input.endsWith('.lcb')) {
    const lcb = await readLcb(input);
    assertValid(lcb);
    await writeJson(output, lcb);
    console.log('SHA-256:', await sha256(output));
  } else {
    console.error('Unknown input format.');
    // @ts-expect-error Deno global
    Deno.exit(1);
  }
}
