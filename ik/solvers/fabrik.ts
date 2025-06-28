// ik/solvers/fabrik.ts
// FABRIK IK solver with soft angle limits and bend direction hints

import { Vector2 } from '../../math/vector';
import { Bone } from '../../skeleton/bone.js';
import { applySoftAngleLimit, applyBendDirection } from '../constraints.js';

/**
 * Solve IK using the FABRIK algorithm on a 2-bone or longer chain.
 * @param chain Ordered array of bones (root to end-effector)
 * @param target Target position in world coordinates
 * @param iterations Maximum iteration count
 * @param tolerance Distance threshold to stop iterating
 * @param minAngles Optional array of minimum local angle limits per bone
 * @param maxAngles Optional array of maximum local angle limits per bone
 * @param springFactor Soft limit spring correction factor (0-1)
 * @param bendDirections Optional array of bendDirection (1 or -1) per bone
 */
export function solveFABRIK(
  chain: Bone[],
  target: Vector2,
  iterations: number = 10,
  tolerance: number = 0.001,
  minAngles?: number[],
  maxAngles?: number[],
  springFactor: number = 0.2,
  bendDirections?: (1 | -1)[]
): number {
  const n = chain.length;
  if (n === 0) return 0;

  // Ensure world transforms are up-to-date
  chain[0].parent?.updateWorldTransform();

  // Build initial joint positions
  const positions: Vector2[] = [];
  for (let i = 0; i < n; i++) {
    positions[i] = chain[i].worldPosition.clone();
  }
  // Add end-effector point
  const last = chain[n - 1];
  positions[n] = new Vector2(
    last.worldPosition.x + last.length * Math.cos(last.worldRotation),
    last.worldPosition.y + last.length * Math.sin(last.worldRotation)
  );

  // Bone lengths
  const lengths = chain.map(b => b.length);
  const totalLength = lengths.reduce((a, b) => a + b, 0);
  const rootPos = positions[0].clone();

  // Check reachability
  const distToTarget = positions[0].sub(target).length();
  if (distToTarget > totalLength) {
    // stretch toward target
    for (let i = 0; i < n; i++) {
      const r = target.sub(positions[i]).normalize();
      positions[i + 1] = positions[i].add(r.scale(lengths[i]));
    }
  } else {
    // iterative FABRIK
    let usedIter = iterations;
    for (let iter = 0; iter < iterations; iter++) {
      // Forward reaching
      positions[n] = target.clone();
      for (let i = n - 1; i >= 0; i--) {
        const r = positions[i].sub(positions[i + 1]).normalize();
        positions[i] = positions[i + 1].add(r.scale(lengths[i]));
      }
      // Backward reaching
      positions[0] = rootPos.clone();
      for (let i = 0; i < n; i++) {
        const r = positions[i + 1].sub(positions[i]).normalize();
        positions[i + 1] = positions[i].add(r.scale(lengths[i]));
      }
      // Check convergence
      if (positions[n].sub(target).length() < tolerance) { usedIter = iter + 1; break; }
    }
  }

  // Update bone rotations and apply constraints
  for (let i = 0; i < n; i++) {
    const p = positions[i];
    const q = positions[i + 1];
    const delta = q.sub(p);
    const globalAngle = Math.atan2(delta.y, delta.x);
    const parentRot = chain[i].parent ? chain[i].parent.worldRotation : 0;
    chain[i].rotation = globalAngle - parentRot;
    // apply soft limits
    if (minAngles && maxAngles) {
      applySoftAngleLimit(chain[i], minAngles[i], maxAngles[i], springFactor);
    }
    // apply bend direction
    if (bendDirections) {
      applyBendDirection(chain[i], 0, bendDirections[i]);
    }
  }
  return typeof usedIter !== 'undefined' ? usedIter : iterations;
}
