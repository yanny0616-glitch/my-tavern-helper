import { initMacroManager } from './entry/portal';

$(() => {
  errorCatched(initMacroManager)();
});
