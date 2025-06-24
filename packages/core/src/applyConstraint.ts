/**
 * Pure function to apply a constraint to a skeleton.
 * Returns new bone transforms (structural sharing).
 * @lab-docgen
 */
import { Skeleton } from './skeleton';
import { Constraint } from './constraint';

export function applyConstraint(skel: Skeleton, constraint: Constraint): Skeleton {
  // For demo: just return the same skeleton (stub)
  // Real implementation would compute new bone transforms
  return skel;
}
