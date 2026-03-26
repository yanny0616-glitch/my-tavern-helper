export type CrashState = {
  cleanExit: boolean;
  crashCount: number;
  lastHeartbeatAt: number;
  lastStartAt: number;
  lastPagehideAt: number;
  degradeUntil: number;
  events: string[];
};

export type FeatureSettings = {
  enableCrashGuard: boolean;
  enableSelectionGuard: boolean;
  enableMemorySnapshot: boolean;
  enableHeavyMode: boolean;
  enableAutoLightModeOnBackground: boolean;
};

export type Disposable = {
  dispose: () => void;
};
