const HEAVY_MODE_STYLE_ID = 'th-ios-heavy-mode-style';

export function applyHeavyMode(doc: Document, enabled: boolean): void {
  if (!enabled) {
    doc.documentElement.removeAttribute('data-th-ios-heavy-mode');
    doc.getElementById(HEAVY_MODE_STYLE_ID)?.remove();
    return;
  }
  if (doc.getElementById(HEAVY_MODE_STYLE_ID)) {
    doc.documentElement.setAttribute('data-th-ios-heavy-mode', '1');
    return;
  }
  doc.documentElement.setAttribute('data-th-ios-heavy-mode', '1');
  const style = doc.createElement('style');
  style.id = HEAVY_MODE_STYLE_ID;
  style.textContent = `
    html[data-th-ios-heavy-mode="1"] * {
      animation: none !important;
      transition: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    html[data-th-ios-heavy-mode="1"] video,
    html[data-th-ios-heavy-mode="1"] canvas {
      visibility: hidden !important;
    }
  `;
  doc.head?.appendChild(style);
}
