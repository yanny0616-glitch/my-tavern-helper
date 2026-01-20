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
    const createdRaw =
      character.create_date ??
      character.date_added ??
      (character as any)?.created ??
      (character as any)?.created_at ??
      (character as any)?.timestamp ??
      (character as any)?.time ??
      character.data?.create_date ??
      character.data?.date_added ??
      (character as any)?.data?.created ??
      (character as any)?.data?.created_at ??
      (character as any)?.data?.timestamp ??
      (character as any)?.data?.time ??
      null;
    const createdAt = coerceToTimestamp(createdRaw) ?? 0;
    const stamp = createdRaw ?? String(index);
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

    const lastChatRaw =
      (character as any)?.last_interaction ??
      (character as any)?.last_interaction_time ??
      (character as any)?.last_interaction_date ??
      (character as any)?.last_chat_time ??
      (character as any)?.last_chat_date ??
      (character as any)?.last_message_time ??
      (character as any)?.last_message_date ??
      (character as any)?.update_time ??
      (character as any)?.last_modified ??
      (character as any)?.timestamp ??
      (character as any)?.time ??
      (character as any)?.data?.last_interaction ??
      (character as any)?.data?.last_interaction_time ??
      (character as any)?.data?.last_interaction_date ??
      (character as any)?.data?.last_chat_time ??
      (character as any)?.data?.last_chat_date ??
      (character as any)?.data?.last_message_time ??
      (character as any)?.data?.last_message_date ??
      (character as any)?.data?.update_time ??
      (character as any)?.data?.last_modified ??
      (character as any)?.data?.timestamp ??
      (character as any)?.data?.time ??
      null;

    return {
      id,
      name,
      avatar: character.avatar ?? null,
      tags,
      tagKey,
      origin: 'tavern',
      createdAt,
      lastChatAt: coerceToTimestamp(lastChatRaw) ?? 0,
    };
  });
}

function coerceToTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}
