/**
 * Bone transform (position, rotation, scale)
 * @lab-docgen
 */
import { Vector2 } from '@lab/math';

export interface Bone {
  readonly id: symbol;
  readonly name: string;
  readonly parentId?: symbol;
  readonly position: Vector2;
  readonly rotation: number; // degrees
  readonly scale: Vector2;
}

/**
 * Skeleton is a collection of bones.
 * @lab-docgen
 */
export interface Skeleton {
  readonly bones: ReadonlyMap<symbol, Bone>;
}
