/**
 * TypedArrayArena for fast allocation.
 * @lab-docgen
 */
export class TypedArrayArena {
  private buffer: ArrayBuffer;
  private offset = 0;
  constructor(size: number) {
    this.buffer = new SharedArrayBuffer(size);
  }
  allocFloat32(count: number): Float32Array {
    const arr = new Float32Array(this.buffer, this.offset, count);
    this.offset += count * 4;
    return arr;
  }
  reset() { this.offset = 0; }
}
