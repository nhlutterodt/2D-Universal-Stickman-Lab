import './lab-pane.js';
import './viewport-pane.js';
import './inspector-pane.js';
import './timeline-pane.js';
import './curve-editor-pane.js';
import './command-palette.js';
import { loadLayout, saveLayout } from './layout.js';
import { loadCharacterStreamed } from './streaming-loader.js';
import './skeleton-editor';

// Only initialize other panels if we're not in the skeleton editor
if (!document.querySelector('.container')) {
  // Example: Compose panels in DOM
  const root = document.body;
  root.innerHTML = `
    <viewport-pane></viewport-pane>
    <inspector-pane></inspector-pane>
    <timeline-pane></timeline-pane>
    <curve-editor-pane></curve-editor-pane>
    <command-palette></command-palette>
  `;

  // TODO: Restore layout from storage (see layout.ts for implementation)
  const layout = loadLayout();
  if (layout) {
    // ...apply layout...
  }

  // Demo: Load a character bundle with streaming and LOD
  (async () => {
    // Replace with actual bundle URL and DOM element for IntersectionObserver
    const bundleUrl = '/assets/stickman.bundle.json';
    const domElement = document.querySelector('viewport-pane');
    const loaderOpts: any = {
      lodDistance: 800,
      deferHeavyChunks: true,
    };
    if (domElement) loaderOpts.domElement = domElement;
    const character = await loadCharacterStreamed(bundleUrl, loaderOpts);

    // Example: update LOD based on camera distance (stub)
    function updateLodDemo() {
      // Replace with real camera distance logic
      const cameraDist = Math.random() * 1200;
      character.updateLod(cameraDist);
      console.log('LOD:', character.lod, 'CameraDist:', cameraDist.toFixed(0));
      setTimeout(updateLodDemo, 2000);
    }
    updateLodDemo();
  })();
}
