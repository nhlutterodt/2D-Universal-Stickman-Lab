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
    try {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(template.content.cloneNode(true));
    } catch (error) {
      console.error('Error attaching shadow root or cloning template:', error);
    }

    try {
      onLocaleChange(() => this._update());
    } catch (error) {
      console.error('Error initializing locale change listener:', error);
    }
  }

  _update() {
    try {
      const header = this.shadowRoot?.querySelector('header');
      if (header) {
        header.textContent = t('curveEditor');
      } else {
        console.warn('Header element not found in shadow DOM.');
      }

      const div = this.shadowRoot?.querySelector('div');
      if (div) {
        div.textContent = t('curveEditorPlaceholder');
      } else {
        console.warn('Div element not found in shadow DOM.');
      }
    } catch (error) {
      console.error('Error updating content in shadow DOM:', error);
    }
  }
}

try {
  customElements.define('curve-editor-pane', CurveEditorPane);
} catch (error) {
  console.error('Error defining custom element <curve-editor-pane>:', error);
}
