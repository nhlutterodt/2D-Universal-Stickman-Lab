# charlab-cli

Deno-based CLI for Universal 2D Character Lab asset conversion, migration, and bundling.

## Usage

```sh
deno run charlab-cli convert walk.anim.char.json walk.anim.lcb
deno run charlab-cli migrate walk.anim.char.json walk.anim.char.json
# or migrate .lcb to latest
# deno run charlab-cli migrate walk.anim.lcb walk.anim.lcb
deno run charlab-cli bundle walk.anim.char.json idle.anim.char.json all.lcb
```

- `.char.json` is a portable JSON format
- `.lcb` is a binary format (zero-copy, DataView-backed in real impl)

## Features
- SHA-256 sign & verify
- Zod-style runtime validation (<1kB)
- Round-trip diff for lossless conversion
