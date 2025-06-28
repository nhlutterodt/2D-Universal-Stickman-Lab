// ui/prompt-dialog.js
// Reusable modal prompt dialog Web Component

export class PromptDialog extends HTMLElement {
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
    this._dialog = shadow.querySelector('dialog');
    this._input = shadow.getElementById('promptInput');
    this._message = shadow.getElementById('message');
  }

  prompt(message) {
    return new Promise(resolve => {
      this._message.textContent = message;
      this._input.value = '';
      this._dialog.showModal();
      const onClose = () => {
        const returnValue = this._dialog.returnValue;
        this._dialog.removeEventListener('close', onClose);
        this._dialog.close();
        resolve(returnValue === 'confirm' ? this._input.value : null);
      };
      this._dialog.addEventListener('close', onClose);
    });
  }
}

customElements.define('prompt-dialog', PromptDialog);
