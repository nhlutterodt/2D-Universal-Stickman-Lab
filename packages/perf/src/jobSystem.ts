/**
 * JobSystem using Atomics.waitAsync (SharedArrayBuffer required).
 * @lab-docgen
 * Requires: TypeScript lib set to es2024 or later for Atomics.waitAsync.
 */
export class JobSystem {
  private readonly queue: (() => void)[] = [];
  private readonly signal = new Int32Array(new SharedArrayBuffer(4));
  private running = false;

  post(job: () => void) {
    this.queue.push(job);
    Atomics.notify(this.signal, 0, 1);
  }

  async run() {
    this.running = true;
    while (this.running) {
      if (this.queue.length === 0) {
        // @ts-expect-error: Atomics.waitAsync requires es2024 lib
        await Atomics.waitAsync(this.signal, 0, 0).value;
      }
      const job = this.queue.shift();
      if (job) job();
    }
  }

  stop() {
    this.running = false;
    Atomics.notify(this.signal, 0, 1);
  }
}
