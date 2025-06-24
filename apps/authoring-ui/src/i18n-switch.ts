/**
 * <i18n-switch> locale switcher element.
 */
import { setLocale } from './i18n.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: inline-block; margin: 0 8px; }
    select { font: inherit; }
  </style>
  <select>
    <option value="en">English</option>
    <option value="es">Español</option>
    <option value="ar">العربية</option>
  </select>
`;

export class I18nSwitch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    this.shadowRoot?.querySelector('select')!.addEventListener('change', e => {
      setLocale((e.target as HTMLSelectElement).value);
    });
  }
  connectedCallback() {
    const current = localStorage.getItem('lab-locale') || 'en';
    (this.shadowRoot?.querySelector('select') as HTMLSelectElement).value = current;
  }
}
customElements.define('i18n-switch', I18nSwitch);
