// math/vector.ts
// Optimized Vector2 implementation using Float32Array

export class Vector2 {
  readonly data: Float32Array;

  constructor(x = 0, y = 0) {
    this.data = new Float32Array(2);
    this.data[0] = x;
    this.data[1] = y;
  }

  get x(): number { return this.data[0]; }
  get y(): number { return this.data[1]; }
  set x(value: number) { this.data[0] = value; }
  set y(value: number) { this.data[1] = value; }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  normalize(): Vector2 {
    const len = this.length() || 1;
    return new Vector2(this.x / len, this.y / len);
  }

  rotate(angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  toArray(dst?: number[]): number[] {
    if (dst) {
      dst[0] = this.x;
      dst[1] = this.y;
      return dst;
    }
    return [this.x, this.y];
  }
}
