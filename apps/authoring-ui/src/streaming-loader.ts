/**
 * Streaming loader for character bundles with chunked GameJSON, sprite-atlas streaming, and animation LOD.
 * Usage: import { loadCharacterStreamed } from './streaming-loader';
 */

import { fetchWithCache } from './cache/cache.js';

// Example chunked bundle: { meta: {...}, anim: URL, skins: URL[] }
// IndexedDB assumed available as window.indexedDB

interface LoaderOptions {
  lodDistance?: number;
  deferHeavyChunks?: boolean;
  domElement?: Element;
}

export async function loadCharacterStreamed(bundleUrl: string, options: LoaderOptions = {}) {
  // 1. Fetch meta chunk immediately (use cache)
  const metaBuffer = await fetchWithCache(bundleUrl + '?chunk=meta', 'chunks');
  const metaArrayBuffer = metaBuffer instanceof Blob ? await metaBuffer.arrayBuffer() : metaBuffer;
  const meta = JSON.parse(new TextDecoder().decode(metaArrayBuffer));

  // 2. Prepare deferred anim/skins loading
  let animPromise: Promise<any> | null = null, skinsPromises: Promise<any>[] = [];
  if (meta.anim) {
    animPromise = fetchWithCache(meta.anim, 'chunks').then(async buf => {
      const arrayBuffer = buf instanceof Blob ? await buf.arrayBuffer() : buf;
      return JSON.parse(new TextDecoder().decode(arrayBuffer));
    });
  }
  if (Array.isArray(meta.skins)) {
    skinsPromises = meta.skins.map((url: string) => fetchWithCache(url, 'chunks').then(async buf => {
      const arrayBuffer = buf instanceof Blob ? await buf.arrayBuffer() : buf;
      return JSON.parse(new TextDecoder().decode(arrayBuffer));
    }));
  }

  // 3. Return a proxy character object with lazy attachments
  const character = {
    meta,
    get anim() { return animPromise; },
    get skins() { return Promise.all(skinsPromises); },
    setLodDistance(px: number) { this._lodDistance = px; },
    _lodDistance: options.lodDistance ?? 800,
    // LOD logic: call this per-frame or on camera move
    updateLod(cameraDist: number) {
      if (cameraDist > this._lodDistance) {
        this.lod = 'proxy'; // collapse to 1-sprite
      } else if (cameraDist > this._lodDistance / 2) {
        this.lod = 'low'; // fewer IK iterations
      } else {
        this.lod = 'full';
      }
    },
    lod: 'full' as 'full' | 'low' | 'proxy',
  };

  // 4. Optionally, use IntersectionObserver to trigger anim/skins loading
  if (options.deferHeavyChunks && typeof window !== 'undefined') {
    const el = options.domElement;
    if (el && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
          animPromise?.then(()=>{});
          skinsPromises.forEach(p => p?.then(()=>{}));
          io.disconnect();
        }
      });
      io.observe(el);
    } else {
      // Fallback: load immediately
      animPromise?.then(()=>{});
      skinsPromises.forEach(p => p?.then(()=>{}));
    }
  }

  return character;
}
