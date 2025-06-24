/**
 * Off-screen command buffer for render commands.
 * @lab-docgen
 */
export interface RenderCommand {
  pass: number;
  sortKey: number;
  execute(gl: WebGL2RenderingContext): void;
}

export class CommandBuffer {
  private readonly commands: RenderCommand[] = [];

  add(cmd: RenderCommand): void {
    this.commands.push(cmd);
  }

  clear(): void {
    this.commands.length = 0;
  }

  sort(): void {
    this.commands.sort((a, b) => a.sortKey - b.sortKey);
  }

  execute(gl: WebGL2RenderingContext): void {
    for (const cmd of this.commands) cmd.execute(gl);
  }

  get length(): number {
    return this.commands.length;
  }
}
