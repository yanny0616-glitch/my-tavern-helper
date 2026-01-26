import type { Macro } from '../ui/context';
import { MANAGE_BUTTON_NAME } from './constants';

export function ensureMacroIds(macros: Macro[]): Macro[] {
  return macros.map(macro => ({
    ...macro,
    id: macro.id || SillyTavern.uuidv4(),
  }));
}

export function ensureScopeDefaults(macros: Macro[], currentId: string): Macro[] {
  return macros.map(macro => {
    if (macro.scope === 'character' && !macro.characterId) {
      return { ...macro, characterId: currentId };
    }
    return macro;
  });
}

export function normalizeMacros(macros: Macro[]): { macros: Macro[]; warnings: string[] } {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const normalized: Macro[] = [];

  for (const macro of macros) {
    const name = macro.name.trim();
    if (!name) {
      warnings.push('忽略空名称的快捷语句。');
      continue;
    }
    if (name === MANAGE_BUTTON_NAME) {
      warnings.push(`快捷语句名称 "${MANAGE_BUTTON_NAME}" 保留，已忽略。`);
      continue;
    }
    if (seen.has(name)) {
      warnings.push(`快捷语句名称 "${name}" 重复，已忽略后续条目。`);
      continue;
    }
    seen.add(name);
    normalized.push({ ...macro, name });
  }

  return { macros: ensureMacroIds(normalized), warnings };
}

export function getUniqueName(baseName: string, macros: Macro[]): string {
  const existing = new Set(macros.map(macro => macro.name));
  if (!existing.has(baseName)) {
    return baseName;
  }
  let index = 2;
  while (existing.has(`${baseName} ${index}`)) {
    index += 1;
  }
  return `${baseName} ${index}`;
}
