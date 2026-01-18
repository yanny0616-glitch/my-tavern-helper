<template>
  <div class="cardhub-root" :class="{ open: state.open }">
    <div class="cardhub-backdrop" @click="close" />
    <section class="cardhub-panel" role="dialog" aria-label="CardHub 角色卡管理器">
      <header class="cardhub-header">
        <div class="cardhub-title">
          <span class="cardhub-title__main">CardHub</span>
          <span class="cardhub-title__sub">角色卡管理器</span>
        </div>
        <div class="cardhub-actions">
          <button class="cardhub-close" type="button" aria-label="关闭" @click="close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>

      <div class="cardhub-toolbar">
        <input
          v-model="state.search"
          class="cardhub-search"
          type="search"
          placeholder="搜索角色名或标签"
        />
        <button class="cardhub-button" type="button" @click="refresh">刷新</button>
        <button class="cardhub-button is-ghost" type="button" @click="triggerImport">导入</button>
        <button class="cardhub-button is-ghost" type="button" @click="exportSelected">批量导出</button>
        <input
          ref="importInput"
          class="cardhub-import-input"
          type="file"
          accept=".png,.json"
          multiple
          @change="handleImportFiles"
        />
      </div>

      <div class="cardhub-body">
        <div class="cardhub-sidebar">
          <div class="cardhub-section-title">分类</div>
          <div class="cardhub-chip-row">
            <button
              class="cardhub-chip"
              :class="{ 'is-active': statusFilter === 'all' }"
              type="button"
              @click="statusFilter = 'all'"
            >
              全部
            </button>
            <button
              class="cardhub-chip"
              :class="{ 'is-active': statusFilter === 'imported' }"
              type="button"
              @click="statusFilter = 'imported'"
            >
              已导入
            </button>
            <button
              class="cardhub-chip"
              :class="{ 'is-active': statusFilter === 'unimported' }"
              type="button"
              @click="statusFilter = 'unimported'"
            >
              未导入
            </button>
          </div>
          <div class="cardhub-section-title">标签</div>
          <div class="cardhub-tag-filter">
            <button
              v-for="tag in allTags"
              :key="tag"
              class="cardhub-tag-filter__chip"
              :class="{ 'is-active': selectedTags.includes(tag) }"
              type="button"
              @click="toggleTagFilter(tag)"
            >
              {{ tag }}
            </button>
          </div>
          <button
            v-if="selectedTags.length"
            class="cardhub-chip cardhub-chip--clear"
            type="button"
            @click="clearTagFilter"
          >
            清空标签
          </button>
        </div>

        <div class="cardhub-content">
          <div v-if="state.loading" class="cardhub-loading">正在读取角色卡...</div>
          <div v-else-if="!filteredCharacters.length" class="cardhub-empty">
            暂无角色卡，或没有匹配的搜索结果。
          </div>
          <div v-else class="cardhub-grid">
            <article
              v-for="character in filteredCharacters"
              :key="character.id"
              class="cardhub-card"
              @click="openPreview(character)"
            >
              <div
                class="cardhub-card__avatar"
                :class="{ 'has-avatar': Boolean(avatarUrl(character)) }"
                :style="avatarStyle(character)"
              >
                <span>{{ character.name.slice(0, 1) || '?' }}</span>
              </div>
              <div class="cardhub-card__info">
                <div class="cardhub-card__name">{{ character.name }}</div>
                <div class="cardhub-card__meta">
                  <span>{{ character.origin === 'tavern' ? '已导入' : '未导入' }}</span>
                  <span>{{ displayTags(character).length }} 标签</span>
                </div>
                <div class="cardhub-card__tags">
                  <button
                    v-for="tag in displayTags(character)"
                    :key="tag"
                    class="cardhub-tag"
                    type="button"
                    title="点击移除标签"
                    @click="removeTag(character, tag)"
                  >
                    {{ tag }}
                    <span class="cardhub-tag__remove">×</span>
                  </button>
                  <button
                    v-if="activeTagKey !== tagKey(character)"
                    class="cardhub-tag is-add"
                    type="button"
                    @click="startTagEdit(character)"
                  >
                    + 标签
                  </button>
                  <input
                    v-else
                    v-model="tagInput"
                    class="cardhub-tag-input"
                    type="text"
                    placeholder="新标签"
                    @keydown.enter.prevent="confirmTag(character)"
                    @keydown.esc.prevent="cancelTagEdit"
                    @blur="confirmTag(character)"
                  />
                </div>
              </div>
              <div class="cardhub-card__actions">
                <button
                  class="cardhub-card__action is-secondary"
                  type="button"
                  @click.stop="handleCardAction(character)"
                  @pointerdown.stop
                  @mousedown.stop
                  @touchstart.stop
                >
                  {{ character.origin === 'tavern' ? '导出' : '导入' }}
                </button>
                <button
                  class="cardhub-card__action"
                  type="button"
                  @click.stop="openManage(character)"
                  @pointerdown.stop
                  @mousedown.stop
                  @touchstart.stop
                >
                  管理
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <div v-if="previewCard" class="cardhub-preview" @click.self="closePreview">
      <div class="cardhub-preview__panel" role="dialog" aria-label="角色卡预览">
        <button class="cardhub-preview__close" type="button" @click="closePreview">×</button>
        <div class="cardhub-preview__avatar">
          <img v-if="previewAvatarUrl" :src="previewAvatarUrl" alt="" />
        </div>
        <div class="cardhub-preview__info">
          <div class="cardhub-preview__name">{{ previewCard.name }}</div>
          <div class="cardhub-preview__meta">
            <span>{{ previewCard.origin === 'tavern' ? '已导入' : '未导入' }}</span>
            <span>{{ displayTags(previewCard).length }} 标签</span>
          </div>
          <div class="cardhub-preview__tags">
            <span v-for="tag in displayTags(previewCard)" :key="tag" class="cardhub-preview__tag">
              {{ tag }}
            </span>
          </div>
        </div>
        <div class="cardhub-preview__actions">
          <button
            class="cardhub-card__action is-secondary"
            type="button"
            @click.stop="handleCardAction(previewCard)"
            @pointerdown.stop
            @mousedown.stop
            @touchstart.stop
          >
            {{ previewCard.origin === 'tavern' ? '导出' : '导入' }}
          </button>
          <button
            class="cardhub-card__action"
            type="button"
            @click.stop="openManage(previewCard)"
            @pointerdown.stop
            @mousedown.stop
            @touchstart.stop
          >
            管理
          </button>
        </div>
      </div>
    </div>

    <div v-if="manageCard" class="cardhub-manage" @click.self="closeManage">
      <div class="cardhub-manage__panel" role="dialog" aria-label="角色管理">
        <button class="cardhub-preview__close" type="button" @click="closeManage">×</button>
        <div class="cardhub-manage__top">
          <div class="cardhub-manage__summary">
            <div class="cardhub-preview__name">{{ manageCard.name }}</div>
            <div class="cardhub-preview__meta">
              <span>{{ manageCard.origin === 'tavern' ? '已导入' : '未导入' }}</span>
              <span>{{ displayTags(manageCard).length }} 标签</span>
            </div>
            <div class="cardhub-preview__tags">
              <span v-for="tag in displayTags(manageCard)" :key="tag" class="cardhub-preview__tag">
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="cardhub-manage__media">
            <img v-if="manageAvatarUrl" :src="manageAvatarUrl" alt="" />
          </div>
        </div>
        <div class="cardhub-manage__section">
          <div class="cardhub-manage__label">开场白</div>
          <div class="cardhub-manage__content">
            <template v-if="manageOpeningLines.length">
              <div v-for="(opening, index) in manageOpeningLines" :key="index" class="cardhub-manage__opening">
                {{ opening }}
              </div>
            </template>
            <template v-else>暂无开场白</template>
          </div>
        </div>
        <div class="cardhub-manage__section">
          <div class="cardhub-manage__label">
            <span>最近聊天</span>
            <button
              class="cardhub-manage__jump"
              type="button"
              @click="openLatestChat"
              @pointerdown.stop
              @mousedown.stop
              @touchstart.stop
            >
              进入最近聊天
            </button>
          </div>
          <div v-if="manageChats.length" class="cardhub-manage__chat">
            <div
              v-for="(msg, index) in manageChats"
              :key="index"
              class="cardhub-manage__chat-row"
              role="button"
              tabindex="0"
              @click="openChat(msg)"
              @keydown.enter.prevent="openChat(msg)"
            >
              <span class="cardhub-manage__chat-name">{{ msg.name }}</span>
              <span class="cardhub-manage__chat-text">{{ msg.mes }}</span>
            </div>
          </div>
          <div v-else class="cardhub-manage__empty">暂无聊天记录</div>
        </div>
        <div class="cardhub-manage__actions">
          <button
            class="cardhub-card__action is-secondary"
            type="button"
            @click.stop="handleCardAction(manageCard)"
            @pointerdown.stop
            @mousedown.stop
            @touchstart.stop
          >
            {{ manageCard.origin === 'tavern' ? '导出' : '导入' }}
          </button>
          <button
            class="cardhub-card__action"
            type="button"
            @click.stop="manageDelete(manageCard)"
            @pointerdown.stop
            @mousedown.stop
            @touchstart.stop
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { cardHubState as state, setCharacters, setLibrary, setLoading, setOpen } from '../state/store';
import { fetchCharacterSummaries } from '../services/characterSource';
import { regexFromString } from './util/common';
import type { CardHubItem } from '../types';
import { addToLibrary, loadLibrary, removeFromLibrary, updateLibraryTags } from '../services/libraryService';
import { getMergedTags, updateCharacterTags } from '../services/tagService';

const selectedTags = ref<string[]>([]);
const activeTagKey = ref<string | null>(null);
const tagInput = ref('');
const statusFilter = ref<'all' | 'imported' | 'unimported'>('all');
const importInput = ref<HTMLInputElement | null>(null);
const previewCard = ref<CardHubItem | null>(null);
const manageCard = ref<CardHubItem | null>(null);
const manageOpenings = ref<string[]>([]);
const manageChats = ref<Array<{ name: string; mes: string; file: string }>>([]);
const manageOpeningLines = computed(() => previewOpenings(manageOpenings.value, 3));

const allCards = computed(() => [...state.characters, ...state.library]);

const filteredCharacters = computed(() => {
  const list = applyStatusFilter(allCards.value);
  const keyword = state.search.trim();
  if (!keyword) {
    return applyTagFilter(list);
  }
  const matcher = regexFromString(keyword) ?? new RegExp(_.escapeRegExp(keyword), 'i');
  return applyTagFilter(list).filter(character => {
    return matcher.test(character.name) || character.tags.some(tag => matcher.test(tag));
  });
});

const allTags = computed(() => {
  const tagSet = new Set<string>();
  allCards.value.forEach(character => {
    getMergedTags(character).forEach(tag => tagSet.add(tag));
  });
  selectedTags.value.forEach(tag => tagSet.add(tag));
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'zh-CN'));
});

function avatarUrl(character: CardHubItem, useFull = false): string | null {
  const avatar = character.avatar;
  if (!avatar) {
    return null;
  }
  if (/^(data:|https?:|\/)/.test(avatar)) {
    return avatar;
  }
  if (useFull && character.origin === 'tavern') {
    return TavernHelper.getCharAvatarPath(avatar, true) ?? `/thumbnail?type=avatar&file=${encodeURIComponent(avatar)}`;
  }
  return `/thumbnail?type=avatar&file=${encodeURIComponent(avatar)}`;
}

function avatarStyle(character: CardHubItem): Record<string, string> {
  const url = avatarUrl(character);
  return url ? { backgroundImage: `url(${url})` } : {};
}

function displayTags(character: CardHubItem): string[] {
  return getMergedTags(character);
}

function openPreview(card: CardHubItem) {
  previewCard.value = card;
}

function closePreview() {
  previewCard.value = null;
}

const previewAvatarUrl = computed(() => {
  if (!previewCard.value) {
    return null;
  }
  return avatarUrl(previewCard.value, true);
});

const manageAvatarUrl = computed(() => {
  if (!manageCard.value) {
    return null;
  }
  return avatarUrl(manageCard.value, true);
});

function applyStatusFilter(list: CardHubItem[]): CardHubItem[] {
  if (statusFilter.value === 'imported') {
    return list.filter(item => item.origin === 'tavern');
  }
  if (statusFilter.value === 'unimported') {
    return list.filter(item => item.origin === 'library');
  }
  return list;
}

function applyTagFilter(list: CardHubItem[]): CardHubItem[] {
  if (!selectedTags.value.length) {
    return list;
  }
  return list.filter(character =>
    selectedTags.value.some(tag => getMergedTags(character).includes(tag)),
  );
}

function toggleTagFilter(tag: string) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter(item => item !== tag);
  } else {
    selectedTags.value = [...selectedTags.value, tag];
  }
}

function clearTagFilter() {
  selectedTags.value = [];
}


function removeTag(character: CardHubItem, tag: string) {
  const nextTags = getMergedTags(character).filter(item => item !== tag);
  applyTagUpdate(character, nextTags);
}

function tagKey(character: CardHubItem): string {
  return character.avatar ? `avatar:${character.avatar}` : `name:${character.name}`;
}

function startTagEdit(character: CardHubItem) {
  activeTagKey.value = tagKey(character);
  tagInput.value = '';
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>('.cardhub-tag-input');
    input?.focus();
  });
}

function confirmTag(character: CardHubItem) {
  if (activeTagKey.value !== tagKey(character)) {
    return;
  }
  const input = tagInput.value.trim();
  if (input) {
    const nextTags = [...getMergedTags(character), input];
    applyTagUpdate(character, nextTags);
  }
  cancelTagEdit();
}

function cancelTagEdit() {
  activeTagKey.value = null;
  tagInput.value = '';
}

function applyTagUpdate(character: CardHubItem, nextTags: string[]) {
  if (character.origin === 'library') {
    const updatedLibrary = updateLibraryTags(character.id, nextTags);
    setLibrary(updatedLibrary);
  } else {
    const next = updateCharacterTags(character, nextTags);
    character.tags = next;
    setCharacters([...state.characters]);
  }
}

function triggerImport() {
  importInput.value?.click();
}

async function handleImportFiles(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const files = target?.files;
  if (!files || !files.length) {
    return;
  }
  const updated = await addToLibrary(files);
  setLibrary(updated);
  target.value = '';
}

function exportSelected() {
  const list = filteredCharacters.value;
  const tagLabel = selectedTags.value.length ? selectedTags.value.join('、') : '无';
  const statusLabel =
    statusFilter.value === 'all'
      ? '全部'
      : statusFilter.value === 'imported'
        ? '已导入'
        : '未导入';
  const searchLabel = state.search.trim() || '无';
  const message =
    `将导出 ${list.length} 张角色卡。\n` +
    `筛选状态：${statusLabel}\n` +
    `筛选标签：${tagLabel}\n` +
    `搜索关键字：${searchLabel}\n` +
    `是否继续？`;

  if (!window.confirm(message)) {
    return;
  }
  if (!list.length) {
    toastr.warning('当前没有可导出的角色卡');
    return;
  }
  list.forEach(item => exportCard(item));
}

async function handleCardAction(card: CardHubItem) {
  if (card.origin === 'library') {
    await importLibraryCard(card);
  } else {
    exportCard(card);
  }
}

async function importLibraryCard(card: CardHubItem) {
  if (!card.raw || !card.rawType) {
    toastr.error('缺少导入数据');
    return;
  }
  const headers = (SillyTavern?.getRequestHeaders ? SillyTavern.getRequestHeaders() : {}) as Record<string, string>;
  delete (headers as Record<string, string>)['Content-Type'];

  if (card.rawType === 'png') {
    const blob = await dataUrlToBlob(card.raw);
    await TavernHelper.importRawCharacter(card.name, blob);
  } else {
    const file = new File([card.raw], `${card.name}.json`, { type: 'application/json' });
    const form = new FormData();
    form.append('avatar', file);
    form.append('file_type', 'json');
    form.append('preserved_name', file.name);
    await fetch('/api/characters/import', {
      method: 'POST',
      headers,
      body: form,
      cache: 'no-cache',
    });
  }

  setLibrary(removeFromLibrary(card.id));
  const characters = await fetchCharacterSummaries();
  setCharacters(characters);
  toastr.success(`已导入 ${card.name}`);
}

async function exportCard(card: CardHubItem) {
  if (card.origin === 'library') {
    await exportLibraryCard(card);
    return;
  }
  if (!card.avatar) {
    toastr.error('无法导出：缺少头像信息');
    return;
  }
  const avatarPath = TavernHelper.getCharAvatarPath(card.avatar);
  if (!avatarPath) {
    toastr.error('无法导出：缺少头像信息');
    return;
  }
  const response = await fetch(avatarPath, { cache: 'no-cache' });
  const blob = await response.blob();
  downloadBlob(blob, `${card.name}.png`);
}

async function exportLibraryCard(card: CardHubItem) {
  if (!card.raw || !card.rawType) {
    toastr.error('无法导出：缺少原始数据');
    return;
  }
  if (card.rawType === 'png') {
    const blob = await dataUrlToBlob(card.raw);
    downloadBlob(blob, `${card.name}.png`);
    return;
  }
  const blob = new Blob([card.raw], { type: 'application/json' });
  downloadBlob(blob, `${card.name}.json`);
}

async function openManage(card: CardHubItem) {
  manageCard.value = card;
  manageOpenings.value = await resolveOpenings(card);
  manageChats.value = await resolveRecentChats(card);
}

function closeManage() {
  manageCard.value = null;
  manageOpenings.value = [];
  manageChats.value = [];
}

async function resolveOpenings(card: CardHubItem): Promise<string[]> {
  if (card.origin !== 'tavern') {
    return [];
  }
  const raw = await getFullCharacterData(card);
  const openings = extractOpeningMessages(raw);
  if (openings.length) {
    return openings;
  }
  const fallback =
    TavernHelper.RawCharacter?.find({ name: card.avatar ?? card.name, allowAvatar: true } as any) ??
    TavernHelper.RawCharacter?.find({ name: card.name, allowAvatar: true } as any);
  return extractOpeningMessages(fallback);
}

async function getFullCharacterData(card: CardHubItem): Promise<SillyTavern.v1CharData | null> {
  let st: typeof SillyTavern | undefined;
  try {
    st = window.parent?.SillyTavern;
  } catch {
    st = undefined;
  }
  st ??= SillyTavern;
  const ctx = typeof st?.getContext === 'function' ? st.getContext() : null;
  if (ctx?.getCharacters) {
    try {
      await ctx.getCharacters();
    } catch (error) {
      console.warn('[CardHub] 刷新角色卡列表失败', error);
    }
  }
  const list = ctx?.characters ?? st?.characters ?? [];
  if (!list.length) {
    return null;
  }
  const byAvatar = card.avatar
    ? list.findIndex(item => item.avatar === card.avatar || item.name === card.avatar)
    : -1;
  const byName = list.findIndex(item => item.name === card.name);
  const idx = byAvatar >= 0 ? byAvatar : byName;
  if (idx < 0) {
    return null;
  }
  if (ctx?.unshallowCharacter) {
    try {
      await ctx.unshallowCharacter(idx);
    } catch (error) {
      console.warn('[CardHub] 读取角色卡详情失败', error);
    }
  }
  const updatedList = ctx?.characters ?? list;
  const data = updatedList[idx] ?? null;
  if (data?.first_mes || data?.data?.first_mes) {
    return data;
  }
  if (ctx?.getCharacterCardFields) {
    try {
      const fields = await ctx.getCharacterCardFields({ chid: idx });
      if (fields?.first_mes || fields?.data?.first_mes) {
        return fields;
      }
    } catch (error) {
      console.warn('[CardHub] 读取角色卡字段失败', error);
    }
  }
  const fallback = TavernHelper.getCharData(card.avatar ?? card.name, true);
  return fallback ?? data;
}

function extractOpeningMessages(data: any): string[] {
  if (!data) {
    return [];
  }
  const list: string[] = [];
  const first = typeof data?.first_mes === 'string' ? data.first_mes : data?.data?.first_mes;
  if (typeof first === 'string' && first.trim()) {
    list.push(first.trim());
  }
  const alt =
    data?.alternate_greetings ??
    data?.data?.alternate_greetings ??
    data?.extensions?.alternate_greetings ??
    data?.data?.extensions?.alternate_greetings;
  if (Array.isArray(alt)) {
    alt.forEach(item => {
      if (typeof item === 'string' && item.trim()) {
        list.push(item.trim());
      }
    });
  } else if (typeof alt === 'string' && alt.trim()) {
    list.push(alt.trim());
  }
  return list;
}

function normalizeBriefMessage(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function previewOpenings(openings: string[], maxItems: number): string[] {
  return openings
    .map(opening => previewOpeningLines(opening, 2).join('\n'))
    .filter(preview => preview.trim().length > 0)
    .slice(0, maxItems);
}

function previewOpeningLines(text: string, maxLines: number): string[] {
  const trimmed = text.replace(/\r/g, '').trim();
  if (!trimmed) {
    return [];
  }
  const contentLines = extractContentLines(trimmed);
  if (contentLines.length >= maxLines) {
    return contentLines.slice(0, maxLines);
  }
  const normalized = normalizeBriefMessage(trimmed);
  if (!normalized) {
    return contentLines.slice(0, maxLines);
  }
  const chunks = chunkText(normalized, 60);
  if (!contentLines.length) {
    return chunks.slice(0, maxLines);
  }
  const combined = [...contentLines];
  for (const chunk of chunks) {
    if (combined.length >= maxLines) {
      break;
    }
    if (combined[0] !== chunk) {
      combined.push(chunk);
    }
  }
  return combined.slice(0, maxLines);
}

function extractContentLines(text: string): string[] {
  const lines = text
    .split('\n')
    .map(part => part.trim())
    .filter(part => part.length > 0);
  const filtered: string[] = [];
  for (const line of lines) {
    if (line.startsWith('```')) {
      continue;
    }
    if (/^<\/?(html|head|body|meta|title|script|style|!doctype)\b/i.test(line)) {
      continue;
    }
    filtered.push(line);
  }
  return filtered;
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    const chunk = text.slice(i, i + size).trim();
    if (chunk) {
      chunks.push(chunk);
    }
  }
  return chunks;
}

async function resolveRecentChats(card: CardHubItem): Promise<Array<{ name: string; mes: string; file: string }>> {
  if (card.origin !== 'tavern') {
    return [];
  }
  const brief = await TavernHelper.getChatHistoryBrief(card.avatar ?? card.name, true);
  if (!Array.isArray(brief) || !brief.length) {
    return [];
  }
  return brief.slice(0, 3).map((entry: any) => ({
    name: entry?.file_name ?? entry?.file_id ?? '聊天记录',
    file: String(entry?.file_name ?? entry?.file_id ?? ''),
    mes: normalizeBriefMessage(String(entry?.mes ?? '')).slice(0, 120),
  }));
}

async function openLatestChat() {
  if (!manageChats.value.length) {
    toastr.warning('暂无聊天记录');
    return;
  }
  await openChat(manageChats.value[0]);
}

async function openChat(chat: { file: string }) {
  const file = chat.file;
  if (!file) {
    toastr.warning('未找到聊天文件');
    return;
  }
  let st: typeof SillyTavern | undefined;
  try {
    st = window.parent?.SillyTavern;
  } catch {
    st = undefined;
  }
  st ??= SillyTavern;
  const ctx = typeof st?.getContext === 'function' ? st.getContext() : null;
  const target = normalizeChatId(file);
  const list = ctx?.characters ?? st?.characters ?? [];
  const idx = manageCard.value && Array.isArray(list) ? findCharacterIndex(list, manageCard.value) : -1;
  const opener =
    (ctx && typeof ctx.openCharacterChat === 'function' ? ctx.openCharacterChat : null) ??
    (st && typeof st.openCharacterChat === 'function' ? st.openCharacterChat : null);
  if (!opener) {
    toastr.error('无法打开聊天：缺少接口');
    return;
  }
  if (idx < 0) {
    toastr.warning('未找到角色索引，请先手动切到该角色后再试');
    return;
  }
  if (typeof ctx?.getCharacters === 'function') {
    try {
      await ctx.getCharacters();
    } catch (error) {
      console.warn('[CardHub] 刷新角色列表失败', error);
    }
  }
  const selector =
    (ctx && typeof ctx.selectCharacterById === 'function' ? ctx.selectCharacterById : null) ??
    (st && typeof st.selectCharacterById === 'function' ? st.selectCharacterById : null);
  if (selector) {
    try {
      await selector(idx, { switchMenu: false });
    } catch (error) {
      console.warn('[CardHub] 切换角色失败', error);
    }
  } else {
    toastr.warning('无法切换角色，请先手动切到该角色后再试');
    return;
  }
  try {
    void Promise.resolve(opener(target)).catch(error => {
      console.warn('[CardHub] 打开聊天失败', error);
    });
  } catch (error) {
    console.warn('[CardHub] 打开聊天失败', error);
  }
  const opened = await waitForChatOpen(target, ctx, st, 6000);
  if (opened) {
    closeManage();
    closePreview();
    close();
    return;
  }
  toastr.warning('未能打开聊天，可能需要先手动切到该角色');
}

function findCharacterIndex(list: SillyTavern.v1CharData[], card: CardHubItem): number {
  if (card.avatar) {
    const byAvatar = list.findIndex(item => item.avatar === card.avatar || item.name === card.avatar);
    if (byAvatar >= 0) {
      return byAvatar;
    }
  }
  return list.findIndex(item => item.name === card.name);
}

function normalizeChatId(id: string): string {
  return id.endsWith('.jsonl') ? id : `${id}.jsonl`;
}

async function waitForChatOpen(
  file: string,
  ctx: any,
  st: typeof SillyTavern | undefined,
  timeoutMs: number,
): Promise<boolean> {
  const target = normalizeChatId(file);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = ctx?.chatId ?? st?.chatId;
    if (current === target) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return false;
}

async function manageDelete(card: CardHubItem) {
  if (card.origin === 'library') {
    if (!window.confirm(`确认永久删除「${card.name}」？此操作不可恢复。`)) {
      return;
    }
    setLibrary(removeFromLibrary(card.id));
    closeManage();
    return;
  }

  if (!window.confirm(`确定要删除「${card.name}」吗？`)) {
    return;
  }
  const moveToLibraryChoice = window.confirm(
    `删除「${card.name}」：\n点击“确定”=移到私有库\n点击“取消”=永久删除`,
  );
  if (moveToLibraryChoice) {
    await moveToLibrary(card);
    const deleted = await deleteFromTavern(card, false);
    if (!deleted) {
      return;
    }
    closeManage();
    const characters = await fetchCharacterSummaries();
    setCharacters(characters);
    return;
  }
  if (!window.confirm(`确认永久删除「${card.name}」？此操作不可恢复。`)) {
    return;
  }
  const deleted = await deleteFromTavern(card, true);
  if (!deleted) {
    return;
  }
  closeManage();
  const characters = await fetchCharacterSummaries();
  setCharacters(characters);
}

async function moveToLibrary(card: CardHubItem) {
  if (!card.avatar) {
    return;
  }
  const avatarPath = TavernHelper.getCharAvatarPath(card.avatar);
  if (!avatarPath) {
    toastr.error('无法导出：缺少头像信息');
    return;
  }
  const response = await fetch(avatarPath, { cache: 'no-cache' });
  const blob = await response.blob();
  const updated = await addToLibrary([
    new File([blob], `${card.name}.png`, { type: 'image/png' }),
  ]);
  setLibrary(updated);
}

async function deleteFromTavern(card: CardHubItem, deleteChats: boolean): Promise<boolean> {
  if (!card.avatar) {
    toastr.error('删除失败：缺少头像信息');
    return false;
  }
  let st: typeof SillyTavern | undefined;
  try {
    st = window.parent?.SillyTavern;
  } catch {
    st = undefined;
  }
  st ??= SillyTavern;
  const ctx = typeof st?.getContext === 'function' ? st.getContext() : null;
  const headers = (ctx?.getRequestHeaders ? ctx.getRequestHeaders() : st?.getRequestHeaders?.()) as
    | Record<string, string>
    | undefined;
  if (!headers || !Object.keys(headers).length) {
    toastr.error('删除失败：无法获取请求头');
    return false;
  }
  const payload = { avatar_url: card.avatar, delete_chats: deleteChats };
  const response = await fetch('/api/characters/delete', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-cache',
  });
  if (response.ok) {
    return true;
  }
  const detail = await response.text();
  toastr.error(`删除失败：${response.status} ${detail || response.statusText}`);
  return false;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}



async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return await response.blob();
}


async function refresh() {
  setLoading(true);
  try {
    const characters = await fetchCharacterSummaries();
    setCharacters(characters);
    setLibrary(loadLibrary());
  } finally {
    setLoading(false);
  }
}

function close() {
  setOpen(false);
}

</script>

<style scoped>
.cardhub-root {
  position: fixed;
  inset: 0;
  z-index: 9999;
  font-family: "ZCOOL XiaoWei", "STSong", "Songti SC", "SimSun", serif;
  color: #1b1b1b;
  display: none;
}

.cardhub-root.open {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cardhub-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top, rgba(255, 248, 236, 0.9), rgba(36, 30, 24, 0.85));
  backdrop-filter: blur(6px);
}

.cardhub-panel {
  position: relative;
  width: min(980px, 94%);
  max-height: 92%;
  background: linear-gradient(160deg, #fff9f0, #f3e4d4);
  border-radius: 28px;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.28);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1;
}

.cardhub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(86, 59, 44, 0.15);
}

.cardhub-title__main {
  font-size: 26px;
  letter-spacing: 2px;
}

.cardhub-title__sub {
  font-size: 12px;
  color: #7d5b46;
  margin-left: 10px;
}

.cardhub-actions {
  display: flex;
  gap: 10px;
}

.cardhub-close {
  border: none;
  background: rgba(43, 32, 24, 0.12);
  color: #3b2a20;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  font-size: 20px;
  line-height: 34px;
  text-align: center;
  cursor: pointer;
}

.cardhub-close:hover {
  background: rgba(43, 32, 24, 0.2);
}

.cardhub-toolbar {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  flex-wrap: wrap;
}

.cardhub-search {
  flex: 1;
  min-width: 180px;
  border-radius: 999px;
  border: 1px solid rgba(86, 59, 44, 0.2);
  padding: 8px 14px;
  background: #fffaf4;
}

.cardhub-button {
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  background: #d46b3d;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
}

.cardhub-button.is-ghost {
  background: transparent;
  color: #6a3f2a;
  border: 1px solid rgba(106, 63, 42, 0.4);
}

.cardhub-import-input {
  display: none;
}

.cardhub-body {
  display: grid;
  grid-template-columns: minmax(160px, 220px) 1fr;
  gap: 0;
  flex: 1;
  min-height: 0;
}

.cardhub-sidebar {
  padding: 20px;
  border-right: 1px solid rgba(86, 59, 44, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cardhub-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cardhub-section-title {
  font-size: 12px;
  color: #7d5b46;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.cardhub-chip {
  text-align: left;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 12px;
}

.cardhub-chip.is-active {
  background: #2b2018;
  color: #fff5ea;
}

.cardhub-placeholder {
  font-size: 12px;
  color: #9a7a63;
}

.cardhub-tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cardhub-tag-filter__chip {
  border: 1px solid rgba(106, 63, 42, 0.25);
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  color: #6a3f2a;
  cursor: pointer;
}

.cardhub-tag-filter__chip.is-active {
  background: #2b2018;
  color: #fff5ea;
  border-color: transparent;
}

.cardhub-chip--clear {
  margin-top: 8px;
}

.cardhub-content {
  padding: 20px;
  overflow: auto;
}

.cardhub-loading,
.cardhub-empty {
  padding: 40px 0;
  text-align: center;
  color: #7d5b46;
}

.cardhub-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.cardhub-card {
  background: rgba(255, 255, 255, 0.78);
  border-radius: 18px;
  padding: 14px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  border: 1px solid rgba(86, 59, 44, 0.15);
  cursor: pointer;
}

.cardhub-card__avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f4d7c4, #d36a3b);
  background-size: cover;
  background-position: center;
  color: #4a2a1f;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.cardhub-card__avatar.has-avatar span {
  display: none;
}

.cardhub-card__name {
  font-size: 14px;
  font-weight: 600;
}

.cardhub-card__meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #7d5b46;
}

.cardhub-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  align-items: center;
}

.cardhub-tag {
  border: 1px solid rgba(106, 63, 42, 0.3);
  background: #fff6ea;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 11px;
  color: #6a3f2a;
  cursor: pointer;
}

.cardhub-tag__remove {
  margin-left: 4px;
  font-weight: 700;
}

.cardhub-tag.is-add {
  background: transparent;
  border-style: dashed;
}

.cardhub-tag-input {
  border: 1px dashed rgba(106, 63, 42, 0.5);
  background: #fffaf4;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  min-width: 80px;
  color: #6a3f2a;
  outline: none;
  height: 24px;
  line-height: 16px;
}

.cardhub-tag-input:focus {
  border-color: rgba(106, 63, 42, 0.85);
}

.cardhub-card__action {
  grid-column: span 2;
  margin-top: 10px;
  border: none;
  background: #2b2018;
  color: #fff5ea;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
}

.cardhub-card__actions {
  grid-column: span 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
}

.cardhub-card__action.is-secondary {
  background: #d9c6b6;
  color: #3b2a20;
}

.cardhub-preview {
  position: fixed;
  inset: 0;
  background: rgba(24, 16, 10, 0.45);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 100000;
}

.cardhub-preview__panel {
  width: min(520px, 92vw);
  background: #fff6ea;
  border-radius: 26px;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.25);
  padding: 20px;
  position: relative;
  display: grid;
  gap: 14px;
}

.cardhub-preview__close {
  position: absolute;
  top: 14px;
  right: 14px;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: rgba(43, 32, 24, 0.15);
  color: #3b2a20;
  font-size: 18px;
  cursor: pointer;
}

.cardhub-preview__avatar {
  width: 100%;
  height: 260px;
  border-radius: 18px;
  background: #ead7c4;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.cardhub-preview__avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cardhub-preview__info {
  display: grid;
  gap: 6px;
}

.cardhub-preview__name {
  font-size: 20px;
  font-weight: 700;
}

.cardhub-preview__meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #7d5b46;
}

.cardhub-preview__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cardhub-preview__tag {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(106, 63, 42, 0.3);
  background: #fffaf4;
  font-size: 12px;
  color: #6a3f2a;
}

.cardhub-preview__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cardhub-manage {
  position: fixed;
  inset: 0;
  background: rgba(24, 16, 10, 0.45);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 100001;
}

.cardhub-manage__panel {
  width: min(760px, 94vw);
  max-height: 88vh;
  background: #fff6ea;
  border-radius: 26px;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.25);
  padding: 22px;
  position: relative;
  display: grid;
  gap: 16px;
  overflow: auto;
}

.cardhub-manage__top {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: start;
}

.cardhub-manage__media {
  width: 220px;
  aspect-ratio: 3 / 4;
  height: auto;
  border-radius: 18px;
  background: #ead7c4;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.cardhub-manage__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cardhub-manage__summary {
  display: grid;
  gap: 6px;
}

.cardhub-manage__section {
  display: grid;
  gap: 8px;
}

.cardhub-manage__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: #7d5b46;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.cardhub-manage__jump {
  border: 1px solid rgba(106, 63, 42, 0.35);
  background: transparent;
  color: #6a3f2a;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  text-transform: none;
}

.cardhub-manage__jump:hover {
  background: rgba(106, 63, 42, 0.1);
}

.cardhub-manage__content {
  background: #fffaf4;
  border: 1px solid rgba(106, 63, 42, 0.2);
  border-radius: 16px;
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.5;
  color: #3b2a20;
  white-space: pre-wrap;
}

.cardhub-manage__opening {
  padding: 6px 0;
  border-bottom: 1px dashed rgba(106, 63, 42, 0.2);
}

.cardhub-manage__opening:last-child {
  border-bottom: none;
}

.cardhub-manage__chat {
  display: grid;
  gap: 10px;
}

.cardhub-manage__chat-row {
  display: grid;
  grid-template-columns: minmax(140px, 220px) 1fr;
  gap: 12px;
  font-size: 12px;
  color: #3b2a20;
  align-items: start;
  padding: 6px 8px;
  border-radius: 10px;
  cursor: pointer;
}

.cardhub-manage__chat-row:hover {
  background: rgba(106, 63, 42, 0.08);
}

.cardhub-manage__chat-name {
  flex: 0 0 auto;
  font-weight: 600;
  color: #6a3f2a;
  word-break: break-word;
}

.cardhub-manage__chat-text {
  color: #3b2a20;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cardhub-manage__empty {
  font-size: 12px;
  color: #9a7a63;
}

.cardhub-manage__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 720px) {

  .cardhub-body {
    grid-template-columns: 1fr;
  }

  .cardhub-sidebar {
    flex-direction: column;
    border-right: none;
    border-bottom: 1px solid rgba(86, 59, 44, 0.15);
    gap: 8px;
  }

  .cardhub-chip-row,
  .cardhub-tag-filter {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .cardhub-chip-row::-webkit-scrollbar,
  .cardhub-tag-filter::-webkit-scrollbar {
    height: 6px;
  }

  .cardhub-chip-row::-webkit-scrollbar-thumb,
  .cardhub-tag-filter::-webkit-scrollbar-thumb {
    background: rgba(106, 63, 42, 0.2);
    border-radius: 999px;
  }

  .cardhub-panel {
    width: min(98vw, 520px);
    max-height: 96vh;
  }

  .cardhub-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 14px;
  }

  .cardhub-toolbar {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 8px;
    padding: 10px 14px 12px;
  }

  .cardhub-search {
    width: 100%;
    grid-column: 1 / -1;
  }

  .cardhub-button {
    width: 100%;
  }

  .cardhub-button.is-ghost {
    grid-column: span 1;
  }

  .cardhub-tag-filter__chip,
  .cardhub-tag {
    font-size: 10px;
    padding: 4px 8px;
  }

  .cardhub-card {
    grid-template-columns: 1fr;
  }

  .cardhub-card__action {
    grid-column: auto;
  }
  .cardhub-manage__panel {
    width: min(96vw, 560px);
    max-height: 90vh;
  }

  .cardhub-manage__top {
    grid-template-columns: 1fr;
  }

  .cardhub-manage__actions {
    grid-template-columns: 1fr;
  }
}
</style>





























