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
    try {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(template.content.cloneNode(true));
    } catch (error) {
      console.error('Error creating shadow DOM:', error);
    }
    this.addEventListener('keydown', e => {
      try {
        if (e.key === 'Escape') {
          this.removeAttribute('open');
        }
      } catch (error) {
        console.error('Error handling keydown in CommandPalette:', error);
      }
    });
    onLocaleChange(() => {
      try {
        this._update();
      } catch (error) {
        console.error('Error updating locale in CommandPalette:', error);
      }
    });
  }

  open() {
    try {
      this.setAttribute('open', '');
      const input = this.shadowRoot?.querySelector('input');
      if (input) {
        input.focus();
      } else {
        console.warn('No input element found in the command palette.');
      }
    } catch (error) {
      console.error('Error in open():', error);
    }
  }

  close() {
    try {
      this.removeAttribute('open');
    } catch (error) {
      console.error('Error in close():', error);
    }
  }

  _update() {
    try {
      const input = this.shadowRoot?.querySelector('input');
      if (input) {
        input.placeholder = t('commandPalettePlaceholder');
      } else {
        console.warn('No input element found during update.');
      }
    } catch (error) {
      console.error('Error in _update():', error);
    }
  }
}

customElements.define('command-palette', CommandPalette);

// Bind Ctrl/⌘+K with additional error handling
window.addEventListener('keydown', e => {
  try {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const palette = document.querySelector('command-palette') as CommandPalette;
      if (palette && typeof palette.open === 'function') {
        palette.open();
      } else {
        console.warn('CommandPalette element not found or open() method missing.');
      }
    }
  } catch (error) {
    console.error('Error in global keydown handler:', error);
  }
});
