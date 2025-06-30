// Enhanced 2D Skeleton Editor with improved architecture and performance
// Integrates with core types, adds undo/redo, DOM caching, and hierarchical support

import { Vector2 } from '../../../math/vector.js';
import { History } from '@lab/core';
import { Bone } from '../../../skeleton/bone.js';
import { Skeleton } from '../../../skeleton/skeleton.js';
import { solveFABRIK } from '../../../ik/solvers/fabrik.js';
import type { GraphPane } from './graph-pane.js';

interface EditorBone {
  id: symbol;
  name: string;
  length: number;
  rotation: number;
  position: Vector2;
  color: string;
  parentId?: symbol;
  visible: boolean;
  minAngle?: number;
  maxAngle?: number;
}

interface EditorState {
  bones: Map<symbol, EditorBone>;
  selectedBoneId: symbol | null;
}

class SkeletonEditor {
  private readonly coreSkeleton = new Skeleton();
  private history: History<EditorState>;
  private readonly domCache: Map<string, HTMLElement> = new Map();
  private renderScheduled = false;
  private color1 = '#ff0000';
  private color2 = '#00ffff';
  
  // Click-and-drag bone creation state
  private isDraggingNewBone = false;
  private dragStartPos: Vector2 | null = null;
  private dragCurrentPos: Vector2 | null = null;
  private previewBoneId = 0; // For generating unique preview bone names
  
  // IK target
  private ikTarget = new Vector2(100, 0);

  constructor() {
    const initialState: EditorState = {
      bones: new Map(),
      selectedBoneId: null
    };
    this.history = new History(initialState);
    
    this.initUI();
    this.initCanvasHandlers();
    this.renderBoneList();
    this.scheduleRender();
    
    console.log('🎯 Click-and-drag bone creation enabled! Drag on canvas to create bones.');
    
    const graphPane = document.querySelector('graph-pane') as GraphPane | null;
    if (graphPane) {
      this.getElement<HTMLCanvasElement>('characterCanvas')?.addEventListener('metricUpdate', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        graphPane.updateData(detail.time, {
          length: detail.length,
          rotation: detail.rotation,
          x: detail.x,
          y: detail.y
        });
      });
    }
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
    console.debug("addBone called with name:", name);
    try {
      const validation = this.validateBoneName(name);
      if (validation) {
        this.showMsg(validation);
        console.debug("Bone name validation failed:", validation);
        return;
      }

      const currentState = this.getCurrentState();
      // Attempt to get the canvas for debugging; log error if not found
      const canvas = this.getElement<HTMLCanvasElement>('characterCanvas');
      if (!canvas) {
        console.warn("Canvas element 'characterCanvas' not found. New bone will be centered at origin.");
      }
      // Place new bone at origin; renderPreview will center it on canvas if available
      const centerPos = new Vector2(0, 0);
      const newBone: EditorBone = {
        id: Symbol(name),
        name,
        length: 50,
        rotation: 0,
        position: centerPos,
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
      this.showMsg('Bone added');
      console.debug("Bone added successfully:", newBone);
    } catch (error) {
      this.showMsg('Error adding bone');
      console.error("Error in addBone:", error);
    }
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
    this.updateSliders();
  }

  private redo(): void {
    this.history.redo();
    this.renderBoneList();
    this.scheduleRender();
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
    const ikX = this.getElement<HTMLInputElement>('ikTargetX');
    const ikXVal = this.getElement<HTMLElement>('ikTargetXValue');
    const ikY = this.getElement<HTMLInputElement>('ikTargetY');
    const ikYVal = this.getElement<HTMLElement>('ikTargetYValue');
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

    // IK target sliders
    if (ikX && ikXVal) {
      ikX.oninput = () => {
        this.ikTarget.x = +ikX.value;
        ikXVal.textContent = ikX.value;
        this.scheduleRender();
      };
    }
    if (ikY && ikYVal) {
      ikY.oninput = () => {
        this.ikTarget.y = +ikY.value;
        ikYVal.textContent = ikY.value;
        this.scheduleRender();
      };
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
      li.dataset.boneId = Symbol.keyFor(bone.id) ?? bone.id.toString();
      ul.appendChild(li);
    }
    this.updateSliders();
  }

  private renderPreview(): void {
    const canvas = this.getElement<HTMLCanvasElement>('characterCanvas');
    if (!canvas) return;
    // rebuild core skeleton from editor state
    this.coreSkeleton.clear();
    const state = this.getCurrentState();
    for (const eb of state.bones.values()) {
      const b = new Bone(
        eb.id,
        eb.name,
        eb.length,
        eb.rotation * Math.PI / 180,
        new Vector2(eb.position.x, eb.position.y)
      );
      this.coreSkeleton.addBone(b, eb.parentId);
    }
    this.coreSkeleton.updateWorldTransform();
    // perform FABRIK solve if a bone is selected
    if (state.selectedBoneId) {
      // build bone chain from root to selected
      const chain: Bone[] = [];
      let cur = this.coreSkeleton.getBone(state.selectedBoneId);
      while (cur) {
        chain.unshift(cur);
        cur = cur.parent;
      }
      // collect angle limits and bend directions
      const minA: number[] = [];
      const maxA: number[] = [];
      const bendDir: (1| -1)[] = [];
      chain.forEach(b => {
        const eb = state.bones.get(b.id)!;
        minA.push((eb.minAngle ?? 0) * Math.PI/180);
        maxA.push((eb.maxAngle ?? 0) * Math.PI/180);
        // default bend direction
        bendDir.push(1);
      });
      // call solver
      const iterCount = solveFABRIK(chain, this.ikTarget, {
        iterations: 10,
        tolerance: 0.001,
        minAngles: minA,
        maxAngles: maxA,
        springFactor: 0.2,
        bendDirections: bendDir
      });
      // compute distance from end-effector to target
      const end = chain[chain.length-1].worldPosition;
      const dx = end.x - this.ikTarget.x;
      const dy = end.y - this.ikTarget.y;
      const distance = Math.hypot(dx, dy);
      // emit solver metrics
      canvas.dispatchEvent(new CustomEvent('metricUpdate', {
        detail: { time: performance.now(), iterations: iterCount, distance }
      }));
      // after solve, update world transforms with new rotations
      this.coreSkeleton.updateWorldTransform();
    }
    // emit metrics for live graph
    const now = performance.now();
    const emitMetrics = (bone: Bone) => {
      canvas.dispatchEvent(new CustomEvent('metricUpdate', {
        detail: {
          boneId: bone.id,
          time: now,
          rotation: bone.worldRotation,
          length: bone.length,
          x: bone.worldPosition.x,
          y: bone.worldPosition.y
        }
      }));
      bone.children.forEach(emitMetrics);
    };
    this.coreSkeleton.roots.forEach(emitMetrics);
    // update tooltip for selected bone if constraints exist
    const sel = state.bones.get(state.selectedBoneId!);
    canvas.title = sel?.minAngle != null && sel?.maxAngle != null
      ? `Angle range: ${sel.minAngle}° to ${sel.maxAngle}°` : '';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth ?? 400;
    canvas.height = canvas.parentElement?.clientHeight ?? 400;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw each bone recursively
    const drawBone = (bone: Bone) => {
      const { x, y } = bone.worldPosition;
      const rot = bone.worldRotation;
      ctx.save();
      ctx.translate(x + centerX, y + centerY);
      ctx.rotate(rot);
      const eb = state.bones.get(bone.id)!;
      if (eb.visible) {
        ctx.strokeStyle = eb.color;
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(eb.length, 0); ctx.stroke();
        ctx.fillStyle = eb.color;
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.restore();
      bone.children.forEach(child => drawBone(child));
    };
    this.coreSkeleton.roots.forEach(root => drawBone(root));
    
    // Draw drag preview if user is dragging
    if (this.isDraggingNewBone && this.dragStartPos && this.dragCurrentPos) {
      this.drawDragPreview(ctx, centerX, centerY);
    }
  }

  private drawDragPreview(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    if (!this.dragStartPos || !this.dragCurrentPos) return;

    const startX = this.dragStartPos.x + centerX;
    const startY = this.dragStartPos.y + centerY;
    const endX = this.dragCurrentPos.x + centerX;
    const endY = this.dragCurrentPos.y + centerY;

    // Draw preview line with dashed style
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = this.color1;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.7;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw start joint
    ctx.setLineDash([]);
    ctx.fillStyle = this.color1;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(startX, startY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw end joint
    ctx.beginPath();
    ctx.arc(endX, endY, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  private showMsg(msg: string): void {
    const msgBox = this.getElement<HTMLDivElement>('msgBox');
    if (msgBox) {
      msgBox.textContent = msg;
      msgBox.style.display = 'block';
      setTimeout(() => { msgBox.style.display = 'none'; }, 3000);
    }
  }

  private saveCharacter(): void {
    const state = this.getCurrentState();
    const data = JSON.stringify(Array.from(state.bones.values()).map(b => ({
      id: b.id.toString(),
      name: b.name,
      length: b.length,
      rotation: b.rotation,
      position: { x: b.position.x, y: b.position.y },
      color: b.color,
      parentId: b.parentId ? b.parentId.toString() : null,
      visible: b.visible,
      minAngle: b.minAngle,
      maxAngle: b.maxAngle
    })), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skeleton.json';
    a.click();
    URL.revokeObjectURL(url);
    this.showMsg('Character saved');
  }

  private loadCharacter(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result;
        if (typeof json === 'string') {
          const bones = JSON.parse(json);
          const newBones = new Map<symbol, EditorBone>();
          let selectedBoneId: symbol | null = null;

          for (const b of bones) {
            const boneId = Symbol.for(b.id);
            newBones.set(boneId, {
              id: boneId,
              name: b.name,
              length: b.length,
              rotation: b.rotation,
              position: new Vector2(b.position.x, b.position.y),
              color: this.color1,
              visible: b.visible,
              minAngle: b.minAngle,
              maxAngle: b.maxAngle
            });
            if (b.id === bones[0].id) {
              selectedBoneId = boneId;
            }
          }

          const newState: EditorState = {
            bones: newBones,
            selectedBoneId
          };

          this.saveState(newState);
          this.renderBoneList();
          this.scheduleRender();
          this.showMsg('Character loaded');
        }
      } catch (err) {
        this.showMsg('Error loading character');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  private resetCharacter(): void {
    const initialState: EditorState = {
      bones: new Map(),
      selectedBoneId: null
    };
    // initialize history in resetCharacter
    this.history = new History(initialState);
    this.renderBoneList();
    this.scheduleRender();
    this.showMsg('Character reset');
  }

  private initCanvasHandlers(): void {
    const canvas = this.getElement<HTMLCanvasElement>('characterCanvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.handleCanvasMouseUp.bind(this)); // Cancel drag on leave
  }

  private handleCanvasMouseDown(event: MouseEvent): void {
    const canvas = this.getElement<HTMLCanvasElement>('characterCanvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Convert to world coordinates (centered on canvas)
    const worldX = canvasX - canvas.width / 2;
    const worldY = canvasY - canvas.height / 2;

    this.isDraggingNewBone = true;
    this.dragStartPos = new Vector2(worldX, worldY);
    this.dragCurrentPos = new Vector2(worldX, worldY);
    
    event.preventDefault();
  }

  private handleCanvasMouseMove(event: MouseEvent): void {
    if (!this.isDraggingNewBone || !this.dragStartPos) return;

    const canvas = this.getElement<HTMLCanvasElement>('characterCanvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Convert to world coordinates
    const worldX = canvasX - canvas.width / 2;
    const worldY = canvasY - canvas.height / 2;

    this.dragCurrentPos = new Vector2(worldX, worldY);
    this.scheduleRender(); // Trigger preview rendering
    
    event.preventDefault();
  }

  private handleCanvasMouseUp(event: MouseEvent): void {
    if (!this.isDraggingNewBone || !this.dragStartPos || !this.dragCurrentPos) {
      this.isDraggingNewBone = false;
      this.dragStartPos = null;
      this.dragCurrentPos = null;
      return;
    }

    // Calculate bone properties from drag vector
    const dragVector = new Vector2(
      this.dragCurrentPos.x - this.dragStartPos.x,
      this.dragCurrentPos.y - this.dragStartPos.y
    );

    const length = Math.hypot(dragVector.x, dragVector.y);
    
    // Only create bone if drag distance is significant (min 10 pixels)
    if (length < 10) {
      this.isDraggingNewBone = false;
      this.dragStartPos = null;
      this.dragCurrentPos = null;
      this.scheduleRender();
      return;
    }

    const rotation = Math.atan2(dragVector.y, dragVector.x) * (180 / Math.PI);

    // Generate unique name for the new bone
    const boneName = `bone${++this.previewBoneId}`;

    // Create the bone using existing addBone logic but with calculated properties
    this.addBoneWithProperties(boneName, {
      length: Math.round(length),
      rotation: Math.round(rotation),
      position: this.dragStartPos
    });

    // Reset drag state
    this.isDraggingNewBone = false;
    this.dragStartPos = null;
    this.dragCurrentPos = null;
    
    event.preventDefault();
  }

  private addBoneWithProperties(name: string, properties: {
    length: number;
    rotation: number;
    position: Vector2;
  }): void {
    const currentState = this.getCurrentState();
    const newBone: EditorBone = {
      id: Symbol(name),
      name,
      length: properties.length,
      rotation: properties.rotation,
      position: properties.position,
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
    this.showMsg(`Bone "${name}" created via drag`);
  }
}
