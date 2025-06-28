/**
 * <blend-graph> web component for visually blending multiple animation layers (keyframe, procedural, IK).
 *
 * Inputs: skeleton poses (via addLayer API)
 * Outputs: blended skeleton pose (dispatches "blendupdate" events with detail.pose)
 */

type SkeletonPose = { [bone: string]: { x: number; y: number; rotation: number; length: number } };

interface LayerInfo {
  id: string;
  name: string;
  enabled: boolean;
  weight: number;
  pose: SkeletonPose;
}

export class BlendGraph extends HTMLElement {
  private readonly layers = new Map<string, LayerInfo>();
  private readonly container!: HTMLElement;
  private readonly addBtn!: HTMLButtonElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display: block; background: var(--lab-pane-bg, #222); color: var(--lab-fg, #fff); padding: 8px; border-radius: 4px; }
        .toolbar { margin-bottom: 8px; }
        button { margin-right: 4px; }
        .node { border: 1px solid #555; padding: 4px; margin-bottom: 4px; display: flex; align-items: center; }
        .node span { flex: 1; }
        .node input[type=range] { width: 100px; margin: 0 8px; }
      </style>
      <div class="toolbar">
        <button id="addLayer">Add Layer</button>
      </div>
      <div id="layers"></div>
    `;
    this.container = shadow.getElementById('layers') as HTMLElement;
    this.addBtn = shadow.getElementById('addLayer') as HTMLButtonElement;
  }

  connectedCallback() {
    this.addBtn.addEventListener('click', async () => {
      const dlg = document.querySelector('prompt-dialog');
      if (dlg) {
        const name = await (dlg as any).prompt('Layer name:');
        if (name) this.addLayer(name, {} as SkeletonPose);
      }
    });
  }

  /**
   * Add a new layer node with initial pose data
   */
  addLayer(name: string, pose: SkeletonPose) {
    const id = crypto.randomUUID();
    const info: LayerInfo = { id, name, enabled: true, weight: 1, pose };
    this.layers.set(id, info);
    this.renderLayer(info);
    this.recalculate();
  }

  /**
   * Remove a layer by its id
   */
  removeLayer(id: string) {
    this.layers.delete(id);
    const nodeEl = this.container.querySelector(`[data-id="${id}"]`);
    nodeEl?.remove();
    this.recalculate();
  }

  /**
   * Render a single layer node entry
   */
  private renderLayer(info: LayerInfo) {
    const el = document.createElement('div');
    el.className = 'node';
    el.dataset.id = info.id;
    el.innerHTML = `
      <input type="checkbox" ${info.enabled ? 'checked' : ''} />
      <span>${info.name}</span>
      <input type="range" min="0" max="1" step="0.01" value="${info.weight}" title="Weight" />
      <button title="Remove">🗑️</button>
    `;
    // events
    const checkbox = el.querySelector('input[type=checkbox]') as HTMLInputElement;
    const slider = el.querySelector('input[type=range]') as HTMLInputElement;
    const btn = el.querySelector('button') as HTMLButtonElement;
    checkbox.addEventListener('change', () => {
      info.enabled = checkbox.checked;
      this.recalculate();
    });
    slider.addEventListener('input', () => {
      info.weight = parseFloat(slider.value);
      this.recalculate();
    });
    btn.addEventListener('click', () => this.removeLayer(info.id));
    this.container.appendChild(el);
  }

  /**
   * Blend all enabled layers by their weights and dispatch update
   */
  private recalculate() {
    const result: SkeletonPose = {};
    let totalWeight = 0;
    // accumulate weighted transforms
    for (const info of this.layers.values()) {
      if (!info.enabled) continue;
      totalWeight += info.weight;
      for (const bone in info.pose) {
        const p = info.pose[bone];
        if (!result[bone]) result[bone] = { x: 0, y: 0, rotation: 0, length: 0 };
        result[bone].x += p.x * info.weight;
        result[bone].y += p.y * info.weight;
        result[bone].rotation += p.rotation * info.weight;
        result[bone].length += p.length * info.weight;
      }
    }
    // normalize by total weight
    if (totalWeight > 0) {
      for (const bone in result) {
        result[bone].x /= totalWeight;
        result[bone].y /= totalWeight;
        result[bone].rotation /= totalWeight;
        result[bone].length /= totalWeight;
      }
    }
    this.dispatchEvent(new CustomEvent('blendupdate', { detail: { pose: result } }));
  }
}

customElements.define('blend-graph', BlendGraph);
