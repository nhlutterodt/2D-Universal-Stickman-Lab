/**
 * <i18n-switch> locale switcher element.
 */
import { setLocale } from './i18n';

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
    try {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(template.content.cloneNode(true));

      const selectElement = shadow.querySelector('select');
      if (!selectElement) {
        console.error('I18nSwitch: select element not found in shadow DOM.');
        return;
      }
      
      selectElement.addEventListener('change', e => {
        try {
          const value = (e.target as HTMLSelectElement).value;
          setLocale(value);
        } catch (error) {
          console.error('I18nSwitch: Error handling change event:', error);
        }
      });
    } catch (error) {
      console.error('I18nSwitch: Error during construction:', error);
    }
  }

  connectedCallback() {
    try {
      if (!this.shadowRoot) {
        console.error('I18nSwitch: shadowRoot not available in connectedCallback.');
        return;
      }
      const selectElement = this.shadowRoot.querySelector('select') as HTMLSelectElement;
      if (!selectElement) {
        console.error('I18nSwitch: select element not found in shadow DOM during connectedCallback.');
        return;
      }
      const current = localStorage.getItem('lab-locale') || 'en';
      selectElement.value = current;
    } catch (error) {
      console.error('I18nSwitch: Error in connectedCallback:', error);
    }
  }
}

customElements.define('i18n-switch', I18nSwitch);
