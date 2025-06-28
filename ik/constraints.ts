// ik/constraints.ts
// Constraint functions for IK solvers

import { Bone } from '../skeleton/bone.js';

/**
 * Apply a soft angle limit to a bone's local rotation.
 * If the rotation is outside [minAngle, maxAngle], it is pulled back by springFactor.
 * @param bone The bone whose local rotation to constrain
 * @param minAngle Minimum allowed angle (radians)
 * @param maxAngle Maximum allowed angle (radians)
 * @param springFactor Amount of correction per iteration (0-1)
 */
export function applySoftAngleLimit(
  bone: Bone,
  minAngle: number,
  maxAngle: number,
  springFactor: number = 0.2
): void {
  const a = bone.rotation;
  if (a < minAngle) {
    bone.rotation += (minAngle - a) * springFactor;
  } else if (a > maxAngle) {
    bone.rotation -= (a - maxAngle) * springFactor;
  }
}

/**
 * Enforce a preferred bend direction sign for a joint.
 * @param bone The bone to enforce bend direction on
 * @param centerAngle The nominal centered angle
 * @param bendDirection 1 for default, -1 for inverted
 */
export function applyBendDirection(
  bone: Bone,
  centerAngle: number,
  bendDirection: 1 | -1
): void {
  // ensure bone.rotation stays on correct side of center
  const offset = bone.rotation - centerAngle;
  if (offset * bendDirection < 0) {
    bone.rotation = centerAngle + bendDirection * Math.abs(offset);
  }
}
