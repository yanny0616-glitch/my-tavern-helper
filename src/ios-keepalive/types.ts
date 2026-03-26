export type Disposable = {
  dispose: () => void;
};

export type KeepAliveSettings = {
  enabled: boolean;
  autoResume: boolean;
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

export type KeepAliveViewState = {
  enabled: boolean;
  autoResume: boolean;
  isIOS: boolean;
  audioAttached: boolean;
  playing: boolean;
  statusText: string;
  errorText: string;
  visibilityLabel: string;
  attempts: number;
  lastStartedAtLabel: string;
  lastErrorAtLabel: string;
  hintText: string;
};

export type PanelController = Disposable & {
  open: () => void;
  close: () => void;
  refresh: () => void;
};
