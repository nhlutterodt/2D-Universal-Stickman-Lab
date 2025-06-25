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
  private readonly _localeUnsubscribe?: () => void;

  constructor() {
    super();
    
    try {
      this.attachShadow({ mode: 'open' });
      
      if (!this.shadowRoot) {
        throw new Error('Failed to create shadow root for inspector-pane');
      }
      
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      
      // Store unsubscribe function for cleanup
      const unsubscribe = onLocaleChange(() => {
        try {
          this._update();
        } catch (error) {
          console.error('Error updating inspector-pane locale:', error);
        }
      });
      
      // Only assign if onLocaleChange actually returns an unsubscribe function
      if (typeof unsubscribe === 'function') {
        (this as any)._localeUnsubscribe = unsubscribe;
      }
      
      // Initial update
      this._update();
    } catch (error) {
      console.error('Error initializing inspector-pane:', error);
      // Fallback: create basic content without shadow DOM
      this.textContent = 'Inspector (Error)';
    }
  }

  connectedCallback() {
    console.debug('inspector-pane connected to DOM');
  }

  disconnectedCallback() {
    console.debug('inspector-pane disconnected from DOM');
    // Clean up locale change listener
    if (this._localeUnsubscribe) {
      try {
        this._localeUnsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from locale changes:', error);
      }
    }
  }

  private _update(): void {
    if (!this.shadowRoot) {
      console.warn('Cannot update inspector-pane: shadow root not available');
      return;
    }

    try {
      const header = this.shadowRoot.querySelector('header');
      if (header) {
        header.textContent = t('inspector');
      } else {
        console.warn('Header element not found in inspector-pane');
      }

      const div = this.shadowRoot.querySelector('div');
      if (div) {
        div.textContent = t('selectEntity');
      } else {
        console.warn('Content div not found in inspector-pane');
      }
    } catch (error) {
      console.error('Error updating inspector-pane content:', error);
    }
  }
}

// Validate that custom elements registry is available
if (typeof customElements !== 'undefined') {
  customElements.define('inspector-pane', InspectorPane);
} else {
  console.error('Custom elements not supported - inspector-pane cannot be registered');
}
