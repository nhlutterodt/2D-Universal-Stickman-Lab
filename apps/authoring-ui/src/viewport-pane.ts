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
  private _isDestroyed = false;
  private _localeUnsubscribe?: () => void;

  constructor() {
    super();
    
    try {
      this.attachShadow({ mode: 'open' });
      
      if (!this.shadowRoot) {
        console.error('[ViewportPane] Failed to create shadow root');
        return;
      }
      
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      
      // Store unsubscribe function for cleanup
      this._localeUnsubscribe = onLocaleChange(() => {
        if (!this._isDestroyed) {
          this._update();
        }
      }) ?? undefined;
      
      this._update();
      
    } catch (error) {
      console.error('[ViewportPane] Constructor error:', error);
    }
  }

  connectedCallback() {
    console.debug('[ViewportPane] Connected to DOM');
  }

  disconnectedCallback() {
    console.debug('[ViewportPane] Disconnected from DOM');
    this._cleanup();
  }

  private _cleanup() {
    this._isDestroyed = true;
    if (this._localeUnsubscribe) {
      this._localeUnsubscribe();
      this._localeUnsubscribe = undefined;
    }
  }

  private _update() {
    try {
      if (this._isDestroyed || !this.shadowRoot) {
        console.debug('[ViewportPane] Skipping update - component destroyed or no shadow root');
        return;
      }

      const header = this.shadowRoot.querySelector('header');
      if (header) {
        header.textContent = t('viewport');
        console.debug('[ViewportPane] Header updated');
      } else {
        console.warn('[ViewportPane] Header element not found in shadow DOM');
      }
    } catch (error) {
      console.error('[ViewportPane] Update error:', error);
    }
  }
}
customElements.define('viewport-pane', ViewportPane);
