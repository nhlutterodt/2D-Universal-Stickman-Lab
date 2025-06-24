/**
 * <perf-hud> custom element overlays frame/mem/gc stats.
 * @lab-docgen
 */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      position: fixed;
      top: 0; right: 0;
      background: rgba(0,0,0,0.7);
      color: #fff;
      font: 12px monospace;
      z-index: 9999;
      padding: 8px;
      border-radius: 0 0 0 8px;
      pointer-events: none;
    }
    .spike { color: #ff4; }
  </style>
  <div id="hud"></div>
`;

export class PerfHUD extends HTMLElement {
  private lastFrame = performance.now();
  private frameTimes: number[] = [];
  private mem = 0;
  private gcSpike = false;
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    this.tick = this.tick.bind(this);
  }
  connectedCallback() { this.tick(); }
  tick() {
    const now = performance.now();
    const dt = now - this.lastFrame;
    this.lastFrame = now;
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 60) this.frameTimes.shift();
    // Memory (if available)
    if ((performance as any).memory) {
      this.mem = (performance as any).memory.usedJSHeapSize / 1048576;
    }
    // GC spike detection
    this.gcSpike = dt > 20;
    this.render();
    requestAnimationFrame(this.tick);
  }
  render() {
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const max = Math.max(...this.frameTimes);
    const hud = this.shadowRoot?.getElementById('hud');
    hud!.innerHTML = `Frame: ${avg.toFixed(1)} ms<br>Max: <span class="${max > 20 ? 'spike' : ''}">${max.toFixed(1)} ms</span><br>Mem: ${this.mem.toFixed(1)} MB`;
  }
}
customElements.define('perf-hud', PerfHUD);

// Toggle with F10
window.addEventListener('keydown', e => {
  if (e.key === 'F10') {
    const hud = document.querySelector('perf-hud');
    if (hud) hud.remove();
    else document.body.appendChild(document.createElement('perf-hud'));
  }
});
