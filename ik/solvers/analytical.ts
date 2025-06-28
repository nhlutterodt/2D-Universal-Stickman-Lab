// ik/solvers/analytical.ts
// Analytical 2-bone IK solver using Law of Cosines

import { Vector2 } from '../../math/vector.js';
import { Bone } from '../../skeleton/bone.js';

/**
 * Solve a 2-bone IK chain analytically.
 * @param bone1 - First bone (e.g. upper arm)
 * @param bone2 - Second bone (e.g. forearm)
 * @param target - Target point in world coordinates
 */
export function solveAnalyticalIK(bone1: Bone, bone2: Bone, target: Vector2): void {
  // Base position of bone1
  const basePos = bone1.worldPosition;

  // Compute target vector
  const dx = target.x - basePos.x;
  const dy = target.y - basePos.y;
  const dist = Math.hypot(dx, dy);

  const l1 = bone1.length;
  const l2 = bone2.length;

  // Clamp distance to reachable range
  const maxReach = l1 + l2;
  const minReach = Math.abs(l1 - l2);
  const clampedDist = Math.min(maxReach, Math.max(dist, minReach));

  // Law of Cosines for angle at joint2
  const cosAngle2 = (clampedDist * clampedDist - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  const angle2 = Math.acos(Math.min(1, Math.max(-1, cosAngle2)));

  // Angle from base to target
  const baseAngle = Math.atan2(dy, dx);

  // Law of Cosines for angle at joint1
  const cosAngle1 = (l1 * l1 + clampedDist * clampedDist - l2 * l2) / (2 * l1 * clampedDist);
  const angle1Offset = Math.acos(Math.min(1, Math.max(-1, cosAngle1)));
  const angle1 = baseAngle - angle1Offset;

  // Update local rotations
  // bone1.rotation is local relative to its parent; if bone1.parent worldRotation is non-zero, subtract that
  const parentRot = bone1.parent ? bone1.parent.worldRotation : 0;
  bone1.rotation = angle1 - parentRot;

  // bone2.rotation is relative to bone1's local frame
  bone2.rotation = angle2;
}
