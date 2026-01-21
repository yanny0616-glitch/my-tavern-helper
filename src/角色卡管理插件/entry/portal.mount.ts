import { createApp, watch } from 'vue';
import { createScriptIdDiv } from '../../../util/script';
import { cardHubState } from '../state/store';
import App from '../ui/App.vue';
import { cardHubStyles } from './portal.styles';

export type PortalMount = {
  app: ReturnType<typeof createApp>;
  mount: JQuery<HTMLDivElement>;
  style: JQuery<HTMLElement>;
};

export function createPortalMount(): PortalMount {
  const style = $(`<style>`).attr('data-cardhub-style', getScriptId()).text(cardHubStyles).appendTo('head');
  const mount = createScriptIdDiv().addClass('cardhub-mount').appendTo('body');
  const app = createApp(App);

  app.mount(mount[0]);

  watch(
    () => cardHubState.open,
    () => {},
    { immediate: true },
  );

  return { app, mount, style };
}

export function destroyPortalMount(portal: PortalMount) {
  portal.app.unmount();
  portal.mount.remove();
  portal.style.remove();
}
