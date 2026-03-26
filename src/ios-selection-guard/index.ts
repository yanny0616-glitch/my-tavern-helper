import { setupCrashGuard } from './guards/crash-guard';
import { setupDiagnosticsPanel } from './diagnostics/diagnostics-panel';
import { isIOS } from './core/env';
import { setupSelectionGuard } from './guards/selection-guard';
import { Disposable, FeatureSettings } from './core/types';
import { applyHeavyMode } from './core/heavy-mode';
import { loadSettings, saveSettings } from './core/settings';

function bindPageHide(disposables: Disposable[]): void {
  $(window).on('pagehide', () => {
    for (const item of disposables) {
      item.dispose();
    }
  });
}

$(() => {
  const doc = window.parent?.document;
  if (!doc) {
    return;
  }

  const onIOS = isIOS();
  let settings: FeatureSettings = loadSettings();
  let crashGuard: Disposable | null = null;
  let selectionGuard: Disposable | null = null;
  let autoBackgroundLightMode = false;

  const applySettings = () => {
    if (!settings.enableAutoLightModeOnBackground) {
      autoBackgroundLightMode = false;
    }
    if (settings.enableAutoLightModeOnBackground && doc.visibilityState === 'hidden') {
      autoBackgroundLightMode = true;
    }
    applyHeavyMode(doc, settings.enableHeavyMode || autoBackgroundLightMode);
    if (!onIOS) {
      return;
    }
    if (settings.enableCrashGuard) {
      if (!crashGuard) {
        crashGuard = setupCrashGuard(doc, {
          getEnableMemorySnapshot: () => settings.enableMemorySnapshot,
        });
      }
    } else if (crashGuard) {
      crashGuard.dispose();
      crashGuard = null;
    }

    if (settings.enableSelectionGuard) {
      if (!selectionGuard) {
        selectionGuard = setupSelectionGuard(doc);
      }
    } else if (selectionGuard) {
      selectionGuard.dispose();
      selectionGuard = null;
    }
  };

  const diagnostics = setupDiagnosticsPanel(doc, {
    getSettings: () => settings,
    onChangeSettings: next => {
      settings = { ...next };
      saveSettings(settings);
      applySettings();
    },
  });

  applySettings();

  const onVisibilityChange = () => {
    if (!onIOS || !settings.enableAutoLightModeOnBackground) {
      autoBackgroundLightMode = false;
      applySettings();
      return;
    }
    autoBackgroundLightMode = doc.visibilityState === 'hidden';
    applySettings();
  };
  doc.addEventListener('visibilitychange', onVisibilityChange, true);

  if (!onIOS) {
    bindPageHide([
      { dispose: () => doc.removeEventListener('visibilitychange', onVisibilityChange, true) },
      diagnostics,
      { dispose: () => applyHeavyMode(doc, false) },
    ]);
    return;
  }

  console.info('[ios-selection-guard] enabled');
  bindPageHide([
    { dispose: () => doc.removeEventListener('visibilitychange', onVisibilityChange, true) },
    { dispose: () => selectionGuard?.dispose() },
    { dispose: () => crashGuard?.dispose() },
    { dispose: () => applyHeavyMode(doc, false) },
    diagnostics,
  ]);
});
