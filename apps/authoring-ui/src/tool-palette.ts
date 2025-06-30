import { onLocaleChange } from './i18n.js';

/**
 * <tool-palette> for selecting tools on the character canvas.
 */
const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: flex;
            gap: 4px;
            width: 100%;
        }
        button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.4rem 0.6rem;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            white-space: nowrap;
            height: 2rem;
            min-width: auto;
            flex: 0 0 auto;
            background-color: transparent;
            color: var(--primary-color, #4f46e5);
        }
        button:hover:not([selected]) {
            background-color: rgba(255, 255, 255, 0.7);
        }
        button:active {
            transform: scale(0.98);
        }
        button[selected] {
            background-color: var(--primary-color, #4f46e5);
            color: white;
        }
        button[selected]:hover {
            background-color: #3730a3;
        }
    </style>
    <button data-tool="select" title="Select">🖱️</button>
    <button data-tool="add-bone" title="Add Bone">➕</button>
    <button data-tool="delete-bone" title="Delete Bone">➖</button>
    <button data-tool="pan" title="Pan">✋</button>
`;

export class ToolPalette extends HTMLElement {
    private readonly buttons!: NodeListOf<HTMLButtonElement>;
    private selectedTool: string | null = null;

    constructor() {
        super();
        try {
            const shadow = this.attachShadow({ mode: 'open' });
            shadow.appendChild(template.content.cloneNode(true));
            this.buttons = shadow.querySelectorAll('button');
            
            if (!this.buttons.length) {
                console.error('No buttons found in the tool palette template.');
            }
            
            this.buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    try {
                        this.selectTool(btn);
                    } catch (error) {
                        console.error('Error handling button click in ToolPalette:', error, e);
                    }
                });
            });

            onLocaleChange(() => {
                try {
                    this._updateTooltips();
                } catch (error) {
                    console.error('Error updating tooltips on locale change:', error);
                }
            });
        } catch (error) {
            console.error('Error initializing ToolPalette:', error);
        }
    }

    private selectTool(btn: HTMLButtonElement) {
        try {
            this.buttons.forEach(b => b.removeAttribute('selected'));
            btn.setAttribute('selected', '');
            const tool = btn.getAttribute('data-tool');
            
            if (!tool) {
                throw new Error('Button has no data-tool attribute.');
            }
            
            this.selectedTool = tool;
            this.dispatchEvent(
                new CustomEvent('toolchange', { detail: { tool }, bubbles: true })
            );
            console.debug(`Tool changed to: ${tool}`);
        } catch (error) {
            console.error('Error in selectTool:', error);
            throw error;
        }
    }

    private _updateTooltips() {
        try {
            // Placeholder: update tooltips if translations are needed.
            // This can be extended to fetch and update translated titles.
            console.debug('Updating tooltips for ToolPalette.');
        } catch (error) {
            console.error('Error in _updateTooltips:', error);
            throw error;
        }
    }
}

customElements.define('tool-palette', ToolPalette);
