/**
 * Immutable 2D vector with operator-like helpers.
 * @lab-docgen
 */
export class Vector2 {
  /** X component */
  readonly x: number;
  /** Y component */
  readonly y: number;

  /**
   * Create a new Vector2
   * @param x X component
   * @param y Y component
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }

  /**
   * Add two vectors
   * @param v Other vector
   * @returns New Vector2
   */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /**
   * Dot product
   * @param v Other vector
   * @returns Scalar dot product
   */
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Multiply by 2x3 matrix
   * @param m Matrix2x3
   * @returns New Vector2
   */
  mulMat(m: Matrix2x3): Vector2 {
    return new Vector2(
      m.m00 * this.x + m.m01 * this.y + m.m02,
      m.m10 * this.x + m.m11 * this.y + m.m12
    );
  }

  /**
   * Vector length
   * @returns Length
   */
  length(): number {
    return Math.hypot(this.x, this.y);
  }

  /**
   * Normalize vector
   * @returns New normalized Vector2
   */
  normalize(): Vector2 {
    const len = this.length();
    return len === 0 ? new Vector2(0, 0) : new Vector2(this.x / len, this.y / len);
  }

  /**
   * Convert to Float32Array
   * @returns Float32Array [x, y]
   */
  toArray(): Float32Array {
    return new Float32Array([this.x, this.y]);
  }
}

/**
 * Immutable 2x3 matrix for 2D affine transforms.
 * @lab-docgen
 */
export class Matrix2x3 {
  /** Matrix elements */
  readonly m00: number;
  readonly m01: number;
  readonly m02: number;
  readonly m10: number;
  readonly m11: number;
  readonly m12: number;

  /**
   * Create a new Matrix2x3
   * @param m00 Row 0, Col 0
   * @param m01 Row 0, Col 1
   * @param m02 Row 0, Col 2
   * @param m10 Row 1, Col 0
   * @param m11 Row 1, Col 1
   * @param m12 Row 1, Col 2
   */
  constructor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number) {
    this.m00 = m00;
    this.m01 = m01;
    this.m02 = m02;
    this.m10 = m10;
    this.m11 = m11;
    this.m12 = m12;
    Object.freeze(this);
  }

  /**
   * Multiply matrix by Vector2
   * @param v Vector2
   * @returns New Vector2
   */
  mulVec(v: Vector2): Vector2 {
    return new Vector2(
      this.m00 * v.x + this.m01 * v.y + this.m02,
      this.m10 * v.x + this.m11 * v.y + this.m12
    );
  }

  /**
   * Matrix multiply (2x3 * 2x3)
   * @param m Other Matrix2x3
   * @returns New Matrix2x3
   */
  mulMat(m: Matrix2x3): Matrix2x3 {
    return new Matrix2x3(
      this.m00 * m.m00 + this.m01 * m.m10,
      this.m00 * m.m01 + this.m01 * m.m11,
      this.m00 * m.m02 + this.m01 * m.m12 + this.m02,
      this.m10 * m.m00 + this.m11 * m.m10,
      this.m10 * m.m01 + this.m11 * m.m11,
      this.m10 * m.m02 + this.m11 * m.m12 + this.m12
    );
  }

  /**
   * Convert to Float32Array
   * @returns Float32Array [m00, m01, m02, m10, m11, m12]
   */
  toArray(): Float32Array {
    return new Float32Array([
      this.m00, this.m01, this.m02,
      this.m10, this.m11, this.m12
    ]);
  }
}
