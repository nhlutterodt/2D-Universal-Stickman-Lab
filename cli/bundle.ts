/**
 * charlab-cli bundle: bundle multiple .char.json/.lcb into one .lcb
 * Deno only, no Node deps.
 */
import { parseJson, readLcb, writeLcb } from './format';
import { assertValid } from './util';

if (import.meta.url === (globalThis.Deno?.mainModule ?? '')) {
  // @ts-expect-error Deno global
  const [cmd, ...inputs] = Deno.args;
  if (cmd !== 'bundle' || inputs.length < 2) {
    console.error('Usage: deno run charlab-cli bundle <in1> <in2> ... <out.lcb>');
    // @ts-expect-error Deno global
    Deno.exit(1);
  }
  const output = inputs.pop()!;
  const all: any[] = [];
  for (const input of inputs) {
    if (input.endsWith('.char.json')) all.push(await parseJson(input));
    else if (input.endsWith('.lcb')) all.push(await readLcb(input));
    else {
      console.error('Unknown input format:', input);
      // @ts-expect-error Deno global
      Deno.exit(1);
    }
  }
  // Example: bundle as array
  const bundle = { version: 'latest', assets: all };
  assertValid(bundle);
  await writeLcb(output, bundle);
}
