/**
 * <timeline-pane> for animation timeline.
 * @lab-docgen
 */
import './lab-pane.js';
import { t, onLocaleChange } from './i18n.js';

const template = document.createElement('template');
template.innerHTML = `
  <lab-pane>
    <header slot="header">${t('timeline')}</header>
    <div tabindex="0" style="outline:none;">${t('timelinePlaceholder')}</div>
  </lab-pane>
`;

export class TimelinePane extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    onLocaleChange(() => this._update());
  }
  _update() {
    const header = this.shadowRoot?.querySelector('header');
    if (header) header.textContent = t('timeline');
    const div = this.shadowRoot?.querySelector('div');
    if (div) div.textContent = t('timelinePlaceholder');
  }
}
customElements.define('timeline-pane', TimelinePane);
