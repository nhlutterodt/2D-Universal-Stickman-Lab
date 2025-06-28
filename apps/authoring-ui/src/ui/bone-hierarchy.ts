/**
 * <bone-hierarchy> Web Component: Draggable tree view of bones with inline editing and visibility toggles.
 *
 * Usage: 
 *   const bh = document.querySelector('bone-hierarchy');
 *   bh.setBones(boneList); // array of { id: string, name: string, visible: boolean, parentId?: string }
 *
 * Emits:
 *   - "renamebone" { detail: { id, name } }
 *   - "togglevisibility" { detail: { id, visible } }
 *   - "reparentbone" { detail: { id, newParentId } }
 */

interface BoneItem { id: string; name: string; visible: boolean; parentId?: string }

export class BoneHierarchy extends HTMLElement {
  private readonly container!: HTMLElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display: block; padding: 8px; background: var(--lab-pane-bg, #222); color: var(--lab-fg, #fff); border-radius: 4px; }
        ul { list-style: none; padding-left: 16px; }
        li { margin: 4px 0; cursor: pointer; display: flex; align-items: center; }
        li.drag-over { background: rgba(255,255,0,0.2); }
        .label { flex: 1; user-select: none; }
        input.rename { width: auto; }
      </style>
      <ul id="tree"></ul>
    `;
    this.container = shadow.getElementById('tree') as HTMLElement;
  }

  /**
   * Set or update the bone list. Call whenever skeleton changes.
   */
  setBones(bones: BoneItem[]) {
    this.container.innerHTML = '';
    const map = new Map<string, BoneItem[]>();
    bones.forEach(b => {
      const pid = b.parentId ?? '__root';
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(b);
    });
    const renderList = (parentId: string, parentEl: HTMLElement) => {
      const items = map.get(parentId) || [];
      items.forEach(b => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.id = b.id;
        // visibility toggle
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = b.visible;
        chk.addEventListener('change', () => this.dispatchEvent(new CustomEvent('togglevisibility', { detail: { id: b.id, visible: chk.checked }, bubbles: true })));
        li.appendChild(chk);
        // label
        const span = document.createElement('span');
        span.className = 'label';
        span.textContent = b.name;
        span.addEventListener('dblclick', () => this.startRename(span, b.id));
        li.appendChild(span);
        // drag events
        li.addEventListener('dragstart', e => e.dataTransfer!.setData('text/plain', b.id));
        li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('drag-over'); });
        li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
        li.addEventListener('drop', e => {
          e.preventDefault(); li.classList.remove('drag-over');
          const draggedId = e.dataTransfer!.getData('text/plain');
          if (draggedId && draggedId !== b.id) {
            this.dispatchEvent(new CustomEvent('reparentbone', { detail: { id: draggedId, newParentId: b.id }, bubbles: true }));
          }
        });
        parentEl.appendChild(li);
        // children
        const childUl = document.createElement('ul');
        li.appendChild(childUl);
        renderList(b.id, childUl);
      });
    };
    renderList('__root', this.container);
  }

  private startRename(span: HTMLElement, id: string) {
    const oldName = span.textContent ?? '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldName;
    input.className = 'rename';
    span.replaceWith(input);
    input.focus();
    input.select();
    const finish = () => {
      const newName = input.value.trim() || oldName;
      this.dispatchEvent(new CustomEvent('renamebone', { detail: { id, name: newName }, bubbles: true }));
      span.textContent = newName;
      input.replaceWith(span);
    };
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(); });
  }
}

customElements.define('bone-hierarchy', BoneHierarchy);
