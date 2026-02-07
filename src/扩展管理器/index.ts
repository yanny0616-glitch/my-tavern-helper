import { registerEntryButtons } from './entry/buttons';
import { createExtensionManagerController } from './entry/portal';

function init() {
  const controller = createExtensionManagerController();
  const cleanupEntries = registerEntryButtons(controller);

  $(window).on('pagehide', () => {
    cleanupEntries();
    controller.destroy();
  });
}

$(() => {
  errorCatched(init)();
});
