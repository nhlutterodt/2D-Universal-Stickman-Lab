/**
 * Frozen capability tokens for plugin sandboxing.
 * @lab-docgen
 */
export function createCaps(caps: Record<string, boolean>) {
  return Object.freeze({
    storage: !!caps.storage,
    net: !!caps.net,
    dom: !!caps.dom,
    ui: !!caps.ui,
    // ...add more as needed
  });
}
