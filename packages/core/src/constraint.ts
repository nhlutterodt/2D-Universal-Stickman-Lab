/**
 * Analytic constraint types for bones.
 * @lab-docgen
 */
import { Vector2 } from '@lab/math';

export type Constraint = IKConstraint | LimitConstraint;

/**
 * Inverse Kinematics constraint
 */
export interface IKConstraint {
  readonly type: 'ik';
  readonly target: Vector2;
  readonly chain: symbol[];
}

/**
 * Rotation/position limit constraint
 */
export interface LimitConstraint {
  readonly type: 'limit';
  readonly bone: symbol;
  readonly minRotation?: number;
  readonly maxRotation?: number;
  readonly minPosition?: Vector2;
  readonly maxPosition?: Vector2;
}
