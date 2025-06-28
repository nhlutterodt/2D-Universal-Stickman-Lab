/**
 * <graph-pane> for rendering real-time bone metrics graphs.
 * Depends on global Chart (loaded via CDN).
 */

declare const Chart: any;

export class GraphPane extends HTMLElement {
    private readonly seriesData = { time: [] as number[], length: [] as number[], rotation: [] as number[], x: [] as number[], y: [] as number[], iterations: [] as number[], distance: [] as number[] };
    private currentUnit: 'px' | 'cm' = 'px';
    private readonly unitFactors = { px: 1, cm: 0.026 }; // example conversion
    private chart: any = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        container.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 8px;
                    background: var(--lab-pane-bg, #222);
                    color: var(--lab-fg, #fff);
                    border-radius: 4px;
                    margin-bottom: 8px;
                }
                canvas {
                    width: 100%;
                    height: 200px;
                }
                button {
                    margin-top: 4px;
                    padding: 4px 8px;
                }
                input[type=range] {
                    width: 100%;
                    margin-top: 4px;
                }
            </style>
            <canvas></canvas>
            <button id="exportGraphBtn">Export Graph Data</button>
            <input type="range" id="timeScrubber" min="0" max="0" value="0" />
            <label for="unitSelect">Units:</label>
            <select id="unitSelect">
              <option value="px">px</option>
              <option value="cm">cm</option>
            </select>
        `;
        shadow.appendChild(container);
    }

    connectedCallback() {
        const canvas = this.shadowRoot!.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx || typeof Chart === 'undefined') {
            console.error('Chart.js is required for <graph-pane>');
            return;
        }
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'Average Length', data: [], borderColor: 'red', fill: false },
                    { label: 'Average Rotation', data: [], borderColor: 'cyan', fill: false },
                    { label: 'Average X', data: [], borderColor: 'green', fill: false },
                    { label: 'Average Y', data: [], borderColor: 'blue', fill: false },
                    { label: 'IK Iterations', data: [], borderColor: 'yellow', fill: false },
                    { label: 'Target Distance', data: [], borderColor: 'orange', fill: false }
                ]
            },
            options: {
                scales: {
                    x: { type: 'linear', title: { display: true, text: 'Time' } },
                    y: { title: { display: true, text: 'Value' } }
                }
            }
        });

        const btn = this.shadowRoot!.getElementById('exportGraphBtn');
        btn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('exportgraph', { bubbles: true }));
        });
        // Setup scrubber control and unit selector
        const scrub = this.shadowRoot!.getElementById('timeScrubber') as HTMLInputElement;
        scrub.addEventListener('input', () => this.redrawChart(+scrub.value));
        const unitSel = this.shadowRoot!.getElementById('unitSelect') as HTMLSelectElement;
        unitSel.addEventListener('change', () => {
          this.currentUnit = unitSel.value as any;
          this.chart.options.scales.y.title.text = `Value (${this.currentUnit})`;
          const idx = scrub.valueAsNumber;
          this.redrawChart(idx);
        });
    }

    /**
     * Update the graph with a new data point.
     */
    updateData(time: number, series: { length?: number; rotation?: number; x?: number; y?: number; iterations?: number; distance?: number }) {
        if (!this.chart) return;
        // store series (defaults for missing)
        const length = series.length ?? 0;
        const rotation = series.rotation ?? 0;
        const x = series.x ?? 0;
        const y = series.y ?? 0;
        const iterations = series.iterations ?? 0;
        const distance = series.distance ?? 0;
        this.seriesData.time.push(time);
        this.seriesData.length.push(length);
        this.seriesData.rotation.push(rotation);
        this.seriesData.x.push(x);
        this.seriesData.y.push(y);
        this.seriesData.iterations.push(iterations);
        this.seriesData.distance.push(distance);
         // update chart to latest
         this.chart.data.labels = this.seriesData.time;
         this.chart.data.datasets[0].data = [...this.seriesData.length];
         this.chart.data.datasets[1].data = [...this.seriesData.rotation];
         this.chart.data.datasets[2].data = [...this.seriesData.x];
         this.chart.data.datasets[3].data = [...this.seriesData.y];
         this.chart.data.datasets[4].data = [...this.seriesData.iterations];
         this.chart.data.datasets[5].data = [...this.seriesData.distance];
         this.chart.update();
        // update scrubber range and position
        const scrub = this.shadowRoot!.getElementById('timeScrubber') as HTMLInputElement;
        if (scrub) {
          scrub.max = String(this.seriesData.time.length - 1);
          scrub.value = scrub.max;
        }
    }
    /**
     * Redraw chart up to the given index
     */
    private redrawChart(index: number) {
      if (!this.chart) return;
      const t = this.seriesData.time.slice(0, index + 1);
      this.chart.data.labels = t;
      this.chart.data.datasets[0].data = this.seriesData.length.slice(0, index + 1);
      this.chart.data.datasets[1].data = this.seriesData.rotation.slice(0, index + 1);
      this.chart.data.datasets[2].data = this.seriesData.x.slice(0, index + 1);
      this.chart.data.datasets[3].data = this.seriesData.y.slice(0, index + 1);
      this.chart.data.datasets[4].data = this.seriesData.iterations.slice(0, index + 1);
      this.chart.data.datasets[5].data = this.seriesData.distance.slice(0, index + 1);
       // Update axis labels
       this.chart.options.scales.x.title.text = 'Time (s)';
       this.chart.options.scales.y.title.text = `Value (${this.currentUnit})`;
       this.chart.update();
    }

}

customElements.define('graph-pane', GraphPane);
