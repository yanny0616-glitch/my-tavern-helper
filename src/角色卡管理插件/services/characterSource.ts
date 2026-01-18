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
  const tagIdToName = new Map<string, string>();
  if (Array.isArray(ctx?.tags)) {
    ctx.tags.forEach(tag => {
      if (tag?.id && tag?.name) {
        tagIdToName.set(tag.id, tag.name);
      }
    });
  }

  return list.map(character => {
    const directTags = character.tags ?? character.data?.tags ?? [];
    const avatarKey = character.avatar ?? 'null';
    const mappedIds = ctx?.tagMap?.[avatarKey] ?? [];
    const mappedTags = mappedIds.map(id => tagIdToName.get(id)).filter(Boolean) as string[];
    const tags = Array.from(new Set([...directTags, ...mappedTags]));

    return {
      id: character.avatar ?? character.name ?? `char-${Math.random()}`,
      name: character.name ?? '未命名角色',
      avatar: character.avatar ?? null,
      tags,
      origin: 'tavern',
    };
  });
}
