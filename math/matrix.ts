// math/matrix.ts
// 3x3 matrix for 2D transforms, optimized with Float32Array

import { Vector2 } from './vector.js';

export class Matrix3 {
  readonly data: Float32Array;

  constructor() {
    this.data = new Float32Array(9);
    // identity
    this.data[0] = 1; this.data[1] = 0; this.data[2] = 0;
    this.data[3] = 0; this.data[4] = 1; this.data[5] = 0;
    this.data[6] = 0; this.data[7] = 0; this.data[8] = 1;
  }

  static fromTranslation(tx: number, ty: number): Matrix3 {
    const m = new Matrix3();
    m.data[6] = tx;
    m.data[7] = ty;
    return m;
  }

  static fromRotation(theta: number): Matrix3 {
    const m = new Matrix3();
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    m.data[0] = c; m.data[1] = -s;
    m.data[3] = s; m.data[4] = c;
    return m;
  }

  static fromScale(sx: number, sy: number): Matrix3 {
    const m = new Matrix3();
    m.data[0] = sx;
    m.data[4] = sy;
    return m;
  }

  /** Multiply this matrix by another (this = this * other) */
  multiply(other: Matrix3): Matrix3 {
    const a = this.data;
    const b = other.data;
    const result = new Matrix3();
    const r = result.data;

    r[0] = a[0]*b[0] + a[1]*b[3] + a[2]*b[6];
    r[1] = a[0]*b[1] + a[1]*b[4] + a[2]*b[7];
    r[2] = a[0]*b[2] + a[1]*b[5] + a[2]*b[8];

    r[3] = a[3]*b[0] + a[4]*b[3] + a[5]*b[6];
    r[4] = a[3]*b[1] + a[4]*b[4] + a[5]*b[7];
    r[5] = a[3]*b[2] + a[4]*b[5] + a[5]*b[8];

    r[6] = a[6]*b[0] + a[7]*b[3] + a[8]*b[6];
    r[7] = a[6]*b[1] + a[7]*b[4] + a[8]*b[7];
    r[8] = a[6]*b[2] + a[7]*b[5] + a[8]*b[8];
    return result;
  }

  /** Apply this transform to a Vector2 */
  applyTo(v: { x: number; y: number }): Vector3 {
    const x = v.x, y = v.y;
    return new Vector3(
      x * this.data[0] + y * this.data[3] + this.data[6],
      x * this.data[1] + y * this.data[4] + this.data[7],
      x * this.data[2] + y * this.data[5] + this.data[8]
    );
  }
}

// Helper for homogeneous coordinates
export class Vector3 {
  readonly data: Float32Array;
  constructor(x = 0, y = 0, w = 1) {
    this.data = new Float32Array([x, y, w]);
  }
  get x(): number { return this.data[0]; }
  get y(): number { return this.data[1]; }
  get w(): number { return this.data[2]; }
}
