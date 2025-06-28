# 2D Universal Stickman Lab — Key Takeaways and Next Steps

This document summarizes the most relevant concepts from the research to inform our ongoing work in the 2D Universal Stickman Lab editor and animation system.

---

## 1. Modular Skeletal Architecture

- **Hierarchical Bone Tree**: Represent each bone as a node with references to parent and children. Transformations cascade down the tree for Forward Kinematics (FK).
**Current Status in Workspace:**
- Present: `SkeletonEditor` and `ImprovedSkeletonEditor` store bones in a `Map`, allow add/delete/select, and render a flat bone list.
- Missing: Explicit parent–child relationships and cascading FK transforms (bones have no parent field or recursive updateWorldTransform in code).

## 2. Mathematical Utilities & Optimizations

- **Vector/Matrix Primitives**: Implement custom `Vector2` and `Matrix3` classes for position, rotation, and scale—avoid external dependencies to satisfy “pure JS”.
**Current Status in Workspace:**
- Present: A simple `Vector2` class in `index.html` for position handling.
- Missing: `Matrix3` or equivalent transform utilities; no typed arrays or engine optimizations in math-intensive loops.

## 3. Forward & Inverse Kinematics

- **FK Update**: Recursively compute `bone.worldRotation = parent.worldRotation + bone.localRotation` and endpoint via `x += length * cos(θ)`, `y += length * sin(θ)`.
- **IK Solvers**:
  - **Analytical 2-Bone**: Law-of-Cosines solution for 2-segment limbs (constant time, ideal for arms/legs).
  - **FABRIK**: Forward/backward reaching iterative solver—faster convergence than CCD for longer chains.
  - **CCD**: Simple iterative solver for arbitrary chain lengths, but watch iteration count to avoid stalls.
- **Constraints Integration**: Enforce joint limits during solving rather than post-clamping to avoid snapping artifacts.
**Current Status in Workspace:**
- Present: Basic drawing of bones in `renderPreview` with length, rotation, position per bone.
- Missing: No dedicated FK chain update method; no IK solver implementations (CCD/FABRIK/analytical) or constraint-aware solving.

## 4. Robust Constraint System

- **Soft vs. Hard Limits**: Integrate constraints into the IK iteration (soft springs) to produce natural motion under angle limits.
- **Bend Direction**: Support preferred bending arcs (e.g., elbow should not fold backwards) and visualize them in the authoring UI.
- **Dynamic Reach Handling**: When a target is out-of-reach, gracefully stretch bones along the chain rather than abruptly clamping.
**Current Status in Workspace:**
- Present: Name validation and basic property clamping (min/max sliders) for bone properties.
- Missing: Joint constraint logic in animation or solving algorithms; no UI visualization for limits.

## 5. Animation State & Blending

- **State Machine**: Layer keyframe, procedural (IK, combat, locomotion), and physics-driven motions via a blend graph.
- **History Recording**: Already tracking undo/redo; extend to record time-series of bone metrics for post-analysis and graphing.
- **Curve Export**: Provide JSON export of recorded metrics (`length`, `rotation`, `x`, `y` over time) for external tooling.
**Current Status in Workspace:**
- Present: Undo/redo history via `History` class; graph data recording and export implemented.
- Missing: Blend graph UI or state machine; keyframe/ procedural animation layering framework.

## 6. Performance & Rendering

- **Canvas vs. WebGL**: Current 2D canvas is sufficient; consider batched draw calls and layering for complex scenes.
- **Grid & Unit Scaling**: Grid snapping at configurable size; label units in UI pane for consistent measurement.
- **Profiling**: Use DevTools Performance benchmarks to identify bottlenecks—focus on FK, IK, and render loops.
**Current Status in Workspace:**
- Present: Canvas rendering with zoom/pan, grid toggle, throttled inputs, `requestAnimationFrame`.
- Missing: WebGL fallback or high-performance batching; built-in profiling/logging hooks for render and math loops.

## 7. Graph Pane Integration

- **Real-Time Charts**: Use Chart.js in a `<graph-pane>` Web Component to plot averaged bone metrics live.
- **Controls**: Add playback scrubber or time slider to replay recorded graph history.
- **Export & Analysis**: Wire up JSON export and provide hooks (events) for future algorithmic analysis within the editor.
**Current Status in Workspace:**
- Present: `<graph-pane>` component renders live charts and exports graph data.
- Missing: Time-scrubber control, axis unit labels, and history playback UI in the component.

---

## 8. UI/UX Enhancements to Implement

Based on our current workspace gaps, we should expand the following user-facing features:

- **Interactive Graph Controls**:
  - Add time-scrubber and playback buttons in `<graph-pane>` to scroll through recorded metrics.
  - Display axis labels (units, time, value) and allow zoom/pan of the chart.
  - Provide tooltips on hover for data points (e.g. bone length at time t).

- **Blend Graph UI**:
  - Visual editor for blending keyframe and procedural layers (node-based interface).
  - Easy toggles to enable/disable IK, FK, and procedural tracks, with real-time preview.

- **Constraint Visualization**:
  - Overlay joint limits on the canvas (arcs or shaded regions) when a bone is selected.
  - Interactive handles to adjust min/max angles directly on the skeleton.

- **Bone Hierarchy Panel**:
  - Tree view of bones with drag-and-drop reparenting.
  - Inline editing of bone names, colors, and visibility.

- **Contextual Grid & Units**:
  - Show coordinate axes and unit labels on the canvas overlay (e.g. cm, px).
  - Toggle grid snapping size and display current grid spacing in the UI.

- **Enhanced Tooltips & Help**:
  - Dynamic tooltips for all controls (sliders, buttons), updated on locale changes.
  - A context-sensitive help pane that explains shortcuts and features inline.

*Prioritize the graph controls first, then progressively layer in blend graph, constraints, and hierarchy panels.*

---

## 9. Required Modular Systems and Architecture

To support current and future UI/UX features, our codebase must expose clearly separated systems:

- **Math Core Module**
  - Responsibilities: `Vector2`, `Matrix3`, numeric utilities, typed-array wrappers.
  - Modularity: Export as a standalone library used by FK/IK, rendering, and graph updates.

- **Skeleton & FK Engine**
  - Responsibilities: Bone data structures (with parent/child), `updateWorldTransform` recursion, grid snapping.
  - Modularity: Provide a `Skeleton` class API for UI panes and solvers to query/modify bone hierarchy.

- **IK & Constraints Engine**
  - Responsibilities: Analytical, FABRIK, CCD solvers; joint limit enforcement; bend bias.
  - Modularity: Expose solver interfaces (`solveChain`, `applyConstraints`) so the blend graph and tool panels can plug in.

- **Animation State & Blend Graph**
  - Responsibilities: Manage layers of keyframe, procedural, and physics tracks; output target `Skeleton` poses.
  - Modularity: Node-based graph data model, with runtime API to connect solver outputs and feed into render loop.

- **Render Module**
  - Responsibilities: Canvas draw calls, grid, axes, skeleton overlay, constraint visualization.
  - Modularity: Accept a `Skeleton` instance and UI flags (showGrid, showLimits, zoom/pan) as inputs.

- **Graph Data & Visualization Module**
  - Responsibilities: Time-series data capture, Chart.js integration, scrubber controls, export events.
  - Modularity: Web Component `<graph-pane>` that subscribes to data events and updates chart.

- **UI Framework Layer**
  - Responsibilities: Tool palette, property panels, hierarchy tree, blend graph editor.
  - Modularity: Each pane as a self-contained Web Component or module, communicating via events and shared context.

*By delineating these modules and defining clear APIs between them, we can independently develop and test each system while ensuring they integrate seamlessly to power our evolving UI/UX.*

---

## Next Steps

1. Expand math utilities with optimized `Vector2` and `Matrix3` operations.
2. Integrate soft constraint handling directly into FABRIK and CCD solvers.
3. Build blend graph UI to layer keyframe and procedural animations.
4. Refine graph-pane controls (scrubber, axis labels, unit scaling).
5. Benchmark FK/IK loops and optimize hot paths (typed arrays or WASM).
6. Plug Math Core into Skeleton & IK
   - Move `Vector2` into `math/vector.ts` with full operations
   - Create `Matrix3` in `math/matrix.ts` for 2D transforms
   - Refactor Skeleton, IK, and render modules to import from math core
   - Apply via constructor injection or direct import to minimize surface changes

---
🔍 Validation Prompt: “Profile FK update loop with DevTools—do transform ops use math module and avoid allocations?”

### 🔹 Prompt: Connect FABRIK Solver with Skeleton and UI Constraints

**Assumptions:**
- FABRIK solver implemented in `ik/solvers/fabrik.ts`
- Bone angle limits defined via UI (min/max sliders)
- Skeleton supports parent–child hierarchy

**Goal:** Integrate FABRIK solver with real-time Skeleton data, applying soft constraints from bone properties

**Structure:**
- Implement `solveFABRIK(boneChain: Bone[], target: Vector2)` in `ik/solvers/fabrik.ts`
- Enforce `minAngle`/`maxAngle` and bend preference during each iteration step
- Wire UI slider events (`property-panel.ts`) to update `Bone.minAngle`/`maxAngle`
- Trigger solver on IK target drag and update `Skeleton` transforms

**Example:**
```ts
let angle = computeAngle(prevDir, nextDir);
if (angle < bone.minAngle) {
  angle = bone.minAngle + softness * (angle - bone.minAngle);
}
```

**Checklist:**
- Solver walks bone hierarchy correctly
- Constraints enforced per iteration (not post-correction)
- Smooth easing near limits (no snapping)

🔍 Validation Prompt: “Drag IK target near joint limit—does joint ease into constraint, not snap?”

### 🔹 Prompt: Connect Graph Metrics to Animation and Solver Outputs

**Assumptions:**
- `<graph-pane>` component is present
- Metrics tracked but not yet bound to FK/IK output

**Goal:** Stream Skeleton and solver metrics into live graph

**Structure:**
- Emit `metricUpdate` events from `Skeleton.updateWorldTransform()` and IK solvers
- Listen in `graph-pane.ts`, update Chart.js datasets on each frame
- Expose export button to dump JSON of all series

**Example:**
```ts
this.dispatchEvent(new CustomEvent('metricUpdate', {
  detail: { boneId, time, rotation: bone.worldRotation, length: bone.length }
}));
```

**Checklist:**
- Live graph updates for multiple bones
- Export JSON includes all time-series data
- Minimal performance impact from event streaming

🔍 Validation Prompt: “Observe live chart while animating—does graph reflect solver output without lag?”

---

### 🔹 Prompt: Wire Blend Graph Outputs into Skeleton Preview

**Assumptions:**

- Blend graph UI exists (or is planned)
- Skeleton can accept poses from procedural or keyframe sources

**Goal:** Connect the blend graph output node to drive the skeleton pose in the preview canvas

**Structure:**

- Define a `BlendNode` interface with `getPose(): Pose`
- On each render frame, evaluate the blend graph to produce a `Pose` (rotation and position per bone)
- Call `Skeleton.setPose(pose)` to apply the blended result
- Add a UI toggle to enable/disable blend graph preview

**Example:**

```ts
const pose = blendGraph.evaluate(currentTime);
skeleton.setPose(pose);
```

**Checklist:**

- Blend graph correctly interpolates between FK and IK layers
- Preview updates in response to scrubber or slider changes
- `Skeleton.setPose` applies poses without unwanted side effects

🔍 Validation Prompt: “Toggle IK and keyframe layers—does the pose update smoothly without jitter or conflict?”
