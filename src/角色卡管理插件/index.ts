import { registerEntryButtons } from './entry/buttons';
import { createCardHubController } from './entry/portal';

function init() {
  const controller = createCardHubController();
  const cleanupEntries = registerEntryButtons(controller);

  controller.refresh();

  $(window).on('pagehide', () => {
    cleanupEntries();
    controller.destroy();
  });
}

$(() => {
  errorCatched(init)();
});
