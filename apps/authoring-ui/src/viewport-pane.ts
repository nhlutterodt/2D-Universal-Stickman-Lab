/**
 * <viewport-pane> for 2D/3D scene view.
 * @lab-docgen
 */
import './lab-pane.js';
import { t, onLocaleChange } from './i18n.js';

const template = document.createElement('template');
template.innerHTML = `
  <lab-pane>
    <header slot="header">${t('viewport')}</header>
    <canvas tabindex="0" style="width:100%;height:100%;outline:none;"></canvas>
  </lab-pane>
`;

export class ViewportPane extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    onLocaleChange(() => this._update());
  }
  _update() {
    const header = this.shadowRoot?.querySelector('header');
    if (header) header.textContent = t('viewport');
  }
}
customElements.define('viewport-pane', ViewportPane);
