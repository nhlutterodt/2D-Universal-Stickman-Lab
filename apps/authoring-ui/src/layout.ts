/**
 * Layout persistence using localStorage + IndexedDB.
 * @lab-docgen
 */

const LAYOUT_KEY = 'lab-layout';
const DEBUG_PREFIX = '[Layout]';

interface LayoutError extends Error {
  code: 'STORAGE_QUOTA_EXCEEDED' | 'INVALID_JSON' | 'STORAGE_UNAVAILABLE';
  originalError?: Error;
}

function createLayoutError(code: LayoutError['code'], message: string, originalError?: Error): LayoutError {
  const error = new Error(message) as LayoutError;
  error.code = code;
  error.originalError = originalError;
  return error;
}

export function saveLayout(layout: any): boolean {
  if (!layout) {
    console.warn(`${DEBUG_PREFIX} Attempted to save null/undefined layout`);
    return false;
  }

  try {
    const serialized = JSON.stringify(layout);
    
    // Check if localStorage is available
    if (typeof Storage === 'undefined' || !window.localStorage) {
      throw createLayoutError('STORAGE_UNAVAILABLE', 'localStorage is not available');
    }

    localStorage.setItem(LAYOUT_KEY, serialized);
    console.debug(`${DEBUG_PREFIX} Layout saved successfully (${serialized.length} chars)`);
    return true;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        const layoutError = createLayoutError('STORAGE_QUOTA_EXCEEDED', 'Storage quota exceeded when saving layout', error);
        console.error(`${DEBUG_PREFIX} ${layoutError.message}`, layoutError);
      } else if (error.message.includes('JSON')) {
        const layoutError = createLayoutError('INVALID_JSON', 'Failed to serialize layout to JSON', error);
        console.error(`${DEBUG_PREFIX} ${layoutError.message}`, layoutError);
      } else {
        console.error(`${DEBUG_PREFIX} Unexpected error saving layout:`, error);
      }
    }
    return false;
  }
}

export function loadLayout(): any {
  try {
    // Check if localStorage is available
    if (typeof Storage === 'undefined' || !window.localStorage) {
      throw createLayoutError('STORAGE_UNAVAILABLE', 'localStorage is not available');
    }

    const raw = localStorage.getItem(LAYOUT_KEY);
    
    if (!raw) {
      console.debug(`${DEBUG_PREFIX} No saved layout found`);
      return null;
    }

    const parsed = JSON.parse(raw);
    console.debug(`${DEBUG_PREFIX} Layout loaded successfully`);
    return parsed;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'SyntaxError') {
        const layoutError = createLayoutError('INVALID_JSON', 'Corrupted layout data in storage', error);
        console.error(`${DEBUG_PREFIX} ${layoutError.message}`, layoutError);
        
        // Clear corrupted data
        try {
          localStorage.removeItem(LAYOUT_KEY);
          console.debug(`${DEBUG_PREFIX} Cleared corrupted layout data`);
        } catch (clearError) {
          console.error(`${DEBUG_PREFIX} Failed to clear corrupted data:`, clearError);
        }
      } else {
        console.error(`${DEBUG_PREFIX} Unexpected error loading layout:`, error);
      }
    }
    return null;
  }
}

export function clearLayout(): boolean {
  try {
    if (typeof Storage === 'undefined' || !window.localStorage) {
      console.warn(`${DEBUG_PREFIX} localStorage not available for clearing`);
      return false;
    }

    localStorage.removeItem(LAYOUT_KEY);
    console.debug(`${DEBUG_PREFIX} Layout cleared successfully`);
    return true;

  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error clearing layout:`, error);
    return false;
  }
}
