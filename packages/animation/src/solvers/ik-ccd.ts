/**
 * CCD IK solver (up to 10 iterations).
 * @lab-docgen
 */
import { Vector2 } from '@lab/math';

export function solveIKCCD(chain: Vector2[], target: Vector2, maxIter = 10, threshold = 0.01): Vector2[] {
  const out = chain.map(v => new Vector2(v.x, v.y));
  for (let iter = 0; iter < maxIter; ++iter) {
    for (let i = out.length - 2; i >= 0; --i) {
      const toEnd = new Vector2(out[out.length-1].x - out[i].x, out[out.length-1].y - out[i].y);
      const toTarget = new Vector2(target.x - out[i].x, target.y - out[i].y);
      const angle = Math.atan2(toTarget.y, toTarget.x) - Math.atan2(toEnd.y, toEnd.x);
      for (let j = i+1; j < out.length; ++j) {
        const dx = out[j].x - out[i].x, dy = out[j].y - out[i].y;
        const r = Math.hypot(dx, dy);
        const theta = Math.atan2(dy, dx) + angle;
        out[j] = new Vector2(out[i].x + r * Math.cos(theta), out[i].y + r * Math.sin(theta));
      }
    }
    if (Math.hypot(out[out.length-1].x - target.x, out[out.length-1].y - target.y) < threshold) break;
  }
  return out;
}
