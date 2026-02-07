export type ExtensionKind = 'third-party' | 'core';
export type ExtensionStatus = 'enabled' | 'disabled';

export type ExtensionEntry = {
  name: string;
  status: ExtensionStatus;
  kind: ExtensionKind;
  displayName?: string;
  update?: ExtensionUpdateInfo;
};

export type ExtensionUpdateStatus = 'unknown' | 'up-to-date' | 'update-available' | 'error';

export type ExtensionUpdateInfo = {
  status: ExtensionUpdateStatus;
  type?: 'local' | 'global' | 'system' | null;
  canUpdate?: boolean;
  info?: ExtensionInstallationInfo | null;
};

export type ExtensionInstallationInfo = {
  current_branch_name: string;
  current_commit_hash: string;
  is_up_to_date: boolean;
  remote_url: string;
};

// Avoid hard dependency on global SillyTavern typing; keep it flexible for runtime.
export type TavernContext = any;
