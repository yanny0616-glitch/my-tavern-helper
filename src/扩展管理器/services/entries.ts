import { scanCoreFromDom, scanThirdPartyFromDom } from './dom-scan';
import { ExtensionEntry, TavernContext } from '../types';
import { getExtensionSettings, saveSettings } from './tavern';
import { applyUpdateInfo } from './updates';

async function fetchManifestName(name: string): Promise<string | null> {
  const candidates = [
    `/scripts/extensions/third-party/${name}/manifest.json`,
    `/scripts/extensions/third-party/${name}/manifest.yaml`,
    `/scripts/extensions/third-party/${name}/manifest.yml`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        continue;
      }
      const text = await res.text();
      if (url.endsWith('.json')) {
        const data = JSON.parse(text) as Record<string, unknown>;
        const raw =
          (data.displayName as string) ||
          (data.display_name as string) ||
          (data.title as string) ||
          (data.name as string);
        if (raw && raw !== name) {
          return raw;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function resolveDisplayNames(names: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  await Promise.all(
    names.map(async name => {
      const displayName = await fetchManifestName(name);
      if (displayName) {
        results[name] = displayName;
      }
    }),
  );
  return results;
}

export function getDisabledThirdParty(ctx: TavernContext): Set<string> {
  const settings = getExtensionSettings(ctx);
  const disabled = (settings.disabledExtensions ?? []) as unknown[];
  const names = disabled
    .filter((item: unknown): item is string => typeof item === 'string' && item.startsWith('third-party/'))
    .map(item => item.replace(/^third-party\//, ''));
  return new Set(names);
}

export async function buildEntries(doc: Document, ctx: TavernContext): Promise<ExtensionEntry[]> {
  const disabledThirdParty = getDisabledThirdParty(ctx);
  const enabledThirdParty = scanThirdPartyFromDom(doc);
  const enabledCore = scanCoreFromDom(doc);

  const thirdPartyNames = new Set<string>([...enabledThirdParty, ...disabledThirdParty]);
  const displayNames = await resolveDisplayNames(Array.from(thirdPartyNames));
  const thirdPartyEntries: ExtensionEntry[] = Array.from(thirdPartyNames)
    .sort((a, b) => a.localeCompare(b))
    .map(name => ({
      name,
      displayName: displayNames[name],
      kind: 'third-party' as const,
      status: disabledThirdParty.has(name) ? 'disabled' : 'enabled',
    }));

  const coreEntries: ExtensionEntry[] = enabledCore.map(name => ({
    name,
    kind: 'core' as const,
    status: 'enabled' as const,
  }));

  const entries = [...thirdPartyEntries, ...coreEntries];
  return applyUpdateInfo(entries);
}

export function setThirdPartyDisabled(ctx: TavernContext, name: string, disabled: boolean): void {
  const settings = getExtensionSettings(ctx);
  const list = new Set<string>(
    ((settings.disabledExtensions ?? []) as unknown[]).filter(
      (item: unknown): item is string => typeof item === 'string',
    ),
  );
  const key = `third-party/${name}`;
  if (disabled) {
    list.add(key);
  } else {
    list.delete(key);
  }
  settings.disabledExtensions = Array.from(list);
  saveSettings(ctx);
}
