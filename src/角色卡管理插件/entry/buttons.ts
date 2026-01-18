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
  if ($(`#${buttonId}`).length) {
    return null;
  }

  const $anchor = findRoleManagerAnchor();
  if (!$anchor) {
    console.warn('[CardHub] 未找到角色管理入口挂载点');
    return null;
  }

  const $button = $('<button>')
    .attr('id', buttonId)
    .attr('type', 'button')
    .addClass('menu_button cardhub-entry-button')
    .attr('title', '打开 CardHub 角色卡管理器')
    .text('CardHub')
    .on('click pointerup touchend', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      controller.open('role');
    });

  $anchor.append($button);
  const roleDisposer = bindOpenEvents($button[0], () => controller.open('role'));

  return () => {
    $button.off('click');
    $button.remove();
    roleDisposer();
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
    if (!$menu || $menu.find(`#${menuId}`).length) {
      return;
    }

    const $entry = $('<div>')
      .attr('id', menuId)
      .addClass('list-group-item flex-container flexGap5 interactable cardhub-menu-entry')
      .attr('role', 'button')
      .attr('tabindex', '0')
      .text('角色卡管理器')
      .on('click pointerup touchend', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        controller.open('magic');
      });

    $menu.append($entry);
    const entryDisposer = bindOpenEvents($entry[0], () => controller.open('magic'));
    $entry.data('cardhub-dispose', entryDisposer);
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
    $(`#${menuId}`).remove();
  };
}

function bindOpenEvents(target: HTMLElement, handler: () => void): () => void {
  const wrapped = (event: Event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    handler();
  };

  target.addEventListener('pointerdown', wrapped, { capture: true });
  target.addEventListener('mousedown', wrapped, { capture: true });
  target.addEventListener('touchstart', wrapped, { capture: true });

  return () => {
    target.removeEventListener('pointerdown', wrapped, { capture: true } as AddEventListenerOptions);
    target.removeEventListener('mousedown', wrapped, { capture: true } as AddEventListenerOptions);
    target.removeEventListener('touchstart', wrapped, { capture: true } as AddEventListenerOptions);
  };
}
