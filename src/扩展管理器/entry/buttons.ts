import type { ExtensionManagerController } from './portal.controller';

type Cleanup = () => void;

function buildButton(doc: Document): HTMLDivElement {
  const btn = doc.createElement('div');
  btn.setAttribute('data-em-launcher', '1');
  btn.className = 'menu_button menu_button_icon interactable icon-only';
  btn.title = '扩展管理';
  btn.innerHTML = '<i class="fa-solid fa-puzzle-piece"></i>';
  return btn;
}

function ensureButton(doc: Document): HTMLDivElement | null {
  const existing = doc.querySelector('[data-em-launcher="1"]') as HTMLDivElement | null;
  if (existing) {
    const detailsBtn = doc.querySelector('#extensions_details') as HTMLDivElement | null;
    if (detailsBtn && existing.previousElementSibling !== detailsBtn) {
      detailsBtn.insertAdjacentElement('afterend', existing);
    }
    return existing;
  }

  const settings = doc.querySelector('#extensions_settings');
  if (!settings) {
    return null;
  }

  const detailsBtn = doc.querySelector('#extensions_details') as HTMLDivElement | null;
  const targetRow = detailsBtn?.closest('.alignitemscenter.flex-container.wide100p');
  const btn = buildButton(doc);

  if (detailsBtn) {
    detailsBtn.insertAdjacentElement('afterend', btn);
    return btn;
  }

  if (targetRow) {
    targetRow.appendChild(btn);
    return btn;
  }

  const fallbackBar = doc.createElement('div');
  fallbackBar.setAttribute('data-em-launcher-bar', '1');
  fallbackBar.setAttribute(
    'style',
    [
      'display:flex',
      'justify-content:flex-end',
      'gap:8px',
      'padding:6px 0 10px',
      'border-bottom:1px solid rgba(0,0,0,0.08)',
      'margin-bottom:10px',
    ].join(';'),
  );
  fallbackBar.appendChild(btn);
  settings.prepend(fallbackBar);
  return btn;
}

export function registerEntryButtons(controller: ExtensionManagerController): Cleanup {
  const doc = window.parent?.document ?? document;
  let btn: HTMLDivElement | null = null;

  const attach = () => {
    btn = ensureButton(doc);
    if (btn) {
      btn.addEventListener('click', () => controller.open());
      return true;
    }
    return false;
  };

  if (!attach()) {
    const observer = new MutationObserver(() => attach());
    observer.observe(doc.documentElement, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      btn?.remove();
    };
  }

  return () => {
    btn?.remove();
  };
}
