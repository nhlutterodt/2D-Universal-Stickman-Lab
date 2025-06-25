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
  
  private readonly _debug: boolean;
  private _mouseUpHandler: (() => void) | null = null;

  constructor() {
    super();
    
    try {
      this._debug = localStorage.getItem('lab-pane-debug') === 'true';
    } catch (e) {
      console.warn('LabPane: Unable to access localStorage for debug flag', e);
      this._debug = false;
    }

    this._log('Initializing LabPane');

    try {
      this.attachShadow({ mode: 'open' });
      
      if (!this.shadowRoot) {
        throw new Error('Failed to create shadow root');
      }
      
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this.tabIndex = 0;
      
      this.addEventListener('focus', this._onFocus.bind(this));
      this.addEventListener('blur', this._onBlur.bind(this));
      this.addEventListener('keydown', this._onKeyDown.bind(this));
      this.addEventListener('mousedown', this._onDragStart.bind(this));
      
      this._log('LabPane initialized successfully');
    } catch (error) {
      console.error('LabPane: Initialization failed', error);
      throw error;
    }
  }

  connectedCallback() {
    this._log('LabPane connected to DOM');
  }

  disconnectedCallback() {
    this._log('LabPane disconnected from DOM');
    this._cleanupDragHandlers();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    this._log(`Attribute changed: ${name} from "${oldValue}" to "${newValue}"`);
  }

  private _log(message: string, ...args: any[]) {
    if (this._debug) {
      console.log(`[LabPane:${this.id || 'unnamed'}] ${message}`, ...args);
    }
  }

  private _onFocus() {
    try {
      this._log('Focus received');
      this.setAttribute('focused', '');
    } catch (error) {
      console.error('LabPane: Error handling focus', error);
    }
  }

  private _onBlur() {
    try {
      this._log('Focus lost');
      this.removeAttribute('focused');
    } catch (error) {
      console.error('LabPane: Error handling blur', error);
    }
  }

  private _onKeyDown(e: KeyboardEvent) {
    try {
      this._log('Key pressed:', e.key);
      
      if (!e.key) {
        this._log('Warning: KeyboardEvent missing key property');
        return;
      }

      if (e.key === 'Tab') {
        this.setAttribute('focused', '');
      }
    } catch (error) {
      console.error('LabPane: Error handling keydown', error);
    }
  }

  private _onDragStart(e: MouseEvent) {
    try {
      const target = e.target as HTMLElement;
      
      if (!target) {
        this._log('Warning: MouseEvent missing target');
        return;
      }

      this._log('Drag start detected on element:', target.tagName, 'slot:', target.slot);

      if (target.slot === 'header') {
        this.setAttribute('dragging', '');
        this._setupDragHandlers();
      }
    } catch (error) {
      console.error('LabPane: Error handling drag start', error);
    }
  }

  private _setupDragHandlers() {
    try {
      this._cleanupDragHandlers();
      
      this._mouseUpHandler = () => {
        try {
          this._log('Drag ended');
          this.removeAttribute('dragging');
          this._cleanupDragHandlers();
        } catch (error) {
          console.error('LabPane: Error ending drag', error);
        }
      };

      document.addEventListener('mouseup', this._mouseUpHandler, { once: true });
      this._log('Drag handlers setup');
    } catch (error) {
      console.error('LabPane: Error setting up drag handlers', error);
    }
  }

  private _cleanupDragHandlers() {
    if (this._mouseUpHandler) {
      document.removeEventListener('mouseup', this._mouseUpHandler);
      this._mouseUpHandler = null;
      this._log('Drag handlers cleaned up');
    }
  }
}

// Wrap custom element definition in try-catch
try {
  customElements.define('lab-pane', LabPane);
} catch (error) {
  console.error('Failed to define lab-pane custom element:', error);
}
