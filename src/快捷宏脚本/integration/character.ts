export function getCurrentCharacterId(): string {
  const raw = (SillyTavern as any)?.characterId ?? (SillyTavern as any)?.getContext?.().characterId ?? '';
  if (raw === undefined || raw === null) {
    return '';
  }
  return String(raw);
}

export function getCurrentCharacterLabel(): string {
  const id = getCurrentCharacterId();
  const idx = Number(id);
  const list = (SillyTavern as any)?.characters as { name?: string }[] | undefined;
  if (!Number.isNaN(idx) && list?.[idx]?.name) {
    return `当前角色：${list[idx].name}`;
  }
  return id ? `当前角色ID：${id}` : '未选择角色';
}
