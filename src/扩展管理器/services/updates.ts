import type { ExtensionEntry, ExtensionInstallationInfo, ExtensionUpdateInfo } from '../types';
import { getContext } from './tavern';

type ExtensionApi = {
  getExtensionInstallationInfo?: (id: string) => Promise<ExtensionInstallationInfo | null>;
  getExtensionType?: (id: string) => 'local' | 'global' | 'system' | null;
  updateExtension?: (id: string) => Promise<Response>;
  isAdmin?: () => boolean;
};

function getApi(): ExtensionApi {
  // Extension APIs are exposed on the script iframe window, not the parent.
  return (window as ExtensionApi) ?? ((window.parent as ExtensionApi) || {});
}

function getRequestHeadersSafe(): Record<string, string> {
  const ctx = getContext();
  const headers = ctx?.getRequestHeaders?.();
  return (headers as Record<string, string>) ?? { 'Content-Type': 'application/json' };
}

function getExtensionTypeSafe(name: string): 'local' | 'global' | 'system' | null {
  const api = getApi();
  if (typeof api.getExtensionType === 'function') {
    return api.getExtensionType(name);
  }
  return null;
}

async function getExtensionVersionApi(
  extensionName: string,
  global: boolean,
): Promise<
  | {
      currentBranchName: string;
      currentCommitHash: string;
      isUpToDate: boolean;
      remoteUrl: string;
    }
  | null
> {
  try {
    const response = await fetch('/api/extensions/version', {
      method: 'POST',
      headers: getRequestHeadersSafe(),
      body: JSON.stringify({ extensionName, global }),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as {
      currentBranchName: string;
      currentCommitHash: string;
      isUpToDate: boolean;
      remoteUrl: string;
    };
  } catch {
    return null;
  }
}

export function canCheckUpdates(): boolean {
  const api = getApi();
  return typeof api.getExtensionInstallationInfo === 'function' || true;
}

export async function applyUpdateInfo(entries: ExtensionEntry[]): Promise<ExtensionEntry[]> {
  const api = getApi();
  const apiAvailable = typeof api.getExtensionInstallationInfo === 'function';

  if (apiAvailable) {
    const candidates = entries.filter(entry => entry.kind === 'third-party');
    const results = await Promise.all(
      candidates.map(async entry => {
        try {
          const info = await api.getExtensionInstallationInfo!(entry.name);
          const type = api.getExtensionType ? api.getExtensionType(entry.name) : null;
          const canUpdate =
            info && type !== 'system' ? (type === 'global' ? (api.isAdmin ? api.isAdmin() : true) : true) : false;
          const status: ExtensionUpdateInfo['status'] = info
            ? info.is_up_to_date
              ? 'up-to-date'
              : 'update-available'
            : 'unknown';
          return { name: entry.name, update: { status, info, type, canUpdate } as ExtensionUpdateInfo };
        } catch {
          return { name: entry.name, update: { status: 'error' } as ExtensionUpdateInfo };
        }
      }),
    );

    const map = new Map(results.map(result => [result.name, result.update]));
    return entries.map(entry => ({
      ...entry,
      update: map.get(entry.name) ?? entry.update,
    }));
  }

  const candidates = entries.filter(entry => entry.kind === 'third-party');
  const results = await Promise.all(
    candidates.map(async entry => {
      const type = getExtensionTypeSafe(entry.name);
      const data = await getExtensionVersionApi(entry.name, type === 'global');
      if (!data) {
        return { name: entry.name, update: { status: 'unknown' } as ExtensionUpdateInfo };
      }
      const status: ExtensionUpdateInfo['status'] = data.isUpToDate ? 'up-to-date' : 'update-available';
      return {
        name: entry.name,
        update: {
          status,
          info: {
            current_branch_name: data.currentBranchName,
            current_commit_hash: data.currentCommitHash,
            is_up_to_date: data.isUpToDate,
            remote_url: data.remoteUrl,
          },
          type,
          canUpdate: !data.isUpToDate,
        } as ExtensionUpdateInfo,
      };
    }),
  );

  const map = new Map(results.map(result => [result.name, result.update]));
  return entries.map(entry => ({
    ...entry,
    update: map.get(entry.name) ?? { status: 'unknown' },
  }));
}

export async function updateExtensions(names: string[]): Promise<{ ok: string[]; failed: string[] }> {
  const api = getApi();
  if (typeof api.updateExtension !== 'function') {
    const ok: string[] = [];
    const failed: string[] = [];
    for (const name of names) {
      try {
        const isGlobal = getExtensionTypeSafe(name) === 'global';
        const response = await fetch('/api/extensions/update', {
          method: 'POST',
          headers: getRequestHeadersSafe(),
          body: JSON.stringify({ extensionName: name, global: isGlobal }),
        });
        if (response.ok) {
          ok.push(name);
        } else {
          failed.push(name);
        }
      } catch {
        failed.push(name);
      }
    }
    return { ok, failed };
  }

  const ok: string[] = [];
  const failed: string[] = [];
  for (const name of names) {
    try {
      const res = await api.updateExtension!(name);
      if (res?.ok) {
        ok.push(name);
      } else {
        failed.push(name);
      }
    } catch {
      failed.push(name);
    }
  }
  return { ok, failed };
}

export async function deleteExtension(name: string): Promise<boolean> {
  const api = getApi() as { uninstallExtension?: (id: string) => Promise<Response> };
  if (typeof api.uninstallExtension === 'function') {
    try {
      const res = await api.uninstallExtension(name);
      return !!res?.ok;
    } catch {
      return false;
    }
  }

  try {
    const isGlobal = getExtensionTypeSafe(name) === 'global';
    const response = await fetch('/api/extensions/uninstall', {
      method: 'POST',
      headers: getRequestHeadersSafe(),
      body: JSON.stringify({ extensionName: name, global: isGlobal }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
