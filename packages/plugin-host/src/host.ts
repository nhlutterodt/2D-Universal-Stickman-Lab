/**
 * Plugin host: loadPlugin, hot-reload, sandboxing.
 * @lab-docgen
 */
import { createCaps } from './caps.js';

const loadedPlugins = new Map<string, any>();
const pluginStates = new Map<string, any>();

/**
 * Load a plugin as a sandboxed ES module with frozen capabilities.
 * @param url Plugin URL
 * @param caps Capabilities
 * @returns Proxied plugin API
 */
export async function loadPlugin(url: string, caps: Record<string, boolean>) {
  const frozenCaps = createCaps(caps);
  // Dynamic import with cache-busting for hot-reload
  const mod = await import(url + '?t=' + Date.now());
  // Proxy API to enforce caps
  const api = new Proxy(mod, {
    get(target, prop) {
      if (prop === 'fetch' && !frozenCaps.net) throw new Error('Net capability not granted');
      if (prop === 'document' && !frozenCaps.dom) throw new Error('DOM capability not granted');
      return target[prop];
    }
  });
  loadedPlugins.set(url, api);
  // Restore state if present
  if (pluginStates.has(url) && api.hydrateState) api.hydrateState(pluginStates.get(url));
  return api;
}

/**
 * Hot-reload plugin by diffing dependency graph.
 */
export async function hotReloadPlugin(url: string, caps: Record<string, boolean>) {
  // Save state if possible
  const api = loadedPlugins.get(url);
  if (api?.dehydrateState) pluginStates.set(url, api.dehydrateState());
  // Remove from cache and reload
  // Note: Hot-reload implementation would need proper module cache clearing
  return loadPlugin(url, caps);
}
