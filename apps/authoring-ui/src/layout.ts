/**
 * Layout persistence using localStorage + IndexedDB.
 * @lab-docgen
 */
export function saveLayout(layout: any) {
  localStorage.setItem('lab-layout', JSON.stringify(layout));
  // Optionally mirror to IndexedDB for larger state
}

export function loadLayout(): any {
  const raw = localStorage.getItem('lab-layout');
  return raw ? JSON.parse(raw) : null;
}
