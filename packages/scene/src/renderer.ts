/**
 * Custom WebGL2 renderer for @lab/scene.
 * @lab-docgen
 */
import { CommandBuffer } from './commandBuffer';
import { SceneNode } from './sceneNode';

export class Renderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly commandBuffer = new CommandBuffer();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * Render a frame: build command list, sort, execute.
   */
  renderFrame(root: SceneNode): void {
    this.commandBuffer.clear();
    this.buildCommandList(root);
    this.commandBuffer.sort();
    this.commandBuffer.execute(this.gl);
  }

  /**
   * Traverse scene and build command list (frustum culling, sort keys)
   */
  private buildCommandList(node: SceneNode): void {
    // TODO: Frustum culling, sort keys, and pass-specific logic
    for (const child of node.children) {
      this.buildCommandList(child);
    }
  }
}
