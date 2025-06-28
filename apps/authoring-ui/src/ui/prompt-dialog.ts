// ui/prompt-dialog.ts
// Reusable modal prompt dialog Web Component

export class PromptDialog extends HTMLElement {
  private dialog: HTMLDialogElement;
  private input: HTMLInputElement;
  private messageEl: HTMLElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        dialog {
          border: none;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.5);
          background: var(--lab-pane-bg, #222);
          color: var(--lab-fg, #fff);
        }
        form {
          display: flex;
          flex-direction: column;
        }
        input {
          margin: 8px 0;
          padding: 4px 8px;
          font-size: 14px;
        }
        menu {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }
        button {
          padding: 4px 12px;
          font-size: 14px;
        }
      </style>
      <dialog>
        <form method="dialog">
          <label id="message"></label>
          <input id="promptInput" type="text" />
          <menu>
            <button value="cancel">Cancel</button>
            <button value="confirm">OK</button>
          </menu>
        </form>
      </dialog>
    `;
    this.dialog = shadow.querySelector('dialog')!;
    this.input = shadow.getElementById('promptInput') as HTMLInputElement;
    this.messageEl = shadow.getElementById('message') as HTMLElement;
  }

  /**
   * Show the prompt dialog with the given message.
   * Resolves with the entered string, or null if canceled.
   */
  prompt(message: string): Promise<string | null> {
    return new Promise(resolve => {
      this.messageEl.textContent = message;
      this.input.value = '';
      this.dialog.showModal();
      const cleanup = () => {
        this.dialog.close();
        this.dialog.removeEventListener('close', onClose);
      };
      const onClose = () => {
        const returnValue = this.dialog.returnValue;
        cleanup();
        if (returnValue === 'confirm') {
          resolve(this.input.value);
        } else {
          resolve(null);
        }
      };
      this.dialog.addEventListener('close', onClose);
    });
  }
}

customElements.define('prompt-dialog', PromptDialog);
