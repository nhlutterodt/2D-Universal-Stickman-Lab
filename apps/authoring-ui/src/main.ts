import './lab-pane.js';
import './viewport-pane.js';
import './inspector-pane.js';
import './timeline-pane.js';
import './curve-editor-pane.js';
import './command-palette.js';
import { loadLayout, saveLayout } from './layout.js';

// Validate that saveLayout is implemented correctly, and set up auto-save functionality.
// This modular approach ensures that layout persistence is maintained across different parts of the app.
if (typeof saveLayout !== 'function') {
  console.error('saveLayout is not implemented. Please check your implementation in layout.js.');
} else {
  // Attach an auto-save handler to save the layout before the window unloads.
  window.addEventListener('beforeunload', () => {
    try {
      // Gather current layout configuration (this logic should be defined as needed).
      const currentLayout: Record<string, any> = {}; // Replace with actual DOM queries or state retrieval.
      saveLayout(currentLayout);
      console.debug('Layout auto-saved successfully.');
    } catch (error) {
      console.error('Error auto-saving layout:', error);
    }
  });
}
import { loadCharacterStreamed } from './streaming-loader.js';
import './skeleton-editor';

// Helper function to apply layout configuration to elements in the DOM.
// This is a stub implementation that assumes the layout object maps selectors to style objects.
function applyLayout(layout: Record<string, any>): void {
  try {
    if (!layout) {
      console.warn('No layout configuration provided.');
      return;
    }
    Object.keys(layout).forEach((selector) => {
      const element = document.querySelector(selector);
      if (element && element instanceof HTMLElement) {
        Object.assign(element.style, layout[selector]);
      } else {
        console.warn(`Element for selector "${selector}" not found or is not an HTMLElement.`);
      }
    });
    console.debug('Layout applied:', layout);
  } catch (error) {
    console.error('Failed to apply layout:', error);
  }
}

// Only initialize the panels if we're not in the skeleton editor.
if (!document.querySelector('.container')) {
  // Compose panels in DOM.
  const root = document.body;
  root.innerHTML = `
    <viewport-pane></viewport-pane>
    <inspector-pane></inspector-pane>
    <timeline-pane></timeline-pane>
    <curve-editor-pane></curve-editor-pane>
    <command-palette></command-palette>
  `;
  console.debug('Panels created and injected into the DOM.');

  // Restore layout from storage (see layout.ts for implementation).
  try {
    const layout = loadLayout();
    if (layout) {
      applyLayout(layout);
    } else {
      console.info('No saved layout found, using default layout.');
    }
  } catch (error) {
    console.error('Failed to load layout:', error);
  }

  // Demo: Load a character bundle with streaming and LOD.
  (async () => {
    try {
      // Replace with actual bundle URL and DOM element reference for IntersectionObserver if needed.
      const bundleUrl = '/assets/stickman.bundle.json';
      const domElement = document.querySelector('viewport-pane');
      const loaderOpts: any = {
        lodDistance: 800,
        deferHeavyChunks: true,
      };
      if (domElement) {
        loaderOpts.domElement = domElement;
      }
      console.debug(`Starting character load from ${bundleUrl}`, loaderOpts);

      const character = await loadCharacterStreamed(bundleUrl, loaderOpts);
      if (!character) {
        throw new Error('Character failed to load.');
      }
      console.info('Character loaded successfully.');

      // Function to update LOD based on simulated camera distance.
      function updateLodDemo(): void {
        try {
          // Replace with real camera distance logic as necessary.
          const cameraDist = Math.random() * 1200;
          character.updateLod(cameraDist);
          console.debug('Updated LOD', { lod: character.lod, cameraDist: cameraDist.toFixed(0) });
        } catch (error) {
          console.error('Error updating character LOD:', error);
        }
        setTimeout(updateLodDemo, 2000);
      }
      updateLodDemo();
    } catch (error) {
      console.error('Error during character loading process:', error);
    }
  })();
}
