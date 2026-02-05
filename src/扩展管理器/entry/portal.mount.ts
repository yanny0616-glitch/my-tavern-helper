import { createApp } from 'vue';
import { createScriptIdDiv } from '../../../util/script';
import App from '../ui/App.vue';
import { portalStyles } from './portal.styles';

export type PortalMount = {
  app: ReturnType<typeof createApp>;
  mount: JQuery<HTMLDivElement>;
  style: JQuery<HTMLElement>;
};

export function createPortalMount(): PortalMount {
  const style = $(`<style>`).attr('data-em-style', getScriptId()).text(portalStyles).appendTo('head');
  const mount = createScriptIdDiv().addClass('em-mount').appendTo('body');
  const app = createApp(App);

  app.mount(mount[0]);

  return { app, mount, style };
}

export function destroyPortalMount(portal: PortalMount) {
  portal.app.unmount();
  portal.mount.remove();
  portal.style.remove();
}
