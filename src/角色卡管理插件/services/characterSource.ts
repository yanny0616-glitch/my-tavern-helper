import type { CardHubItem } from '../types';

export async function fetchCharacterSummaries(): Promise<CardHubItem[]> {
  let st: typeof SillyTavern | undefined;
  try {
    st = window.parent?.SillyTavern;
  } catch {
    st = undefined;
  }
  st ??= SillyTavern;
  const ctx = typeof st?.getContext === 'function' ? st.getContext() : null;
  if (typeof ctx?.getCharacters === 'function') {
    try {
      await ctx.getCharacters();
    } catch (error) {
      console.warn('[CardHub] 读取角色列表失败，将使用缓存数据', error);
    }
  }

  const list = ctx?.characters ?? SillyTavern?.characters ?? [];
  const idCounts = new Map<string, number>();
  const tagKeyCounts = new Map<string, number>();
  const tagIdToName = new Map<string, string>();
  if (Array.isArray(ctx?.tags)) {
    ctx.tags.forEach(tag => {
      if (tag?.id && tag?.name) {
        tagIdToName.set(tag.id, tag.name);
      }
    });
  }

  return list.map((character, index) => {
    const directTags = character.tags ?? character.data?.tags ?? [];
    const avatarKey = character.avatar;
    const name = character.name ?? '未命名角色';
    const stamp = character.create_date ?? character.date_added ?? character.chat ?? String(index);
    const tagBaseKey = avatarKey ?? `name:${name}::${stamp}`;
    let tagKey = tagBaseKey;
    if (!avatarKey) {
      const tagCount = tagKeyCounts.get(tagBaseKey) ?? 0;
      tagKeyCounts.set(tagBaseKey, tagCount + 1);
      if (tagCount) {
        tagKey = `${tagBaseKey}::${tagCount}`;
      }
    }

    const mappedIds = ctx?.tagMap?.[tagKey] ?? [];
    const mappedTags = mappedIds.map(id => tagIdToName.get(id)).filter(Boolean) as string[];
    const tags = Array.from(new Set([...directTags, ...mappedTags]));
    const baseId = avatarKey ? `avatar:${avatarKey}` : `name:${name}::${stamp}`;
    const count = idCounts.get(baseId) ?? 0;
    idCounts.set(baseId, count + 1);
    const id = count ? `${baseId}::${count}` : baseId;

    return {
      id,
      name,
      avatar: character.avatar ?? null,
      tags,
      tagKey,
      origin: 'tavern',
    };
  });
}
