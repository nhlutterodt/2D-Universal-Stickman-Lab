/**
 * <graph-pane> for rendering real-time bone metrics graphs.
 * Depends on global Chart (loaded via CDN).
 */

declare const Chart: any;

export class GraphPane extends HTMLElement {
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
            </style>
            <canvas></canvas>
            <button id="exportGraphBtn">Export Graph Data</button>
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
                    { label: 'Average Y', data: [], borderColor: 'blue', fill: false }
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
    }

    /**
     * Update the graph with a new data point.
     */
    updateData(time: number, series: { length: number; rotation: number; x: number; y: number }) {
        if (!this.chart) return;
        this.chart.data.labels.push(time);
        (this.chart.data.datasets[0].data as number[]).push(series.length);
        (this.chart.data.datasets[1].data as number[]).push(series.rotation);
        (this.chart.data.datasets[2].data as number[]).push(series.x);
        (this.chart.data.datasets[3].data as number[]).push(series.y);
        this.chart.update();
    }
}

customElements.define('graph-pane', GraphPane);
