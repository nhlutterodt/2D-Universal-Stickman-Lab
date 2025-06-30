// skeleton/bone.ts
// Defines a Bone with parent/child hierarchy and FK transform propagation

import { Vector2 } from '../math/vector.js';
import { Matrix3 } from '../math/matrix.js';

export class Bone {
  readonly id: symbol;
  name: string;
  length: number;
  rotation: number;        // local rotation in radians
  position: Vector2;       // local position offset from parent
  parent: Bone | null;
  children: Bone[];
  worldPosition: Vector2;  // computed global position
  worldRotation: number;   // computed global rotation

  constructor(
    id: symbol,
    name: string,
    length: number = 50,
    rotation: number = 0,
    position: Vector2 = new Vector2(0, 0),
    parent: Bone | null = null
  ) {
    this.id = id;
    this.name = name;
    this.length = length;
    this.rotation = rotation;
    this.position = position;
    this.parent = parent;
    this.children = [];
    this.worldPosition = new Vector2();
    this.worldRotation = 0;
  }

  addChild(child: Bone): void {
    child.parent = this;
    this.children.push(child);
  }

  removeChild(child: Bone): void {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
  }

  /**
   * Recursively updates world transform based on parent's world transform.
   * @param parentPos Global position of parent bone.
   * @param parentRot Global rotation of parent bone (radians).
   */
  updateWorldTransform(parentPos: Vector2 = new Vector2(0, 0), parentRot: number = 0): void {
    // Build parent transform matrix and apply local transform
    const parentTrans = Matrix3.fromTranslation(parentPos.x, parentPos.y)
      .multiply(Matrix3.fromRotation(parentRot));
    const localTrans = Matrix3.fromTranslation(this.position.x, this.position.y)
      .multiply(Matrix3.fromRotation(this.rotation));
    const worldMatrix = parentTrans.multiply(localTrans);
    // Update world rotation
    this.worldRotation = parentRot + this.rotation;
    // Update world position
    const wp = worldMatrix.applyTo({ x: 0, y: 0 });
    this.worldPosition = new Vector2(wp.x, wp.y);

    // Propagate to children using end-of-bone transform
    const endTrans = worldMatrix.multiply(Matrix3.fromTranslation(this.length, 0));
    const endPos = endTrans.applyTo({ x: 0, y: 0 });
    for (const child of this.children) {
      child.updateWorldTransform(new Vector2(endPos.x, endPos.y), this.worldRotation);
    }
  }
}
