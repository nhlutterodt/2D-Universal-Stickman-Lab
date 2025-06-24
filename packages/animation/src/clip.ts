/**
 * Animation Clip: key-frame data for bones.
 * @lab-docgen
 */
import { Vector2 } from '@lab/math';

export interface Keyframe {
  time: number;
  value: number | Vector2;
}

export class Clip {
  readonly name: string;
  readonly duration: number;
  readonly tracks: Map<string, Keyframe[]>;

  constructor(name: string, duration: number, tracks: Map<string, Keyframe[]>) {
    this.name = name;
    this.duration = duration;
    this.tracks = tracks;
  }

  /**
   * Sample a track at time (linear interp)
   */
  sample(track: string, time: number): number | Vector2 | undefined {
    const keys = this.tracks.get(track);
    if (!keys || keys.length === 0) return undefined;
    if (time <= keys[0].time) return keys[0].value;
    if (time >= keys[keys.length - 1].time) return keys[keys.length - 1].value;
    for (let i = 1; i < keys.length; ++i) {
      if (time < keys[i].time) {
        const k0 = keys[i - 1], k1 = keys[i];
        const t = (time - k0.time) / (k1.time - k0.time);
        if (typeof k0.value === 'number' && typeof k1.value === 'number')
          return k0.value * (1 - t) + k1.value * t;
        if (k0.value instanceof Vector2 && k1.value instanceof Vector2)
          return new Vector2(
            k0.value.x * (1 - t) + k1.value.x * t,
            k0.value.y * (1 - t) + k1.value.y * t
          );
      }
    }
    return undefined;
  }
}
