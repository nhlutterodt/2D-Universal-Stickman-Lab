// math/vector.js
// Transpiled JS version of Vector2 for browser import
export class Vector2 {
  constructor(x = 0, y = 0) {
    this.data = new Float32Array(2);
    this.data[0] = x;
    this.data[1] = y;
  }
  get x() { return this.data[0]; }
  get y() { return this.data[1]; }
  set x(value) { this.data[0] = value; }
  set y(value) { this.data[1] = value; }
  clone() { return new Vector2(this.x, this.y); }
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  scale(scalar) { return new Vector2(this.x * scalar, this.y * scalar); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  length() { return Math.hypot(this.x, this.y); }
  normalize() { const len = this.length() || 1; return new Vector2(this.x / len, this.y / len); }
  toArray(dst) { if (dst) { dst[0] = this.x; dst[1] = this.y; return dst; } return [this.x, this.y]; }
}
