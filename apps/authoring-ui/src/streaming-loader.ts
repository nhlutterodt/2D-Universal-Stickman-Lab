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
    _animCache: null as any,
    _skinsCache: null as any[] | null,
    _lodDistance: options.lodDistance ?? 800,
    lod: 'full' as 'full' | 'low' | 'proxy',
    
    get anim() { 
      if (!animPromise) {
        console.warn('[StreamingLoader] No animation data available');
        return Promise.resolve(null);
      }
      return animPromise.catch(err => {
        console.error('[StreamingLoader] Failed to load animation:', err);
        throw new Error(`Animation loading failed: ${err.message}`);
      });
    },
    
    get skins() { 
      if (!skinsPromises.length) {
        console.warn('[StreamingLoader] No skin data available');
        return Promise.resolve([]);
      }
      return Promise.all(skinsPromises).catch(err => {
        console.error('[StreamingLoader] Failed to load skins:', err);
        throw new Error(`Skins loading failed: ${err.message}`);
      });
    },
    
    setLodDistance(px: number) { 
      if (typeof px !== 'number' || px <= 0) {
        console.warn('[StreamingLoader] Invalid LOD distance:', px);
        return;
      }
      this._lodDistance = px; 
    },
    
    updateLod(cameraDist: number) {
      if (typeof cameraDist !== 'number') {
        console.warn('[StreamingLoader] Invalid camera distance:', cameraDist);
        return;
      }
      
      try {
        const prevLod = this.lod;
        if (cameraDist > this._lodDistance) {
          this.lod = 'proxy';
        } else if (cameraDist > this._lodDistance / 2) {
          this.lod = 'low';
        } else {
          this.lod = 'full';
        }
        
        if (prevLod !== this.lod) {
          console.debug(`[StreamingLoader] LOD changed: ${prevLod} -> ${this.lod} (dist: ${cameraDist})`);
        }
      } catch (err) {
        console.error('[StreamingLoader] LOD update failed:', err);
      }
    },
    
    // Debug helper
    getLoadingStatus() {
      return {
        metaLoaded: !!this.meta,
        animLoading: !!animPromise,
        skinsLoading: skinsPromises.length > 0,
        currentLod: this.lod,
        lodDistance: this._lodDistance
      };
    }
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
