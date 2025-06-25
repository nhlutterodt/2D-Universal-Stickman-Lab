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

// Helper function to create animation loader
function createAnimationLoader(meta: any, loadingState: any, loaderId: string) {
  if (!meta.anim) return null;
  
  console.debug(`[StreamingLoader:${loaderId}] Preparing animation loader for: ${meta.anim}`);
  return fetchWithCache(meta.anim, 'chunks').then(async buf => {
    console.time(`[StreamingLoader:${loaderId}] Animation parse`);
    try {
      const arrayBuffer = buf instanceof Blob ? await buf.arrayBuffer() : buf;
      const result = JSON.parse(new TextDecoder().decode(arrayBuffer));
      loadingState.animLoaded = true;
      console.timeEnd(`[StreamingLoader:${loaderId}] Animation parse`);
      console.debug(`[StreamingLoader:${loaderId}] Animation loaded successfully (${arrayBuffer.byteLength} bytes)`);
      return result;
    } catch (err) {
      console.timeEnd(`[StreamingLoader:${loaderId}] Animation parse`);
      const error = err instanceof Error ? err : new Error(String(err));
      loadingState.animError = error;
      console.error(`[StreamingLoader:${loaderId}] Animation parse failed:`, error);
      throw error;
    }
  }).catch(err => {
    const error = err instanceof Error ? err : new Error(String(err));
    loadingState.animError = error;
    console.error(`[StreamingLoader:${loaderId}] Animation fetch failed:`, error);
    throw error;
  });
}

// Helper function to create skin loaders
function createSkinLoaders(meta: any, loadingState: any, loaderId: string) {
  if (!Array.isArray(meta.skins)) return [];
  
  console.debug(`[StreamingLoader:${loaderId}] Preparing ${meta.skins.length} skin loaders`);
  return meta.skins.map((url: string, index: number) => 
    fetchWithCache(url, 'chunks').then(async buf => {
      console.time(`[StreamingLoader:${loaderId}] Skin ${index} parse`);
      try {
        const arrayBuffer = buf instanceof Blob ? await buf.arrayBuffer() : buf;
        const result = JSON.parse(new TextDecoder().decode(arrayBuffer));
        loadingState.skinsLoaded.add(index);
        console.timeEnd(`[StreamingLoader:${loaderId}] Skin ${index} parse`);
        console.debug(`[StreamingLoader:${loaderId}] Skin ${index} loaded successfully (${arrayBuffer.byteLength} bytes)`);
        return result;
      } catch (err) {
        console.timeEnd(`[StreamingLoader:${loaderId}] Skin ${index} parse`);
        const error = err instanceof Error ? err : new Error(String(err));
        loadingState.skinErrors.set(index, error);
        console.error(`[StreamingLoader:${loaderId}] Skin ${index} parse failed:`, error);
        throw error;
      }
    }).catch(err => {
      const error = err instanceof Error ? err : new Error(String(err));
      loadingState.skinErrors.set(index, error);
      console.error(`[StreamingLoader:${loaderId}] Skin ${index} fetch failed:`, error);
      throw error;
    })
  );
}

// Helper function to setup intersection observer
function setupIntersectionObserver(options: LoaderOptions, loaderId: string, animPromise: Promise<any> | null, skinsPromises: Promise<any>[]) {
  const el = options.domElement;
  if (!el || !('IntersectionObserver' in window)) {
    console.debug(`[StreamingLoader:${loaderId}] No intersection observer available - loading immediately`);
    handleImmediateLoading(loaderId, animPromise, skinsPromises);
    return;
  }

  console.debug(`[StreamingLoader:${loaderId}] Setting up intersection observer for deferred loading`);
  const io = new IntersectionObserver(entries => {
    try {
      if (entries.some(e => e.isIntersecting)) {
        console.debug(`[StreamingLoader:${loaderId}] Element intersecting - triggering deferred loads`);
        handleDeferredLoading(loaderId, animPromise, skinsPromises);
        io.disconnect();
      }
    } catch (err) {
      console.error(`[StreamingLoader:${loaderId}] Intersection observer error:`, err);
    }
  }, { threshold: 0.1 });
  
  io.observe(el);
}

function handleImmediateLoading(loaderId: string, animPromise: Promise<any> | null, skinsPromises: Promise<any>[]) {
  if (animPromise) {
    animPromise.catch(err => console.error(`[StreamingLoader:${loaderId}] Immediate animation load failed:`, err));
  }
  skinsPromises.forEach((p, index) => {
    p.catch(err => console.error(`[StreamingLoader:${loaderId}] Immediate skin ${index} load failed:`, err));
  });
}

function handleDeferredLoading(loaderId: string, animPromise: Promise<any> | null, skinsPromises: Promise<any>[]) {
  if (animPromise) {
    animPromise.then(() => {
      console.debug(`[StreamingLoader:${loaderId}] Deferred animation loaded`);
    }).catch(err => {
      console.error(`[StreamingLoader:${loaderId}] Deferred animation failed:`, err);
    });
  }
  
  skinsPromises.forEach((p, index) => {
    p.then(() => {
      console.debug(`[StreamingLoader:${loaderId}] Deferred skin ${index} loaded`);
    }).catch(err => {
      console.error(`[StreamingLoader:${loaderId}] Deferred skin ${index} failed:`, err);
    });
  });
}

export async function loadCharacterStreamed(bundleUrl: string, options: LoaderOptions = {}) {
  const startTime = performance.now();
  const loaderId = `loader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.group(`[StreamingLoader:${loaderId}] Starting character load from: ${bundleUrl}`);
  
  try {
    // 1. Fetch meta chunk immediately (use cache)
    console.time(`[StreamingLoader:${loaderId}] Meta fetch`);
    const metaBuffer = await fetchWithCache(bundleUrl + '?chunk=meta', 'chunks');
    console.timeEnd(`[StreamingLoader:${loaderId}] Meta fetch`);
    
    const metaArrayBuffer = metaBuffer instanceof Blob ? await metaBuffer.arrayBuffer() : metaBuffer;
    const meta = JSON.parse(new TextDecoder().decode(metaArrayBuffer));
    
    console.debug(`[StreamingLoader:${loaderId}] Meta loaded:`, {
      hasAnim: !!meta.anim,
      skinsCount: Array.isArray(meta.skins) ? meta.skins.length : 0,
      metaSize: metaArrayBuffer.byteLength
    });

    // 2. Prepare deferred anim/skins loading with enhanced tracking
    const loadingState = {
      animLoaded: false,
      skinsLoaded: new Set<number>(),
      animError: null as Error | null,
      skinErrors: new Map<number, Error>()
    };
    
    const animPromise = createAnimationLoader(meta, loadingState, loaderId);
    const skinsPromises = createSkinLoaders(meta, loadingState, loaderId);

    // 3. Return a proxy character object with lazy attachments and enhanced debugging
    const character = {
      meta,
      _animCache: null as any,
      _skinsCache: null as any[] | null,
      _lodDistance: options.lodDistance ?? 800,
      lod: 'full' as 'full' | 'low' | 'proxy',
      _loaderId: loaderId,
      _loadingState: loadingState,
      
      get anim() { 
        if (!animPromise) {
          console.warn(`[StreamingLoader:${loaderId}] No animation data available`);
          return Promise.resolve(null);
        }
        
        console.debug(`[StreamingLoader:${loaderId}] Animation requested`);
        return animPromise.catch(err => {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error(`[StreamingLoader:${loaderId}] Animation access failed:`, {
            error: error.message,
            stack: error.stack,
            loadingState: this._loadingState.animError
          });
          throw new Error(`Animation loading failed: ${error.message}`);
        });
      },
      
      get skins() { 
        if (!skinsPromises.length) {
          console.warn(`[StreamingLoader:${loaderId}] No skin data available`);
          return Promise.resolve([]);
        }
        
        console.debug(`[StreamingLoader:${loaderId}] Skins requested (${skinsPromises.length} total)`);
        
        return Promise.allSettled(skinsPromises).then(results => {
          const loadedSkins: any[] = [];
          const errors: string[] = [];
          const timing = performance.now() - startTime;
          
          console.group(`[StreamingLoader:${loaderId}] Skins loading results (${timing.toFixed(2)}ms)`);
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              loadedSkins.push(result.value);
              console.debug(`✓ Skin ${index} loaded successfully`);
            } else {
              const errorMsg = `Skin ${index} failed: ${result.reason?.message || result.reason}`;
              errors.push(errorMsg);
              console.error(`✗ ${errorMsg}`, {
                reason: result.reason,
                stack: result.reason?.stack
              });
            }
          });
          
          console.groupEnd();
          
          // Enhanced error reporting
          if (errors.length > 0) {
            const failureRate = (errors.length / results.length * 100).toFixed(1);
            console.warn(`[StreamingLoader:${loaderId}] ${errors.length}/${results.length} skins failed (${failureRate}% failure rate)`);
            
            if (loadedSkins.length === 0) {
              const aggregatedError = new Error(`All skins failed to load: ${errors.join(', ')}`);
              console.error(`[StreamingLoader:${loaderId}] Critical failure - no skins loaded`, {
                errors,
                loadingState: this._loadingState.skinErrors
              });
              throw aggregatedError;
            }
          }
          
          const successRate = (loadedSkins.length / results.length * 100).toFixed(1);
          console.info(`[StreamingLoader:${loaderId}] Successfully loaded ${loadedSkins.length}/${results.length} skins (${successRate}% success rate)`);
          return loadedSkins;
        }).catch(err => {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error(`[StreamingLoader:${loaderId}] Critical skins loading error:`, {
            error: error.message,
            stack: error.stack,
            loadingState: this._loadingState
          });
          throw new Error(`Skins loading failed: ${error.message}`);
        });
      },
      
      setLodDistance(px: number) { 
        if (typeof px !== 'number' || px <= 0 || !isFinite(px)) {
          console.warn(`[StreamingLoader:${loaderId}] Invalid LOD distance:`, { value: px, type: typeof px });
          return;
        }
        const oldDistance = this._lodDistance;
        this._lodDistance = px;
        console.debug(`[StreamingLoader:${loaderId}] LOD distance updated: ${oldDistance} -> ${px}`);
      },
      
      updateLod(cameraDist: number) {
        if (typeof cameraDist !== 'number' || !isFinite(cameraDist)) {
          console.warn(`[StreamingLoader:${loaderId}] Invalid camera distance:`, { value: cameraDist, type: typeof cameraDist });
          return;
        }
        
        try {
          const prevLod = this.lod;
          const thresholds = {
            proxy: this._lodDistance,
            low: this._lodDistance / 2
          };
          
          if (cameraDist > thresholds.proxy) {
            this.lod = 'proxy';
          } else if (cameraDist > thresholds.low) {
            this.lod = 'low';
          } else {
            this.lod = 'full';
          }
          
          if (prevLod !== this.lod) {
            console.debug(`[StreamingLoader:${loaderId}] LOD transition: ${prevLod} -> ${this.lod}`, {
              distance: cameraDist,
              thresholds,
              timestamp: Date.now()
            });
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error(`[StreamingLoader:${loaderId}] LOD update failed:`, {
            error: error.message,
            stack: error.stack,
            cameraDist,
            currentLod: this.lod
          });
        }
      },
      
      // Enhanced debug helper with comprehensive state
      getLoadingStatus() {
        const timing = performance.now() - startTime;
        return {
          loaderId,
          metaLoaded: !!this.meta,
          animLoading: !!animPromise,
          animLoaded: this._loadingState.animLoaded,
          animError: this._loadingState.animError?.message,
          skinsLoading: skinsPromises.length > 0,
          skinsLoaded: Array.from(this._loadingState.skinsLoaded),
          skinErrors: Object.fromEntries(
            Array.from(this._loadingState.skinErrors.entries()).map(([k, v]) => [k, v.message])
          ),
          currentLod: this.lod,
          lodDistance: this._lodDistance,
          elapsedTime: `${timing.toFixed(2)}ms`,
          bundleUrl,
          options
        };
      },
      
      // Add performance profiling method
      getPerformanceMetrics() {
        return {
          loaderId,
          startTime,
          elapsedTime: performance.now() - startTime,
          memoryUsage: (performance as any).memory ? {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
            limit: (performance as any).memory.jsHeapSizeLimit
          } : 'not available'
        };
      }
    };

    // 4. Enhanced intersection observer with error handling
    if (options.deferHeavyChunks && typeof window !== 'undefined') {
      setupIntersectionObserver(options, loaderId, animPromise, skinsPromises);
    }

    const initTime = performance.now() - startTime;
    console.info(`[StreamingLoader:${loaderId}] Character initialized in ${initTime.toFixed(2)}ms`);
    console.groupEnd();
    
    return character;
    
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const failureTime = performance.now() - startTime;
    console.error(`[StreamingLoader:${loaderId}] Critical initialization failure after ${failureTime.toFixed(2)}ms:`, {
      error: error.message,
      stack: error.stack,
      bundleUrl,
      options
    });
    console.groupEnd();
    throw new Error(`Character loading failed: ${error.message}`);
  }
}
