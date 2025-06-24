/**
 * EntityId is a unique symbol for each entity.
 * @lab-docgen
 */

/**
 * EntityRegistry maps EntityId to component data.
 * @lab-docgen
 */
export interface EntityRegistry<T = any> {
  readonly entities: ReadonlyMap<symbol, T>;
}

/**
 * Create a new EntityId.
 * Deterministic via xorshift128+ seeded with a number.
 * @param seed number
 * @returns EntityId
 */
export function createEntityId(seed: number): symbol {
  // xorshift128+ implementation
  let x = seed | 0, y = (seed ^ 0xdeadbeef) | 0;
  function next() {
    let t = x;
    x = y;
    t ^= t << 23;
    t ^= t >> 17;
    t ^= y ^ (y >> 26);
    y = t;
    return (x + y) >>> 0;
  }
  return Symbol.for('entity:' + next().toString(16));
}
