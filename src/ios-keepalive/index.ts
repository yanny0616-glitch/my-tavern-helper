import { reloadOnChatChange } from '@util/script';
import { createKeepAliveController } from './core/audio-controller';
import { SCRIPT_BUTTON_NAME } from './core/constants';
import { isIOS } from './core/env';
import { loadSettings, saveSettings } from './core/settings';
import { setupKeepAlivePanel } from './ui/panel';
import { KeepAliveSettings, KeepAliveViewState, PanelController } from './types';

function updateButtons() {
  replaceScriptButtons([{ name: SCRIPT_BUTTON_NAME, visible: true }]);
}

function formatTimestamp(value: number | null): string {
  if (!value) {
    return '无';
  }
  return new Date(value).toLocaleString();
}

function buildViewState(
  iosDevice: boolean,
  settings: KeepAliveSettings,
  snapshot: ReturnType<ReturnType<typeof createKeepAliveController>['getSnapshot']>,
): KeepAliveViewState {
  return {
    enabled: settings.enabled,
    autoResume: settings.autoResume,
    isIOS: iosDevice,
    audioAttached: snapshot.audioAttached,
    playing: snapshot.playing,
    statusText: snapshot.statusText,
    errorText: snapshot.errorText,
    visibilityLabel: snapshot.visibilityState === 'hidden' ? '后台 / 不可见' : '前台 / 可见',
    attempts: snapshot.attempts,
    lastStartedAtLabel: formatTimestamp(snapshot.lastStartedAt),
    lastErrorAtLabel: formatTimestamp(snapshot.lastErrorAt),
    hintText: iosDevice
      ? 'iOS 对后台网页有系统级限制。这个脚本通过循环播放无声音频来尽量维持活跃状态，但锁屏、系统回收或 Safari 策略变化时仍可能中断。'
      : '当前不是 iOS 设备。你仍然可以用这个脚本验证空白音频能否正常创建、播放和自动恢复。',
  };
}

function init() {
  const doc = window.parent?.document;
  if (!doc) {
    throw new Error('无法访问父页面 document');
  }

  const iosDevice = isIOS();
  let settings = loadSettings();
  let panel: PanelController | null = null;

  const persistSettings = () => {
    saveSettings(settings);
  };

  const controller = createKeepAliveController({
    doc,
    onChange: () => {
      panel?.refresh();
    },
  });

  const getViewState = () => buildViewState(iosDevice, settings, controller.getSnapshot());

  const updateSetting = (patch: Partial<KeepAliveSettings>) => {
    settings = { ...settings, ...patch };
    persistSettings();
    panel?.refresh();
  };

  panel = setupKeepAlivePanel({
    doc,
    initialOpen: settings.panelOpen,
    getState: getViewState,
    onOpenChange: open => {
      updateSetting({ panelOpen: open });
    },
    onToggleEnabled: next => {
      updateSetting({ enabled: next });
      if (next) {
        void controller.start('用户手动开启保活');
      } else {
        controller.stop();
      }
    },
    onToggleAutoResume: next => {
      updateSetting({ autoResume: next });
      controller.applySettings(settings, next ? '已开启自动恢复，重新检查播放' : '已关闭自动恢复');
    },
    onStart: () => {
      updateSetting({ enabled: true });
      void controller.start('用户点击开始保活');
    },
    onStop: () => {
      updateSetting({ enabled: false });
      controller.stop();
    },
    onTest: () => {
      void controller.test();
    },
  });

  updateButtons();
  eventOn(getButtonEvent(SCRIPT_BUTTON_NAME), () => {
    panel?.open();
  });

  controller.applySettings(settings, '根据保存的设置恢复空白音频');

  const stopReload = reloadOnChatChange();
  $(window).on('pagehide', () => {
    stopReload.stop();
    panel?.dispose();
    controller.dispose();
  });

  console.info('[ios-keepalive] loaded');
}

$(() => {
  errorCatched(init)();
});
