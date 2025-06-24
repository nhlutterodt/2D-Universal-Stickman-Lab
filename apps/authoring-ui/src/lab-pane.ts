/**
 * <lab-pane> base element for dockable panels.
 * @lab-docgen
 */
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      background: var(--lab-pane-bg, #181a1b);
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: box-shadow 0.2s, transform 0.2s;
      outline: none;
    }
    :host([focused]) {
      box-shadow: 0 0 0 3px var(--lab-focus, #4d90fe);
    }
    :host([dragging]) {
      opacity: 0.7;
      transform: scale(1.02);
    }
    ::slotted(header) {
      cursor: grab;
      user-select: none;
    }
  </style>
  <slot></slot>
`;

export class LabPane extends HTMLElement {
  static get observedAttributes() { return ['focused', 'dragging']; }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.tabIndex = 0;
    this.addEventListener('focus', () => this.setAttribute('focused', ''));
    this.addEventListener('blur', () => this.removeAttribute('focused'));
    this.addEventListener('keydown', this._onKeyDown.bind(this));
    this.addEventListener('mousedown', this._onDragStart.bind(this));
  }
  _onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') this.setAttribute('focused', '');
  }
  _onDragStart(e: MouseEvent) {
    if ((e.target as HTMLElement).slot === 'header') {
      this.setAttribute('dragging', '');
      document.addEventListener('mouseup', () => this.removeAttribute('dragging'), { once: true });
    }
  }
}
customElements.define('lab-pane', LabPane);
