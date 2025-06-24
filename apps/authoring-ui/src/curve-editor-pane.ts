/**
 * <curve-editor-pane> for editing animation curves.
 * @lab-docgen
 */
import './lab-pane.js';
import { t, onLocaleChange } from './i18n.js';

const template = document.createElement('template');
template.innerHTML = `
  <lab-pane>
    <header slot="header">${t('curveEditor')}</header>
    <div tabindex="0" style="outline:none;">${t('curveEditorPlaceholder')}</div>
  </lab-pane>
`;

export class CurveEditorPane extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    onLocaleChange(() => this._update());
  }
  _update() {
    const header = this.shadowRoot?.querySelector('header');
    if (header) header.textContent = t('curveEditor');
    const div = this.shadowRoot?.querySelector('div');
    if (div) div.textContent = t('curveEditorPlaceholder');
  }
}
customElements.define('curve-editor-pane', CurveEditorPane);
