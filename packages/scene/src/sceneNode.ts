/**
 * SceneNode: base class for scene graph nodes.
 * @lab-docgen
 */
import { Matrix2x3, Vector2 } from '@lab/math';

export class SceneNode {
  readonly children: SceneNode[] = [];
  readonly parent: SceneNode | null = null;
  readonly localMatrix: Matrix2x3;
  readonly worldMatrix: Matrix2x3;
  readonly position: Vector2;
  readonly rotation: number;
  readonly scale: Vector2;

  constructor(
    position = new Vector2(0, 0),
    rotation = 0,
    scale = new Vector2(1, 1),
    localMatrix?: Matrix2x3,
    worldMatrix?: Matrix2x3
  ) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.localMatrix = localMatrix ?? new Matrix2x3(1, 0, position.x, 0, 1, position.y);
    this.worldMatrix = worldMatrix ?? this.localMatrix;
  }

  /**
   * Add a child node
   */
  add(child: SceneNode): this {
    this.children.push(child);
    (child as any).parent = this;
    return this;
  }

  /**
   * Set position (returns new SceneNode)
   */
  setPosition(x: number, y: number): SceneNode {
    return new SceneNode(new Vector2(x, y), this.rotation, this.scale);
  }
}
