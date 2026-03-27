export type Disposable = {
  dispose: () => void;
};

export type NotificationFields = {
  characterName: boolean;
  duration: boolean;
  tokenCount: boolean;
  reasoningDuration: boolean;
  timeToFirstToken: boolean;
  model: boolean;
  api: boolean;
  preview: boolean;
  previewLength: number;
};

export type Settings = {
  keepAlive: {
    enabled: boolean;
    autoResume: boolean;
  };
  notification: {
    enabled: boolean;
    barkEnabled: boolean;
    barkUrl: string;
    fields: NotificationFields;
  };
  panelOpen: boolean;
};

export type KeepAliveSnapshot = {
  audioAttached: boolean;
  playing: boolean;
  statusText: string;
  errorText: string;
  visibilityState: DocumentVisibilityState;
  attempts: number;
  lastStartedAt: number | null;
  lastErrorAt: number | null;
};

export type NotificationSnapshot = {
  permissionStatus: string;
  lastNotifiedAt: number | null;
  lastGenerationDuration: string | null;
};

export type ViewState = {
  keepAlive: KeepAliveSnapshot & {
    enabled: boolean;
    autoResume: boolean;
  };
  notification: NotificationSnapshot & {
    enabled: boolean;
    barkEnabled: boolean;
    barkUrl: string;
    fields: NotificationFields;
  };
  isIOS: boolean;
  deviceName: string;
  panelOpen: boolean;
};

export type PanelController = Disposable & {
  open: () => void;
  close: () => void;
  refresh: () => void;
};
