/**
 * <graph-pane> for rendering real-time bone metrics graphs.
 * Depends on global Chart (loaded via CDN).
 */

const template = document.createElement('template');
template.innerHTML = `
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
      cursor: pointer;
    }
  </style>
  <canvas></canvas>
  <button id="exportGraphBtn">Export Graph Data</button>
`;

class GraphPane extends HTMLElement {
  constructor() {
    super();
    this.chart = null;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const canvas = this.shadowRoot.querySelector('canvas');
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

    const btn = this.shadowRoot.getElementById('exportGraphBtn');
    btn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('exportgraph', { bubbles: true }));
    });
  }

  /** Update the graph with a new data point */
  updateData(time, series) {
    if (!this.chart) return;
    this.chart.data.labels.push(time);
    this.chart.data.datasets[0].data.push(series.length);
    this.chart.data.datasets[1].data.push(series.rotation);
    this.chart.data.datasets[2].data.push(series.x);
    this.chart.data.datasets[3].data.push(series.y);
    this.chart.update();
  }
}

customElements.define('graph-pane', GraphPane);
