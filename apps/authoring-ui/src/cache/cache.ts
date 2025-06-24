// IndexedDB cache for streaming loader (chunks + atlases)
// Uses idb (https://www.npmjs.com/package/idb) for promise-based IndexedDB
import { openDB, DBSchema } from 'idb';

interface CharLabDB extends DBSchema {
  chunks: { key: string; value: { data: ArrayBuffer; etag: string; ts: number } };
  atlases: { key: string; value: { imageBlob: Blob; etag: string; ts: number } };
}
const dbPromise = openDB<CharLabDB>('char-lab-cache', 1, {
  upgrade(db) {
    db.createObjectStore('chunks');
    db.createObjectStore('atlases');
  },
});

let cacheHits = 0, cacheMisses = 0;

export async function fetchWithCache(url: string, store: keyof CharLabDB) {
  const db = await dbPromise;
  const cached = await db.get(store as 'chunks' | 'atlases', url);
  let etag = '';
  try {
    const head = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    etag = head.headers.get('ETag') ?? '';
  } catch {}

  if (cached && cached.etag === etag) {
    cacheHits++;
    return store === 'chunks' 
      ? (cached as { data: ArrayBuffer; etag: string; ts: number }).data 
      : (cached as { imageBlob: Blob; etag: string; ts: number }).imageBlob;
  }
  cacheMisses++;
  const res = await fetch(url);
  const buf = store === 'chunks' ? await res.arrayBuffer() : await res.blob();
  await db.put(store as any, store === 'chunks'
    ? { data: buf, etag, ts: Date.now() }
    : { imageBlob: buf, etag, ts: Date.now() }, url);
  return buf;
}

export function getCacheStats() {
  return { cacheHits, cacheMisses };
}
