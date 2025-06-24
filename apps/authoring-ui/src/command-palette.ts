import { t, onLocaleChange } from './i18n.js';
/**
 * <command-palette> global command palette, Ctrl/⌘+K.
 * @lab-docgen
 */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      position: fixed;
      left: 50%; top: 10%;
      transform: translateX(-50%);
      min-width: 320px;
      background: var(--lab-pane-bg, #222);
      border-radius: 8px;
      box-shadow: 0 4px 32px #0008;
      z-index: 1000;
      outline: none;
      display: none;
    }
    :host([open]) { display: block; }
    input {
      width: 100%;
      font-size: 1.1em;
      padding: 0.5em;
      border: none;
      outline: none;
      background: transparent;
      color: var(--lab-fg, #fff);
    }
  </style>
  <input type="text" placeholder="${t('commandPalettePlaceholder')}" />
`;

export class CommandPalette extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    this.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.removeAttribute('open');
    });
    onLocaleChange(() => this._update());
  }
  open() {
    this.setAttribute('open', '');
    const input = this.shadowRoot?.querySelector('input');
    input?.focus();
  }
  close() {
    this.removeAttribute('open');
  }
  _update() {
    const input = this.shadowRoot?.querySelector('input');
    if (input) input.placeholder = t('commandPalettePlaceholder');
  }
}
customElements.define('command-palette', CommandPalette);

// Bind Ctrl/⌘+K
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    (document.querySelector('command-palette') as any)?.open();
  }
});
