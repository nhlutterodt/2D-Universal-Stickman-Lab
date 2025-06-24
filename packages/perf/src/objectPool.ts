/**
 * ObjectPool for reusing objects.
 * @lab-docgen
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  constructor(factory: () => T, initial = 0) {
    this.factory = factory;
    for (let i = 0; i < initial; ++i) this.pool.push(factory());
  }
  acquire(): T {
    return this.pool.pop() ?? this.factory();
  }
  release(obj: T) {
    this.pool.push(obj);
  }
  get size() { return this.pool.length; }
}
