// skeleton/skeleton.ts
// Manages a collection of Bones and performs global FK updates

import { Bone } from './bone';
import { Vector2 } from '../math/vector';

export class Skeleton {
  bones: Map<symbol, Bone> = new Map();
  roots: Bone[] = [];

  /** Add a new bone to the hierarchy */
  addBone(bone: Bone, parentId?: symbol): void {
    this.bones.set(bone.id, bone);
    if (parentId) {
      const parent = this.bones.get(parentId);
      if (parent) {
        parent.addChild(bone);
      } else {
        console.warn(`Parent bone ${String(parentId)} not found`);
        this.roots.push(bone);
      }
    } else {
      this.roots.push(bone);
    }
  }

  /** Remove a bone and its subtree */
  removeBone(id: symbol): void {
    const bone = this.bones.get(id);
    if (!bone) return;

    // Detach from parent
    if (bone.parent) {
      bone.parent.removeChild(bone);
    } else {
      // was root
      const idx = this.roots.indexOf(bone);
      if (idx >= 0) this.roots.splice(idx, 1);
    }

    // Recursively remove children
    for (const child of bone.children.slice()) {
      this.removeBone(child.id);
    }

    this.bones.delete(id);
  }

  /** Recursively update world transforms of all bones */
  updateWorldTransform(): void {
    for (const root of this.roots) {
      root.updateWorldTransform(new Vector2(0, 0), 0);
    }
  }

  /** Retrieve a bone by its symbol ID */
  getBone(id: symbol): Bone | null {
    return this.bones.get(id) || null;
  }

  /** Clear entire skeleton */
  clear(): void {
    this.bones.clear();
    this.roots = [];
  }
}
