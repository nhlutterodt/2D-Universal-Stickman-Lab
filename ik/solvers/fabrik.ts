// ik/solvers/fabrik.ts
// FABRIK IK solver with soft angle limits and bend direction hints

import { Vector2 } from '../../math/vector.js';
import { Bone } from '../../skeleton/bone.js';
import { applySoftAngleLimit, applyBendDirection } from '../constraints.js';

/**
 * Solve IK using the FABRIK algorithm on a 2-bone or longer chain.
 * @param chain Ordered array of bones (root to end-effector)
 * @param target Target position in world coordinates
 * @param options Configuration options for the solver
 */
export function solveFABRIK(
  chain: Bone[],
  target: Vector2,
  options?: {
    iterations?: number;
    tolerance?: number;
    minAngles?: number[];
    maxAngles?: number[];
    springFactor?: number;
    bendDirections?: (1 | -1)[];
  }
): number {
  const {
    iterations = 10,
    tolerance = 0.001,
    minAngles,
    maxAngles,
    springFactor = 0.2,
    bendDirections
  } = options || {};
  
  const n = chain.length;
  if (n === 0) return 0;

  // Ensure world transforms are up-to-date
  chain[0].parent?.updateWorldTransform();

  // Build initial joint positions
  const positions: Vector2[] = [];
  const lengths: number[] = [];
  
  for (let i = 0; i < n; i++) {
    positions[i] = chain[i].worldPosition.clone();
    if (i < n - 1) {
      lengths[i] = chain[i].length;
    }
  }
  
  // Add end-effector point
  const last = chain[n - 1];
  const endPoint = last.worldPosition.add(new Vector2(last.length, 0).rotate(last.worldRotation));
  positions[n] = endPoint;
  
  // Calculate total length
  const totalLength = lengths.reduce((sum, len) => sum + len, 0);
  const rootPos = positions[0].clone();
  
  // Check reachability
  const distToTarget = positions[0].sub(target).length();
  let usedIter = iterations;
  
  if (distToTarget > totalLength) {
    // Stretch toward target
    const direction = target.sub(positions[0]).normalize();
    for (let i = 0; i < n; i++) {
      positions[i + 1] = positions[i].add(direction.scale(lengths[i]));
    }
    usedIter = 1;
  } else {
    // Iterative FABRIK
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
      if (positions[n].sub(target).length() < tolerance) {
        usedIter = iter + 1;
        break;
      }
    }
  }

  // Update bone rotations and apply constraints
  for (let i = 0; i < n; i++) {
    const p = positions[i];
    const q = positions[i + 1];
    const delta = q.sub(p);
    const globalAngle = Math.atan2(delta.y, delta.x);
    const parentRot = chain[i].parent?.worldRotation ?? 0;
    chain[i].rotation = globalAngle - parentRot;
    
    // Apply soft limits
    if (minAngles && maxAngles) {
      applySoftAngleLimit(chain[i], minAngles[i], maxAngles[i], springFactor);
    }
    
    // Apply bend direction
    if (bendDirections) {
      applyBendDirection(chain[i], 0, bendDirections[i]);
    }
  }
  
  return usedIter;
}
