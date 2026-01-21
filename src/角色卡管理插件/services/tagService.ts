import type { CardHubItem } from '../types';

type TagItem = {
  id: string;
  name: string;
};

type TagStore = {
  tags?: TagItem[];
  tagMap?: Record<string, string[]>;
  characters?: Array<{
    name?: string;
    avatar?: string | null;
    tags?: string[];
    data?: { tags?: string[] };
  }>;
  saveSettingsDebounced?: () => void;
};

function getContext(): TagStore | null {
  let st: typeof SillyTavern | undefined;
  try {
    st = window.parent?.SillyTavern;
  } catch {
    st = undefined;
  }
  st ??= SillyTavern;
  if (typeof st?.getContext !== 'function') {
    return null;
  }
  return st.getContext() as TagStore;
}

function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function ensureTagStore(ctx: TagStore) {
  if (!Array.isArray(ctx.tags)) {
    ctx.tags = [];
  }
  if (!ctx.tagMap) {
    ctx.tagMap = {};
  }
}

function ensureTag(ctx: TagStore, tagName: string): TagItem {
  ensureTagStore(ctx);
  const existing = ctx.tags!.find(tag => tag.name === tagName);
  if (existing) {
    return existing;
  }
  const id = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `tag-${Date.now()}`;
  const tag: TagItem = {
    id,
    name: tagName,
  };
  ctx.tags!.push({
    id: tag.id,
    name: tag.name,
  });
  return tag;
}

function findCharacter(ctx: TagStore, target: CardHubItem) {
  if (!Array.isArray(ctx.characters)) {
    return null;
  }
  const byAvatar = target.avatar ? ctx.characters.find(character => character.avatar === target.avatar) : null;
  if (byAvatar) {
    return byAvatar;
  }
  return ctx.characters.find(character => character.name === target.name) ?? null;
}

export function getAllTagsFromContext(): string[] {
  const ctx = getContext();
  if (!ctx || !Array.isArray(ctx.tags)) {
    return [];
  }
  return ctx.tags.map(tag => tag.name).filter(Boolean);
}

function getTagMapEntry(tagKey: string | null | undefined): { hasKey: boolean; tags: string[] } {
  if (!tagKey) {
    return { hasKey: false, tags: [] };
  }
  const ctx = getContext();
  if (!ctx || !ctx.tagMap || !Array.isArray(ctx.tags)) {
    return { hasKey: false, tags: [] };
  }
  const hasKey = Object.prototype.hasOwnProperty.call(ctx.tagMap, tagKey);
  if (!hasKey) {
    return { hasKey: false, tags: [] };
  }
  const tagIdToName = new Map<string, string>();
  ctx.tags.forEach(tag => {
    if (tag?.id && tag?.name) {
      tagIdToName.set(tag.id, tag.name);
    }
  });
  const ids = ctx.tagMap[tagKey] ?? [];
  const tags = ids.map(id => tagIdToName.get(id)).filter(Boolean) as string[];
  return { hasKey: true, tags };
}

export function getTagsForAvatar(tagKey: string | null | undefined): string[] {
  return getTagMapEntry(tagKey).tags;
}

export function getMergedTags(target: CardHubItem): string[] {
  if (target.origin === 'library') {
    return target.tags ?? [];
  }
  const entry = getTagMapEntry(target.tagKey ?? target.avatar);
  if (entry.hasKey) {
    return entry.tags;
  }
  return target.tags ?? [];
}

export function updateCharacterTags(target: CardHubItem, nextTags: string[]): string[] {
  const ctx = getContext();
  if (!ctx) {
    return nextTags;
  }
  const character = findCharacter(ctx, target);
  if (!character) {
    return nextTags;
  }
  const cleaned = Array.from(new Set(nextTags.map(tag => normalizeTagName(tag)).filter(Boolean)));

  character.tags = cleaned;
  if (character.data) {
    character.data.tags = cleaned;
  }

  ensureTagStore(ctx);
  const tagIds = cleaned.map(tag => ensureTag(ctx, tag).id);
  const tagKey = target.tagKey ?? character.avatar ?? null;
  if (tagKey) {
    ctx.tagMap![tagKey] = tagIds;
  }

  ctx.saveSettingsDebounced?.();
  const st = window.parent?.SillyTavern ?? SillyTavern;
  st?.saveSettingsDebounced?.();

  return cleaned;
}
