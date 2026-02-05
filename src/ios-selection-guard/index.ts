function isIOS(): boolean {
  const ua = navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
  const isModernIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isAppleMobile || isModernIPad;
}

function isEditable(el: Element | null): boolean {
  if (!el) {
    return false;
  }
  const tag = el.tagName.toLowerCase();
  if (el instanceof HTMLElement && el.isContentEditable) {
    return true;
  }
  return tag === 'textarea' || tag === 'input';
}

function getInputSelectionRange(el: Element | null): { start: number; end: number } | null {
  if (!el) {
    return null;
  }
  if (el instanceof HTMLTextAreaElement) {
    return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  }
  if (el instanceof HTMLInputElement) {
    return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  }
  return null;
}

function hasActiveInputSelection(doc: Document): boolean {
  const active = doc.activeElement;
  const range = getInputSelectionRange(active);
  if (!range) {
    return false;
  }
  return range.start !== range.end;
}

function clearInputSelection(doc: Document): void {
  const active = doc.activeElement;
  if (!active) {
    return;
  }
  const range = getInputSelectionRange(active);
  if (!range) {
    return;
  }
  if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
    const caret = range.end;
    active.setSelectionRange(caret, caret);
  }
}

function closestEditable(el: Element | null): Element | null {
  let current = el;
  while (current) {
    if (isEditable(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function hasActiveSelection(doc: Document): boolean {
  const selection = doc.getSelection();
  return !!selection && !selection.isCollapsed;
}

function clearSelection(doc: Document): void {
  const selection = doc.getSelection();
  if (selection && !selection.isCollapsed) {
    selection.removeAllRanges();
  }
}

function blurEditable(doc: Document): void {
  const active = doc.activeElement;
  if (active instanceof HTMLElement && isEditable(active)) {
    active.blur();
  }
}

$(() => {
  if (!isIOS()) {
    return;
  }

  const doc = window.parent?.document;
  if (!doc) {
    return;
  }

  const onPointerDown = (event: Event) => {
    if (!hasActiveSelection(doc) && !hasActiveInputSelection(doc)) {
      return;
    }

    const target = event.target as Element | null;
    if (closestEditable(target)) {
      return;
    }

    // Exit selection mode so the next tap can trigger real clicks.
    clearSelection(doc);
    clearInputSelection(doc);
    blurEditable(doc);
  };

  doc.addEventListener('touchstart', onPointerDown, true);
  doc.addEventListener('mousedown', onPointerDown, true);

  const onCopyLike = () => {
    // iOS sometimes stays in selection mode after copy; exit it ASAP.
    setTimeout(() => {
      clearSelection(doc);
      clearInputSelection(doc);
      blurEditable(doc);
    }, 0);
  };

  doc.addEventListener('copy', onCopyLike, true);
  doc.addEventListener('cut', onCopyLike, true);

  console.info('[ios-selection-guard] enabled');

  $(window).on('pagehide', () => {
    doc.removeEventListener('touchstart', onPointerDown, true);
    doc.removeEventListener('mousedown', onPointerDown, true);
    doc.removeEventListener('copy', onCopyLike, true);
    doc.removeEventListener('cut', onCopyLike, true);
  });
});
