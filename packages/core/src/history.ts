/**
 * Undo/redo ring buffer for state snapshots (max 50).
 * @lab-docgen
 */
export class History<T> {
  private readonly buffer: T[] = [];
  private pointer = -1;
  private size = 0;
  private readonly max = 50;

  constructor(initial: T) {
    this.buffer.push(initial);
    this.pointer = 0;
    this.size = 1;
  }

  /**
   * Push a new state (structural sharing)
   */
  push(state: T): void {
    if (this.pointer < this.size - 1) {
      this.buffer.splice(this.pointer + 1);
      this.size = this.pointer + 1;
    }
    if (this.size === this.max) {
      this.buffer.shift();
      this.size--;
      this.pointer--;
    }
    this.buffer.push(state);
    this.size++;
    this.pointer++;
  }

  /** Undo to previous state */
  undo(): T {
    if (this.pointer > 0) this.pointer--;
    return this.buffer[this.pointer];
  }

  /** Redo to next state */
  redo(): T {
    if (this.pointer < this.size - 1) this.pointer++;
    return this.buffer[this.pointer];
  }

  /** Get current state */
  current(): T {
    return this.buffer[this.pointer];
  }
}
