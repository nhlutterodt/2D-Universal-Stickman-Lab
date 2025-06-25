// Enhanced 2D Skeleton Editor with improved architecture and performance
// Integrates with core types, adds undo/redo, DOM caching, and hierarchical support

import { Vector2 } from '@lab/math';
import { History } from '@lab/core';

interface EditorBone {
  id: symbol;
  name: string;
  length: number;
  rotation: number;
  position: Vector2;
  color: string;
  parentId?: symbol;
  visible: boolean;
}

interface EditorState {
  bones: Map<symbol, EditorBone>;
  selectedBoneId: symbol | null;
}

class SkeletonEditor {
  private readonly history: History<EditorState>;
  private readonly domCache: Map<string, HTMLElement> = new Map();
  private renderScheduled = false;
  private color1 = '#ff0000';
  private color2 = '#00ffff';

  constructor() {
    const initialState: EditorState = {
      bones: new Map(),
      selectedBoneId: null
    };
    this.history = new History(initialState);
    
    this.initUI();
    this.renderBoneList();
    this.scheduleRender();
    this.renderStats();
  }

  private getElement<T extends HTMLElement>(id: string): T | null {
    if (!this.domCache.has(id)) {
      const element = document.getElementById(id) as T;
      if (element) {
        this.domCache.set(id, element);
      }
    }
    return this.domCache.get(id) as T || null;
  }

  private getCurrentState(): EditorState {
    return this.history.current();
  }

  private saveState(newState: EditorState): void {
    this.history.push(newState);
  }

  private scheduleRender(): void {
    if (!this.renderScheduled) {
      this.renderScheduled = true;
      requestAnimationFrame(() => {
        this.renderPreview();
        this.renderScheduled = false;
      });
    }
  }

  private createThrottledInputHandler(handler: () => void, delay: number = 16): () => void {
    let timeoutId: number | null = null;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(handler, delay);
    };
  }

  private validateBoneName(name: string): string | null {
    if (!name.trim()) return 'Bone name required';
    const state = this.getCurrentState();
    const existingBone = Array.from(state.bones.values()).find(b => b.name === name);
    if (existingBone) return 'Duplicate bone name';
    return null;
  }

  private getSelectedBone(): EditorBone | null {
    const state = this.getCurrentState();
    return state.selectedBoneId ? state.bones.get(state.selectedBoneId) || null : null;
  }

  private addBone(name: string): void {
    const validation = this.validateBoneName(name);
    if (validation) {
      this.showMsg(validation);
      return;
    }

    const currentState = this.getCurrentState();
    const newBone: EditorBone = {
      id: Symbol(name),
      name,
      length: 50,
      rotation: 0,
      position: new Vector2(0, 0),
      color: this.color1,
      visible: true
    };

    const newBones = new Map(currentState.bones);
    newBones.set(newBone.id, newBone);

    const newState: EditorState = {
      bones: newBones,
      selectedBoneId: newBone.id
    };

    this.saveState(newState);
    this.renderBoneList();
    this.scheduleRender();
    this.renderStats();
    this.showMsg('Bone added');
  }

  private deleteBone(): void {
    const selectedBone = this.getSelectedBone();
    if (!selectedBone) {
      this.showMsg('No bone selected');
      return;
    }

    const currentState = this.getCurrentState();
    const newBones = new Map(currentState.bones);
    newBones.delete(selectedBone.id);

    const newState: EditorState = {
      bones: newBones,
      selectedBoneId: null
    };

    this.saveState(newState);
    this.renderBoneList();
    this.scheduleRender();
    this.renderStats();
    this.showMsg('Bone deleted');
  }

  private updateBoneProperty(boneId: symbol, property: keyof EditorBone, value: any): void {
    const currentState = this.getCurrentState();
    const bone = currentState.bones.get(boneId);
    if (!bone) return;

    const newBones = new Map(currentState.bones);
    const updatedBone = { ...bone, [property]: value };
    newBones.set(boneId, updatedBone);

    const newState: EditorState = {
      bones: newBones,
      selectedBoneId: currentState.selectedBoneId
    };

    this.saveState(newState);
    this.scheduleRender();
    this.renderStats();
  }

  private selectBone(boneId: symbol): void {
    const currentState = this.getCurrentState();
    const newState: EditorState = {
      bones: currentState.bones,
      selectedBoneId: boneId
    };

    this.saveState(newState);
    this.updateSliders();
    this.renderBoneList();
    this.scheduleRender();
  }

  private undo(): void {
    this.history.undo();
    this.renderBoneList();
    this.scheduleRender();
    this.renderStats();
    this.updateSliders();
  }

  private redo(): void {
    this.history.redo();
    this.renderBoneList();
    this.scheduleRender();
    this.renderStats();
    this.updateSliders();
  }

  private initUI(): void {
    const addBtn = this.getElement<HTMLButtonElement>('addBoneBtn');
    const nameInput = this.getElement<HTMLInputElement>('boneNameInput');
    const boneList = this.getElement<HTMLUListElement>('boneList');
    const deleteBtn = this.getElement<HTMLButtonElement>('deleteBoneBtn');
    const lengthSlider = this.getElement<HTMLInputElement>('boneLengthSlider');
    const rotationSlider = this.getElement<HTMLInputElement>('boneRotationSlider');
    const xSlider = this.getElement<HTMLInputElement>('boneXSlider');
    const ySlider = this.getElement<HTMLInputElement>('boneYSlider');
    const color1Input = this.getElement<HTMLInputElement>('color1');
    const color2Input = this.getElement<HTMLInputElement>('color2');
    const saveBtn = this.getElement<HTMLButtonElement>('saveCharacterBtn');
    const loadBtn = this.getElement<HTMLButtonElement>('loadCharacterBtn');
    const loadInput = this.getElement<HTMLInputElement>('loadCharacterInput');
    const resetBtn = this.getElement<HTMLButtonElement>('resetCharacterBtn');

    if (addBtn && nameInput) {
      addBtn.onclick = () => {
        const name = nameInput.value.trim();
        this.addBone(name);
        nameInput.value = '';
      };
    }

    if (boneList) {
      boneList.onclick = (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'LI') {
          const boneId = target.dataset.boneId;
          if (boneId) {
            this.selectBone(Symbol.for(boneId));
          }
        }
      };
    }

    if (deleteBtn) {
      deleteBtn.onclick = () => this.deleteBone();
    }

    // Throttled slider handlers for better performance
    if (lengthSlider) {
      const throttledLengthHandler = this.createThrottledInputHandler(() => {
        const selectedBone = this.getSelectedBone();
        if (selectedBone) {
          this.updateBoneProperty(selectedBone.id, 'length', +lengthSlider.value);
          this.updateSliders();
        }
      });
      lengthSlider.oninput = throttledLengthHandler;
    }

    if (rotationSlider) {
      const throttledRotationHandler = this.createThrottledInputHandler(() => {
        const selectedBone = this.getSelectedBone();
        if (selectedBone) {
          this.updateBoneProperty(selectedBone.id, 'rotation', +rotationSlider.value);
          this.updateSliders();
        }
      });
      rotationSlider.oninput = throttledRotationHandler;
    }

    if (xSlider) {
      const throttledXHandler = this.createThrottledInputHandler(() => {
        const selectedBone = this.getSelectedBone();
        if (selectedBone) {
          const newPosition = new Vector2(+xSlider.value, selectedBone.position.y);
          this.updateBoneProperty(selectedBone.id, 'position', newPosition);
          this.updateSliders();
        }
      });
      xSlider.oninput = throttledXHandler;
    }

    if (ySlider) {
      const throttledYHandler = this.createThrottledInputHandler(() => {
        const selectedBone = this.getSelectedBone();
        if (selectedBone) {
          const newPosition = new Vector2(selectedBone.position.x, +ySlider.value);
          this.updateBoneProperty(selectedBone.id, 'position', newPosition);
          this.updateSliders();
        }
      });
      ySlider.oninput = throttledYHandler;
    }

    if (color1Input) {
      color1Input.oninput = () => {
        this.color1 = color1Input.value;
        const selectedBone = this.getSelectedBone();
        if (selectedBone) {
          this.updateBoneProperty(selectedBone.id, 'color', this.color1);
        }
      };
    }

    if (color2Input) {
      color2Input.oninput = () => {
        this.color2 = color2Input.value;
        this.scheduleRender();
      };
    }

    if (saveBtn) {
      saveBtn.onclick = () => this.saveCharacter();
    }

    if (loadBtn && loadInput) {
      loadBtn.onclick = () => loadInput.click();
      loadInput.onchange = () => this.loadCharacter(loadInput);
    }

    if (resetBtn) {
      resetBtn.onclick = () => this.resetCharacter();
    }

    // Add keyboard shortcuts for undo/redo
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          this.undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          this.redo();
        }
      }
    });
  }

  private updateSliders(): void {
    const bone = this.getSelectedBone();
    
    const lengthSlider = this.getElement<HTMLInputElement>('boneLengthSlider');
    const rotationSlider = this.getElement<HTMLInputElement>('boneRotationSlider');
    const xSlider = this.getElement<HTMLInputElement>('boneXSlider');
    const ySlider = this.getElement<HTMLInputElement>('boneYSlider');
    
    const lengthValue = this.getElement<HTMLElement>('boneLengthValue');
    const rotationValue = this.getElement<HTMLElement>('boneRotationValue');
    const xValue = this.getElement<HTMLElement>('boneXValue');
    const yValue = this.getElement<HTMLElement>('boneYValue');

    if (lengthSlider) lengthSlider.value = bone ? String(bone.length) : '50';
    if (rotationSlider) rotationSlider.value = bone ? String(bone.rotation) : '0';
    if (xSlider) xSlider.value = bone ? String(bone.position.x) : '0';
    if (ySlider) ySlider.value = bone ? String(bone.position.y) : '0';
    
    if (lengthValue) lengthValue.textContent = bone ? String(bone.length) : '50';
    if (rotationValue) rotationValue.textContent = bone ? `${bone.rotation}°` : '0°';
    if (xValue) xValue.textContent = bone ? String(bone.position.x) : '0';
    if (yValue) yValue.textContent = bone ? String(bone.position.y) : '0';
  }

  private renderBoneList(): void {
    const ul = this.getElement<HTMLUListElement>('boneList');
    if (!ul) return;

    const state = this.getCurrentState();
    ul.innerHTML = '';
    
    for (const bone of state.bones.values()) {
      const li = document.createElement('li');
      li.className = 'bone-list-item' + (bone.id === state.selectedBoneId ? ' selected' : '');
      li.textContent = bone.name;
      li.dataset.boneId = Symbol.keyFor(bone.id) || bone.id.toString();
      ul.appendChild(li);
    }
    this.updateSliders();
  }

  private renderPreview(): void {
    const canvas = this.getElement<HTMLCanvasElement>('characterCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = canvas.parentElement?.clientHeight || 400;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const state = this.getCurrentState();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Render bones with hierarchical support
    const renderBone = (bone: EditorBone, parentTransform?: { x: number; y: number; rotation: number }) => {
      if (!bone.visible) return;

      ctx.save();
      
      let worldX = centerX + bone.position.x;
      let worldY = centerY + bone.position.y;
      let worldRotation = bone.rotation;

      // Apply parent transform if this bone has a parent
      if (parentTransform) {
        worldX = parentTransform.x + bone.position.x;
        worldY = parentTransform.y + bone.position.y;
        worldRotation = parentTransform.rotation + bone.rotation;
      }

      ctx.translate(worldX, worldY);
      ctx.rotate((worldRotation * Math.PI) / 180);
      ctx.strokeStyle = bone.color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(bone.length, 0);
      ctx.stroke();

      // Draw joint at bone origin
      ctx.fillStyle = bone.color;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore();

      // Render child bones
      const childBones = Array.from(state.bones.values()).filter(b => b.parentId === bone.id);
      for (const childBone of childBones) {
        const endX = worldX + Math.cos(worldRotation * Math.PI / 180) * bone.length;
        const endY = worldY + Math.sin(worldRotation * Math.PI / 180) * bone.length;
        renderBone(childBone, { x: endX, y: endY, rotation: worldRotation });
      }
    };

    // Render root bones (bones without parents)
    const rootBones = Array.from(state.bones.values()).filter(b => !b.parentId);
    for (const bone of rootBones) {
      renderBone(bone);
    }
  }

  private renderStats(): void {
    const el = this.getElement<HTMLElement>('stats-explanation');
    if (!el) return;

    const state = this.getCurrentState();
    const totalBones = state.bones.size;
    const selectedBone = this.getSelectedBone();
    
    let statsText = `Total bones: ${totalBones}`;
    if (selectedBone) {
      statsText += ` | Selected: ${selectedBone.name}`;
      if (selectedBone.parentId) {
        const parent = state.bones.get(selectedBone.parentId);
        if (parent) {
          statsText += ` | Parent: ${parent.name}`;
        }
      }
    }
    
    el.textContent = statsText;
  }

  private saveCharacter(): void {
    const state = this.getCurrentState();
    const exportData = {
      bones: Array.from(state.bones.entries()).map(([id, bone]) => ({
        ...bone,
        id: Symbol.keyFor(id) || id.toString(),
        parentId: bone.parentId ? Symbol.keyFor(bone.parentId) || bone.parentId.toString() : undefined,
        position: { x: bone.position.x, y: bone.position.y }
      }))
    };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'character.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showMsg('Character saved');
  }

  private loadCharacter(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.bones || !Array.isArray(data.bones)) {
          throw new Error('Invalid format');
        }

        const newBones = new Map<symbol, EditorBone>();
        for (const boneData of data.bones) {
          const bone: EditorBone = {
            id: Symbol.for(boneData.id),
            name: boneData.name,
            length: boneData.length,
            rotation: boneData.rotation,
            position: new Vector2(boneData.position.x, boneData.position.y),
            color: boneData.color,
            parentId: boneData.parentId ? Symbol.for(boneData.parentId) : undefined,
            visible: boneData.visible !== false
          };
          newBones.set(bone.id, bone);
        }

        const newState: EditorState = {
          bones: newBones,
          selectedBoneId: null
        };

        this.saveState(newState);
        this.renderBoneList();
        this.scheduleRender();
        this.renderStats();
        this.showMsg('Character loaded');
      } catch {
        this.showMsg('Invalid file');
      }
    };
    reader.readAsText(file);
  }

  private resetCharacter(): void {
    const newState: EditorState = {
      bones: new Map(),
      selectedBoneId: null
    };

    this.saveState(newState);
    this.renderBoneList();
    this.scheduleRender();
    this.renderStats();
    this.showMsg('Character reset');
  }

  private showMsg(msg: string): void {
    const box = this.getElement<HTMLElement>('messageBox');
    if (!box) return;

    box.textContent = msg;
    box.classList.add('show');
    setTimeout(() => box.classList.remove('show'), 1500);
  }
}

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SkeletonEditor());
} else {
  new SkeletonEditor();
}
