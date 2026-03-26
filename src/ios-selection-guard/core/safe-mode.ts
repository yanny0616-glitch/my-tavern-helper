export function applySafeMode(doc: Document): void {
  if (doc.getElementById('th-ios-safe-mode-style')) {
    return;
  }
  doc.documentElement.setAttribute('data-th-ios-safe-mode', '1');
  const style = doc.createElement('style');
  style.id = 'th-ios-safe-mode-style';
  style.textContent = `
    html[data-th-ios-safe-mode="1"] * {
      animation: none !important;
      transition: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
  `;
  doc.head?.appendChild(style);
}
