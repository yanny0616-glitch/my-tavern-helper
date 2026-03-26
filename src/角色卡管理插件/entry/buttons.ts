import type { EntrySource } from '../types';

type CardHubController = {
  open: (source?: EntrySource) => void;
};

export function registerEntryButtons(controller: CardHubController): () => void {
  const disposers: Array<() => void> = [];
  const roleDisposer = registerRoleManagerEntry(controller);
  if (roleDisposer) {
    disposers.push(roleDisposer);
  }
  const magicDisposer = registerMagicMenuEntry(controller);
  if (magicDisposer) {
    disposers.push(magicDisposer);
  }
  return () => {
    disposers.forEach(dispose => dispose());
  };
}

function registerRoleManagerEntry(controller: CardHubController): (() => void) | null {
  const buttonId = `cardhub-entry-${getScriptId()}`;
  const openOnce = createOpenOnce(() => controller.open('role'));
  const $existing = $(`#${buttonId}`);
  if ($existing.length) {
    $existing
      .addClass('menu_button fa-solid fa-rectangle-list cardhub-entry-button')
      .attr('title', '打开 CardHub 角色卡管理器')
      .attr('aria-label', '打开 CardHub 角色卡管理器')
      .empty();
    const roleDisposer = bindEntryOpen($existing as JQuery<HTMLElement>, openOnce);
    return () => {
      roleDisposer();
    };
  }

  const $anchor = findRoleManagerAnchor();
  if (!$anchor) {
    console.warn('[CardHub] 未找到角色管理入口挂载点');
    return null;
  }

  const $button = $('<button>')
    .attr('id', buttonId)
    .attr('type', 'button')
    .addClass('menu_button fa-solid fa-rectangle-list cardhub-entry-button')
    .attr('title', '打开 CardHub 角色卡管理器')
    .attr('aria-label', '打开 CardHub 角色卡管理器');

  $anchor.append($button);
  const roleDisposer = bindEntryOpen($button, openOnce);

  return () => {
    roleDisposer();
    $button.remove();
  };
}

function findRoleManagerAnchor(): JQuery<HTMLElement> | null {
  const selectors = [
    '#rm_button_bar',
    '#character_panel',
    '#rightNavBar',
    '#right-nav-panel',
    '#character-search',
    '#top-settings-holder',
  ];

  for (const selector of selectors) {
    const $target = $(selector).first();
    if ($target.length) {
      return $target;
    }
  }

  const $button = $('button, .menu_button, .nav_button')
    .filter((_, el) => {
      const text = $(el).text();
      const title = el.getAttribute('title') ?? el.getAttribute('aria-label') ?? '';
      return /角色管理/.test(text) || /角色管理/.test(title);
    })
    .first();

  if ($button.length) {
    const $container = $button.closest('nav, header, section, div');
    return $container.length ? $container : $button.parent();
  }

  return null;
}

function registerMagicMenuEntry(controller: CardHubController): (() => void) | null {
  const menuId = `cardhub-magic-${getScriptId()}`;
  const $magicButton = $('#extensionsMenuButton');
  if (!$magicButton.length) {
    console.warn('[CardHub] 未找到左侧魔法棒入口');
    return null;
  }

  const onMenuOpen = () => {
    const $menu = $('#extensionsMenu');
    if (!$menu.length) {
      return;
    }

    const openOnce = createOpenOnce(() => controller.open('magic'));
    const $existingEntry = $menu.find(`#${menuId}`).first();
    if ($existingEntry.length) {
      bindEntryOpen($existingEntry as JQuery<HTMLElement>, openOnce);
      return;
    }

    const $entry = $('<div>')
      .attr('id', menuId)
      .addClass('list-group-item flex-container flexGap5 interactable cardhub-menu-entry')
      .attr('role', 'button')
      .attr('tabindex', '0')
      .html('<i class="fa-solid fa-id-badge" aria-hidden="true"></i><span>角色卡管理器</span>');

    $menu.append($entry);
    bindEntryOpen($entry, openOnce);
  };

  $magicButton.on('click.cardhub', () => {
    setTimeout(onMenuOpen, 0);
  });

  const observer = new MutationObserver(() => onMenuOpen());
  const rootDocument = window.parent?.document ?? document;
  observer.observe(rootDocument.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    $magicButton.off('click.cardhub');
    const $entry = $(`#${menuId}`);
    runDispose($entry);
    $entry.remove();
  };
}

function bindEntryOpen($target: JQuery<HTMLElement>, handler: () => void): () => void {
  runDispose($target);

  const wrapped = (event: JQuery.Event) => {
    if (event.type === 'keydown') {
      const keyboardEvent = event as JQuery.KeyDownEvent;
      if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
        return;
      }
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    handler();
  };

  $target
    .off('.cardhub-open')
    .on('click.cardhub-open', wrapped)
    .on('pointerup.cardhub-open', wrapped)
    .on('touchend.cardhub-open', wrapped)
    .on('keydown.cardhub-open', wrapped);

  const dispose = () => {
    $target.off('.cardhub-open');
    $target.removeData('cardhub-dispose');
  };
  $target.data('cardhub-dispose', dispose);
  return dispose;
}

function runDispose($target: JQuery<HTMLElement>) {
  const dispose = $target.data('cardhub-dispose');
  if (typeof dispose === 'function') {
    (dispose as () => void)();
  }
}

function createOpenOnce(handler: () => void): () => void {
  let lastFiredAt = 0;
  return () => {
    const now = Date.now();
    if (now - lastFiredAt < 250) {
      return;
    }
    lastFiredAt = now;
    handler();
  };
}
