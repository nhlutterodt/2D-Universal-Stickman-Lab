/**
 * <inspector-pane> for entity/component inspection.
 * @lab-docgen
 */
import './lab-pane.js';
import { t, onLocaleChange } from './i18n.js';

const template = document.createElement('template');
template.innerHTML = `
  <lab-pane>
    <header slot="header">${t('inspector')}</header>
    <div tabindex="0" style="outline:none;">${t('selectEntity')}</div>
  </lab-pane>
`;

export class InspectorPane extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    onLocaleChange(() => this._update());
  }
  _update() {
    const header = this.shadowRoot?.querySelector('header');
    if (header) header.textContent = t('inspector');
    const div = this.shadowRoot?.querySelector('div');
    if (div) div.textContent = t('selectEntity');
  }
}
customElements.define('inspector-pane', InspectorPane);
