import { reloadOnChatChange } from '@util/script';
import { SCRIPT_BUTTON_NAME } from './core/constants';
import { isIOS, getDeviceName } from './core/env';
import { loadSettings, saveSettings } from './core/settings';
import { createKeepAliveController } from './core/audio-controller';
import { createNotificationController } from './core/notification';
import { setupPanel } from './ui/panel';
import { Settings, ViewState } from './types';

function init() {
  const doc = window.parent?.document;
  if (!doc) throw new Error('无法访问父页面 document');

  const iosDevice = isIOS();
  const deviceName = getDeviceName();
  let settings = loadSettings();

  let panel: ReturnType<typeof setupPanel> | null = null;

  const persist = () => saveSettings(settings);
  const updateSetting = (patch: Partial<Settings>) => {
    settings = { ...settings, ...patch };
    persist();
    panel?.refresh();
  };

  const keepAlive = createKeepAliveController({
    doc,
    onChange: () => panel?.refresh(),
  });

  const notification = createNotificationController({
    getFields: () => settings.notification.fields,
    getBarkEnabled: () => settings.notification.barkEnabled,
    getBarkUrl: () => settings.notification.barkUrl,
    onChange: () => panel?.refresh(),
  });

  const getViewState = (): ViewState => ({
    keepAlive: {
      ...keepAlive.getSnapshot(),
      enabled: settings.keepAlive.enabled,
      autoResume: settings.keepAlive.autoResume,
    },
    notification: {
      ...notification.getSnapshot(),
      enabled: settings.notification.enabled,
      barkEnabled: settings.notification.barkEnabled,
      barkUrl: settings.notification.barkUrl,
      fields: settings.notification.fields,
    },
    isIOS: iosDevice,
    deviceName,
    panelOpen: settings.panelOpen,
  });

  panel = setupPanel({
    doc,
    initialOpen: settings.panelOpen,
    getState: getViewState,
    onOpenChange: open => updateSetting({ panelOpen: open }),

    onKeepAliveToggle: enabled => {
      updateSetting({ keepAlive: { ...settings.keepAlive, enabled } });
      if (enabled) {
        void keepAlive.start('用户手动开启保活');
      } else {
        keepAlive.stop();
      }
    },
    onAutoResumeToggle: autoResume => {
      updateSetting({ keepAlive: { ...settings.keepAlive, autoResume } });
      keepAlive.setAutoResume(autoResume);
    },
    onKeepAliveTest: () => {
      void keepAlive.test();
    },

    onNotificationToggle: enabled => {
      updateSetting({ notification: { ...settings.notification, enabled } });
      if (enabled) void notification.requestPermission();
    },
    onBarkEnabledChange: enabled => {
      updateSetting({ notification: { ...settings.notification, barkEnabled: enabled } });
    },
    onBarkUrlChange: url => {
      updateSetting({ notification: { ...settings.notification, barkUrl: url } });
    },
    onNotificationFieldChange: fields => {
      updateSetting({
        notification: { ...settings.notification, fields: { ...settings.notification.fields, ...fields } },
      });
    },
    onRequestPermission: () => {
      void notification.requestPermission();
    },
    onTestNotification: () => {
      void notification.requestPermission().then(granted => {
        if (granted) notification.notifyGenerationDone(getLastMessageId());
      });
    },
  });

  // Register script button
  replaceScriptButtons([{ name: SCRIPT_BUTTON_NAME, visible: true }]);
  eventOn(getButtonEvent(SCRIPT_BUTTON_NAME), () => panel.open());

  // Restore keep-alive from saved settings
  keepAlive.setAutoResume(settings.keepAlive.autoResume);
  if (settings.keepAlive.enabled) {
    void keepAlive.start('根据保存的设置恢复保活');
  }

  // 等消息 extra 数据就绪后再发通知
  const waitAndNotify = (messageId?: number) => {
    if (!settings.notification.enabled) return;
    let tries = 0;
    const check = () => {
      const msg = typeof messageId === 'number' ? getChatMessages(messageId)[0] : getChatMessages(-1)[0];
      const extra = msg?.extra as Record<string, any> | undefined;
      const inner = extra?.extra as Record<string, any> | undefined;
      if (inner?.token_count != null || tries >= 10) {
        notification.notifyGenerationDone(messageId);
      } else {
        tries++;
        setTimeout(check, 200);
      }
    };
    check();
  };

  eventOn(tavern_events.GENERATION_ENDED, messageId => waitAndNotify(messageId));
  eventOn(iframe_events.GENERATION_ENDED, (_text, messageId) => waitAndNotify(messageId));

  // Cleanup
  const stopReload = reloadOnChatChange();
  $(window).on('pagehide', () => {
    stopReload.stop();
    panel.dispose();
    keepAlive.dispose();
  });

  console.info('[后台助手] 已加载');
}

$(() => {
  errorCatched(init)();
});
