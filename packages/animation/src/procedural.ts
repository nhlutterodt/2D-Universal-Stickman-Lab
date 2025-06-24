/**
 * Procedural motion modules: gait, recoil, lookAt.
 * @lab-docgen
 */
import { Vector2 } from '@lab/math';

export function gait(time: number): Vector2 {
  // Simple walk cycle stub
  return new Vector2(Math.sin(time), Math.abs(Math.cos(time)));
}

export function recoil(intensity: number): number {
  // Simple recoil stub
  return Math.exp(-intensity) * Math.sin(intensity * 10);
}

export function lookAt(src: Vector2, target: Vector2): number {
  // Angle from src to target
  return Math.atan2(target.y - src.y, target.x - src.x) * 180 / Math.PI;
}
