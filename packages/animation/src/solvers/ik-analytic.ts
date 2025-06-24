/**
 * Analytic 2-bone IK solver.
 * @lab-docgen
 */
import { Vector2 } from '@lab/math';

export function solveIKAnalytic(a: Vector2, b: Vector2, target: Vector2, l1: number, l2: number): { angle0: number, angle1: number } {
  // Law of cosines
  const dx = target.x - a.x, dy = target.y - a.y;
  const d = Math.hypot(dx, dy);
  const clampedD = Math.max(0, Math.min(d, l1 + l2));
  const angleA = Math.acos((l1*l1 + clampedD*clampedD - l2*l2) / (2*l1*clampedD));
  const angleB = Math.atan2(dy, dx);
  const angle0 = angleB - angleA;
  const angle1 = Math.acos((l1*l1 + l2*l2 - clampedD*clampedD) / (2*l1*l2));
  return { angle0, angle1 };
}
