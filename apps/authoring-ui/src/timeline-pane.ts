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
  private static readonly DEBUG = false;

  constructor() {
    try {
      super();
      this.attachShadow({ mode: 'open' });
      
      if (!this.shadowRoot) {
        throw new Error('Failed to create shadow root');
      }
      
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      onLocaleChange(() => this._update());
      
      if (TimelinePane.DEBUG) {
        console.log('TimelinePane: initialized successfully');
      }
    } catch (error) {
      console.error('TimelinePane: constructor failed', error);
      throw error;
    }
  }

  private _update(): void {
    try {
      if (!this.shadowRoot) {
        console.warn('TimelinePane: shadowRoot not available during update');
        return;
      }

      const header = this.shadowRoot.querySelector('header');
      if (header) {
        header.textContent = t('timeline');
      } else {
        console.warn('TimelinePane: header element not found');
      }

      const div = this.shadowRoot.querySelector('div');
      if (div) {
        div.textContent = t('timelinePlaceholder');
      } else {
        console.warn('TimelinePane: div element not found');
      }

      if (TimelinePane.DEBUG) {
        console.log('TimelinePane: update completed');
      }
    } catch (error) {
      console.error('TimelinePane: update failed', error);
    }
  }
}
customElements.define('timeline-pane', TimelinePane);
