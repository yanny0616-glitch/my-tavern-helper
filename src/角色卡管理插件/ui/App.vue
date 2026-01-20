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
        <input v-model="state.search" class="cardhub-search" type="search" placeholder="搜索角色名或标签" />
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
          <div class="cardhub-divider" />
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
          <div v-else-if="!filteredCharacters.length" class="cardhub-empty">暂无角色卡，或没有匹配的搜索结果。</div>
          <div v-else class="cardhub-grid-wrap">
            <div class="cardhub-pagination">
              <div v-if="totalPages > 1" class="cardhub-pagination__actions">
                <button class="cardhub-pagination__button" type="button" :disabled="currentPage <= 1" @click="prevPage">
                  上一页
                </button>
                <button
                  class="cardhub-pagination__button"
                  type="button"
                  :disabled="currentPage >= totalPages"
                  @click="nextPage"
                >
                  下一页
                </button>
              </div>
              <span class="cardhub-pagination__status">第 {{ currentPage }} / {{ totalPages }} 页</span>
            </div>
            <div class="cardhub-grid">
              <article
                v-for="character in pagedCharacters"
                :key="character.id"
                class="cardhub-card"
                @click="openManage(character)"
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
                      @click.stop="removeTag(character, tag)"
                    >
                      {{ tag }}
                      <span class="cardhub-tag__remove">×</span>
                    </button>
                    <button
                      v-if="activeTagKey !== tagKey(character)"
                      class="cardhub-tag is-add"
                      type="button"
                      @click.stop="startTagEdit(character)"
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
                      @click.stop
                      @mousedown.stop
                      @touchstart.stop
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
      </div>
    </section>

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
            <div class="cardhub-manage__overview">
              <div v-for="item in manageOverview" :key="item.label" class="cardhub-manage__overview-card">
                <div class="cardhub-manage__overview-label">{{ item.label }}</div>
                <div class="cardhub-manage__overview-value">{{ item.value }}</div>
                <div v-if="item.hint" class="cardhub-manage__overview-hint">{{ item.hint }}</div>
              </div>
            </div>
          </div>
          <div class="cardhub-manage__media">
            <img v-if="manageAvatarUrl" :src="manageAvatarUrl" alt="" />
          </div>
        </div>
        <div class="cardhub-manage__section">
          <div class="cardhub-manage__label">角色卡预览</div>
          <div v-if="manageDetails.length" class="cardhub-manage__details">
            <div v-for="detail in manageDetails" :key="detail.label" class="cardhub-manage__detail">
              <div class="cardhub-manage__detail-label">{{ detail.label }}</div>
              <div class="cardhub-manage__detail-content">{{ detail.value }}</div>
            </div>
          </div>
          <div v-else class="cardhub-manage__empty">{{ manageDetailsHint }}</div>
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
            <div class="cardhub-manage__jump-row">
              <button
                class="cardhub-manage__btn is-primary"
                type="button"
                @click="openLatestChat"
                @pointerdown.stop
                @mousedown.stop
                @touchstart.stop
              >
                进入最近聊天
              </button>
              <button
                class="cardhub-manage__btn is-secondary"
                type="button"
                @click="openNewChat"
                @pointerdown.stop
                @mousedown.stop
                @touchstart.stop
              >
                新聊天
              </button>
            </div>
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
              <div class="cardhub-manage__chat-main">
                <div class="cardhub-manage__chat-name">{{ msg.name }}</div>
                <div v-if="msg.label && msg.label !== msg.name" class="cardhub-manage__chat-label">
                  {{ msg.label }}
                </div>
                <div v-if="msg.keywords.length" class="cardhub-manage__chat-tags">
                  <span v-for="keyword in msg.keywords" :key="keyword" class="cardhub-manage__chat-tag">
                    {{ keyword }}
                  </span>
                </div>
              </div>
              <span class="cardhub-manage__chat-text">{{ msg.mes }}</span>
            </div>
          </div>
          <div v-else class="cardhub-manage__empty">{{ manageChatHint }}</div>
        </div>
        <div class="cardhub-manage__actions">
          <button
            class="cardhub-manage__btn is-secondary"
            type="button"
            @click.stop="handleCardAction(manageCard)"
            @pointerdown.stop
            @mousedown.stop
            @touchstart.stop
          >
            {{ manageCard.origin === 'tavern' ? '导出' : '导入' }}
          </button>
          <button
            class="cardhub-manage__btn is-primary"
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

    <div v-if="confirmState.open" class="cardhub-confirm" @click.self="resolveConfirm('cancel')">
      <div class="cardhub-confirm__panel" role="dialog" aria-modal="true">
        <div class="cardhub-confirm__title">{{ confirmState.title }}</div>
        <div class="cardhub-confirm__message">{{ confirmState.message }}</div>
        <div class="cardhub-confirm__actions">
          <button class="cardhub-confirm__button is-cancel" type="button" @click="resolveConfirm('cancel')">
            {{ confirmState.cancelLabel }}
          </button>
          <button
            v-if="confirmState.altLabel"
            class="cardhub-confirm__button is-danger"
            type="button"
            @click="resolveConfirm('alt')"
          >
            {{ confirmState.altLabel }}
          </button>
          <button class="cardhub-confirm__button is-confirm" type="button" @click="resolveConfirm('confirm')">
            {{ confirmState.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
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
const pageSize = ref(24);
const currentPage = ref(1);
const importInput = ref<HTMLInputElement | null>(null);
const manageCard = ref<CardHubItem | null>(null);
const manageOpenings = ref<string[]>([]);
type ManageChatEntry = {
  name: string;
  label?: string;
  mes: string;
  file: string;
  keywords: string[];
};

const manageChats = ref<ManageChatEntry[]>([]);
const manageOpeningLines = computed(() => previewOpenings(manageOpenings.value, 3));
let manageRequestId = 0;
type ManageDetail = {
  label: string;
  value: string;
};
type ManageProfile = {
  description?: string;
  personality?: string;
  scenario?: string;
  creatorNotes?: string;
  systemPrompt?: string;
  postHistory?: string;
  creator?: string;
  worldBookName?: string;
  worldBookCount?: number;
};
type ManageOpeningSummary = {
  total: number;
  alternate: number;
};
type ManageChatSummary = {
  total: number;
  latest: string;
};
type ManageChatData = {
  list: ManageChatEntry[];
  summary: ManageChatSummary | null;
};
type ManageOverviewItem = {
  label: string;
  value: string;
  hint?: string;
};
type ManageData = {
  openings: string[];
  profile: ManageProfile | null;
  openingSummary: ManageOpeningSummary | null;
};
type ConfirmResult = 'confirm' | 'cancel' | 'alt';
type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  altLabel?: string;
};

const confirmState = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: '确定',
  cancelLabel: '取消',
  altLabel: '',
  resolve: null as null | ((result: ConfirmResult) => void),
});

const allCards = computed(() => [...state.characters, ...state.library]);
const manageProfile = ref<ManageProfile | null>(null);
const manageOpeningSummary = ref<ManageOpeningSummary | null>(null);
const manageChatSummary = ref<ManageChatSummary | null>(null);
const manageDetails = computed(() => {
  const profile = manageProfile.value;
  if (!profile) {
    return [] as ManageDetail[];
  }
  const details: ManageDetail[] = [];
  const pushDetail = (label: string, value: string, maxChars = 240) => {
    const preview = previewDetailText(value, 3, maxChars);
    if (preview) {
      details.push({ label, value: preview });
    }
  };
  pushDetail('角色描述', profile.description ?? '');
  pushDetail('性格', profile.personality ?? '');
  pushDetail('场景', profile.scenario ?? '');
  pushDetail('创作者备注', profile.creatorNotes ?? '');
  pushDetail('系统提示', profile.systemPrompt ?? '', 200);
  pushDetail('历史指令', profile.postHistory ?? '', 200);
  pushDetail('作者', profile.creator ?? '', 80);
  return details;
});

const manageDetailsHint = computed(() => {
  if (!manageCard.value || manageDetails.value.length) {
    return '';
  }
  if (manageCard.value.origin === 'library') {
    return '未导入卡片暂无可预览内容，可先导入后查看详情。';
  }
  return '暂无角色卡详情。';
});

const manageChatHint = computed(() => {
  if (manageCard.value?.origin === 'library') {
    return '未导入卡片暂无聊天记录。';
  }
  return '暂无聊天记录。';
});
const manageOverview = computed(() => {
  const items: ManageOverviewItem[] = [];
  const profile = manageProfile.value;
  const worldName = profile?.worldBookName?.trim() || '';
  const worldCount = profile?.worldBookCount;
  let worldValue = '未绑定';
  let worldHint = '';
  if (worldName || typeof worldCount === 'number') {
    worldValue = worldName || '角色世界书';
    worldHint = typeof worldCount === 'number' ? `${worldCount} 条` : '';
  }
  items.push({ label: '世界书', value: worldValue, hint: worldHint });

  const chat = manageChatSummary.value;
  let chatValue = '暂无聊天';
  let chatHint = '';
  if (chat && chat.total > 0) {
    chatValue = `${chat.total} 个聊天`;
    if (chat.latest) {
      chatHint = `最近：${chat.latest}`;
    }
  }
  items.push({ label: '聊天概况', value: chatValue, hint: chatHint });

  const opening = manageOpeningSummary.value;
  let openingValue = '暂无开场白';
  let openingHint = '';
  if (opening && opening.total > 0) {
    openingValue = `${opening.total} 条`;
    openingHint = opening.alternate > 0 ? `替代：${opening.alternate} 条` : '无替代';
  }
  items.push({ label: '开场白', value: openingValue, hint: openingHint });
  return items;
});

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

const totalPages = computed(() => {
  const total = Math.ceil(filteredCharacters.value.length / pageSize.value);
  return total > 0 ? total : 1;
});

const pagedCharacters = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredCharacters.value.slice(start, start + pageSize.value);
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
  return list.filter(character => selectedTags.value.some(tag => getMergedTags(character).includes(tag)));
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

watch([() => state.search, statusFilter, () => selectedTags.value.join('|')], () => {
  currentPage.value = 1;
});

watch([filteredCharacters, totalPages], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
  if (currentPage.value < 1) {
    currentPage.value = 1;
  }
});

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1;
  }
}

function normalizeNameKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function findDuplicateCharacterByName(name: string): CardHubItem | null {
  const target = normalizeNameKey(name);
  if (!target) {
    return null;
  }
  return state.characters.find(item => normalizeNameKey(item.name) === target) ?? null;
}

function openConfirm(options: ConfirmOptions): Promise<ConfirmResult> {
  if (confirmState.open && confirmState.resolve) {
    confirmState.resolve('cancel');
  }
  confirmState.title = options.title ?? '确认操作';
  confirmState.message = options.message;
  confirmState.confirmLabel = options.confirmLabel ?? '确定';
  confirmState.cancelLabel = options.cancelLabel ?? '取消';
  confirmState.altLabel = options.altLabel ?? '';
  confirmState.open = true;

  return new Promise(resolve => {
    confirmState.resolve = resolve;
  });
}

function resolveConfirm(result: ConfirmResult) {
  if (!confirmState.open) {
    return;
  }
  confirmState.open = false;
  const resolver = confirmState.resolve;
  confirmState.resolve = null;
  if (resolver) {
    resolver(result);
  }
}

function removeTag(character: CardHubItem, tag: string) {
  const nextTags = getMergedTags(character).filter(item => item !== tag);
  applyTagUpdate(character, nextTags);
}

function tagKey(character: CardHubItem): string {
  return character.id;
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
  const updated = await addToLibrary(files, state.library);
  setLibrary(updated);
  target.value = '';
}

async function exportSelected() {
  const list = filteredCharacters.value;
  if (!list.length) {
    toastr.warning('当前没有可导出的角色卡');
    return;
  }
  const tagLabel = selectedTags.value.length ? selectedTags.value.join('、') : '无';
  const statusLabel = statusFilter.value === 'all' ? '全部' : statusFilter.value === 'imported' ? '已导入' : '未导入';
  const searchLabel = state.search.trim() || '无';
  const message =
    `将导出 ${list.length} 张角色卡。\n` +
    `筛选状态：${statusLabel}\n` +
    `筛选标签：${tagLabel}\n` +
    `搜索关键字：${searchLabel}\n` +
    `是否继续？`;

  const result = await openConfirm({
    title: '批量导出',
    message,
    confirmLabel: '继续导出',
    cancelLabel: '取消',
  });
  if (result !== 'confirm') {
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
  const duplicate = findDuplicateCharacterByName(card.name);
  if (duplicate) {
    toastr.warning(`已存在同名角色「${duplicate.name}」，已跳过导入`);
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
  const requestId = ++manageRequestId;
  manageCard.value = card;
  manageOpenings.value = [];
  manageChats.value = [];
  manageProfile.value = null;
  manageOpeningSummary.value = null;
  manageChatSummary.value = null;

  const [manageResult, chatsResult] = await Promise.allSettled([resolveManageData(card), resolveRecentChats(card)]);

  if (requestId !== manageRequestId || manageCard.value?.id !== card.id) {
    return;
  }

  const manageData: ManageData =
    manageResult.status === 'fulfilled' ? manageResult.value : { openings: [], profile: null, openingSummary: null };
  manageOpenings.value = manageData.openings;
  manageProfile.value = manageData.profile;
  manageOpeningSummary.value = manageData.openingSummary;

  const chatData: ManageChatData = chatsResult.status === 'fulfilled' ? chatsResult.value : { list: [], summary: null };
  manageChats.value = chatData.list;
  manageChatSummary.value = chatData.summary;
}

function closeManage() {
  manageCard.value = null;
  manageOpenings.value = [];
  manageChats.value = [];
  manageProfile.value = null;
  manageOpeningSummary.value = null;
  manageChatSummary.value = null;
}

async function resolveManageData(card: CardHubItem): Promise<ManageData> {
  if (card.origin !== 'tavern') {
    const data = parseLibraryCardData(card);
    return {
      openings: extractOpeningMessages(data),
      profile: extractCardProfile(data),
      openingSummary: extractOpeningSummary(data),
    };
  }
  const raw = await getFullCharacterData(card);
  const fallback =
    raw ??
    TavernHelper.RawCharacter?.find({ name: card.avatar ?? card.name, allowAvatar: true } as any) ??
    TavernHelper.RawCharacter?.find({ name: card.name, allowAvatar: true } as any);
  const primary = raw ?? fallback;
  let openings = extractOpeningMessages(primary);
  if (!openings.length && fallback && fallback !== primary) {
    openings = extractOpeningMessages(fallback);
  }
  const openingSummary = extractOpeningSummary(primary ?? fallback);
  return {
    openings,
    profile: extractCardProfile(primary ?? fallback),
    openingSummary,
  };
}

function parseLibraryCardData(card: CardHubItem): any | null {
  if (!card.raw || !card.rawType) {
    return null;
  }
  if (card.rawType === 'json') {
    return parseJsonSafe(card.raw);
  }
  if (card.rawType === 'png') {
    return parsePngCardData(card.raw);
  }
  return null;
}

function parseJsonSafe(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parsePngCardData(dataUrl: string): any | null {
  const bytes = dataUrlToBytes(dataUrl);
  if (!bytes) {
    return null;
  }
  const chunks = extractPngTextChunks(bytes);
  const allowedKeys = new Set(['chara', 'character', 'tavern', 'tavern_character', 'card']);
  for (const chunk of chunks) {
    if (chunk.key && !allowedKeys.has(chunk.key.toLowerCase())) {
      continue;
    }
    const parsed = parseCardPayload(chunk.value);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) {
    return null;
  }
  const base64 = dataUrl.slice(comma + 1);
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function extractPngTextChunks(bytes: Uint8Array): Array<{ key: string; value: string }> {
  if (bytes.length < 8) {
    return [];
  }
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) {
      return [];
    }
  }
  const chunks: Array<{ key: string; value: string }> = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    const type = bytesToString(bytes.subarray(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) {
      break;
    }
    const data = bytes.subarray(dataStart, dataEnd);
    if (type === 'tEXt') {
      const entry = parseTextChunk(data);
      if (entry) {
        chunks.push(entry);
      }
    } else if (type === 'iTXt') {
      const entry = parseIntlTextChunk(data);
      if (entry) {
        chunks.push(entry);
      }
    }
    offset = dataEnd + 4;
  }
  return chunks;
}

function parseTextChunk(data: Uint8Array): { key: string; value: string } | null {
  const nullIndex = data.indexOf(0);
  if (nullIndex < 0) {
    return null;
  }
  const key = bytesToString(data.subarray(0, nullIndex)).trim();
  const value = bytesToString(data.subarray(nullIndex + 1)).trim();
  if (!key || !value) {
    return null;
  }
  return { key, value };
}

function parseIntlTextChunk(data: Uint8Array): { key: string; value: string } | null {
  const nullIndex = data.indexOf(0);
  if (nullIndex < 0 || nullIndex + 2 >= data.length) {
    return null;
  }
  const key = bytesToString(data.subarray(0, nullIndex)).trim();
  const compressed = data[nullIndex + 1] === 1;
  let cursor = nullIndex + 2;
  const langEnd = data.indexOf(0, cursor);
  if (langEnd < 0) {
    return null;
  }
  cursor = langEnd + 1;
  const translatedEnd = data.indexOf(0, cursor);
  if (translatedEnd < 0) {
    return null;
  }
  cursor = translatedEnd + 1;
  if (compressed) {
    return null;
  }
  const value = bytesToString(data.subarray(cursor)).trim();
  if (!key || !value) {
    return null;
  }
  return { key, value };
}

function parseCardPayload(value: string): any | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const direct = parseJsonSafe(trimmed);
  if (direct) {
    return direct;
  }
  if (!isLikelyBase64(trimmed)) {
    return null;
  }
  const decoded = decodeBase64Text(trimmed);
  if (!decoded) {
    return null;
  }
  return parseJsonSafe(decoded);
}

function decodeBase64Text(value: string): string | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function isLikelyBase64(value: string): boolean {
  if (value.length < 16 || value.length % 4 !== 0) {
    return false;
  }
  return /^[A-Za-z0-9+/=]+$/.test(value);
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
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
  const byAvatar = card.avatar ? list.findIndex(item => item.avatar === card.avatar || item.name === card.avatar) : -1;
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

function extractCardProfile(data: any): ManageProfile | null {
  if (!data) {
    return null;
  }
  const profile: ManageProfile = {
    description: pickString(data?.description, data?.data?.description),
    personality: pickString(data?.personality, data?.data?.personality),
    scenario: pickString(data?.scenario, data?.data?.scenario),
    creatorNotes: pickString(
      data?.creatorcomment,
      data?.data?.creatorcomment,
      data?.creator_notes,
      data?.data?.creator_notes,
    ),
    systemPrompt: pickString(data?.system_prompt, data?.data?.system_prompt),
    postHistory: pickString(data?.post_history_instructions, data?.data?.post_history_instructions),
    creator: pickString(data?.creator, data?.data?.creator),
  };
  const book = data?.character_book ?? data?.data?.character_book;
  if (book) {
    profile.worldBookName = pickString(book?.name);
    profile.worldBookCount = Array.isArray(book?.entries) ? book.entries.length : undefined;
  }
  const hasValue =
    Boolean(profile.description) ||
    Boolean(profile.personality) ||
    Boolean(profile.scenario) ||
    Boolean(profile.creatorNotes) ||
    Boolean(profile.systemPrompt) ||
    Boolean(profile.postHistory) ||
    Boolean(profile.creator) ||
    Boolean(profile.worldBookName) ||
    typeof profile.worldBookCount === 'number';
  return hasValue ? profile : null;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return '';
}

function extractOpeningSummary(data: any): ManageOpeningSummary | null {
  if (!data) {
    return null;
  }
  const first = typeof data?.first_mes === 'string' ? data.first_mes : data?.data?.first_mes;
  const firstCount = typeof first === 'string' && first.trim() ? 1 : 0;
  const alt =
    data?.alternate_greetings ??
    data?.data?.alternate_greetings ??
    data?.extensions?.alternate_greetings ??
    data?.data?.extensions?.alternate_greetings;
  let alternate = 0;
  if (Array.isArray(alt)) {
    alternate = alt.filter(item => typeof item === 'string' && item.trim()).length;
  } else if (typeof alt === 'string' && alt.trim()) {
    alternate = 1;
  }
  return {
    total: firstCount + alternate,
    alternate,
  };
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

function formatMaybeTimestamp(value: unknown): string {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms).toLocaleString('zh-CN', { hour12: false });
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

function extractChatLatestLabel(entry: any): string {
  const candidates = [
    entry?.last_message_time,
    entry?.last_message_date,
    entry?.update_time,
    entry?.last_modified,
    entry?.create_date,
    entry?.timestamp,
    entry?.time,
  ];
  for (const value of candidates) {
    const label = formatMaybeTimestamp(value);
    if (label) {
      return label;
    }
  }
  const fallback = pickString(entry?.file_name, entry?.file_id);
  if (!fallback) {
    return '';
  }
  return fallback.replace(/\.jsonl$/i, '');
}

function formatChatTitle(entry: any): string {
  const label = extractChatLatestLabel(entry);
  return label || '聊天记录';
}

function formatChatFileLabel(entry: any): string {
  const raw = pickString(entry?.file_name, entry?.file_id);
  if (!raw) {
    return '';
  }
  return raw.replace(/\.jsonl$/i, '');
}

function extractChatKeywords(value: string, max = 3): string[] {
  const normalized = normalizeBriefMessage(value);
  if (!normalized) {
    return [];
  }
  const keywords = new Set<string>();
  const stopWords = new Set([
    'the',
    'and',
    'you',
    'your',
    'are',
    'this',
    'that',
    'with',
    'have',
    'not',
    'for',
    'from',
    'what',
    'why',
    'when',
    'where',
    'then',
    'into',
    'out',
    'here',
    'there',
    '这个',
    '那个',
    '我们',
    '你们',
    '他们',
    '她们',
    '因为',
    '但是',
    '然后',
    '如果',
    '可以',
    '没有',
    '不是',
    '已经',
    '现在',
    '一个',
    '一些',
    '还有',
    '所以',
    '这种',
  ]);
  const bracketMatches = normalized.match(/\[[^\]]{2,16}\]/g) ?? [];
  for (const match of bracketMatches) {
    const cleaned = match.slice(1, -1).trim();
    if (cleaned) {
      keywords.add(cleaned);
    }
    if (keywords.size >= max) {
      return Array.from(keywords).slice(0, max);
    }
  }
  const wordMatches = normalized.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z0-9]{3,}/g) ?? [];
  for (const word of wordMatches) {
    const lower = word.toLowerCase();
    if (stopWords.has(word) || stopWords.has(lower)) {
      continue;
    }
    keywords.add(word);
    if (keywords.size >= max) {
      break;
    }
  }
  return Array.from(keywords).slice(0, max);
}

function previewDetailText(text: string, maxLines: number, maxChars: number): string {
  const trimmed = text.replace(/\r/g, '').trim();
  if (!trimmed) {
    return '';
  }
  const lines = extractContentLines(trimmed);
  const source = lines.length ? lines : chunkText(normalizeBriefMessage(trimmed), 60);
  let preview = source.slice(0, maxLines).join('\n').trim();
  if (!preview) {
    return '';
  }
  const truncated = preview.length > maxChars;
  if (truncated) {
    preview = preview.slice(0, maxChars).trim();
  }
  const hasMore = truncated || source.length > maxLines || trimmed.length > preview.length;
  if (hasMore && !preview.endsWith('…')) {
    preview = `${preview}…`;
  }
  return preview;
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

async function resolveRecentChats(card: CardHubItem): Promise<ManageChatData> {
  if (card.origin !== 'tavern') {
    return { list: [], summary: null };
  }
  const brief = await TavernHelper.getChatHistoryBrief(card.avatar ?? card.name, true);
  if (!Array.isArray(brief) || !brief.length) {
    return { list: [], summary: { total: 0, latest: '' } };
  }
  const list = brief.slice(0, 3).map((entry: any) => ({
    name: formatChatTitle(entry),
    label: formatChatFileLabel(entry),
    file: String(entry?.file_name ?? entry?.file_id ?? ''),
    mes: normalizeBriefMessage(String(entry?.mes ?? '')).slice(0, 120),
    keywords: extractChatKeywords(String(entry?.mes ?? '')),
  }));
  const latest = extractChatLatestLabel(brief[0]);
  return {
    list,
    summary: {
      total: brief.length,
      latest,
    },
  };
}

async function openLatestChat() {
  if (!manageChats.value.length) {
    toastr.warning('暂无聊天记录');
    return;
  }
  await openChat(manageChats.value[0]);
}

async function openNewChat() {
  const selection = await selectManageCharacter({ ensureSelected: true });
  if (!selection) {
    return;
  }
  try {
    await triggerSlash('/newchat');
    closeManage();
    close();
  } catch (error) {
    console.warn('[CardHub] 新聊天失败', error);
    toastr.error('无法创建新聊天');
  }
}

async function openChat(chat: { file: string }) {
  const file = chat.file;
  if (!file) {
    toastr.warning('未找到聊天文件');
    return;
  }
  const selection = await selectManageCharacter({ ensureSelected: true });
  if (!selection) {
    return;
  }
  const { ctx, st } = selection;
  const target = normalizeChatId(file);
  const opener =
    (ctx && typeof ctx.openCharacterChat === 'function' ? ctx.openCharacterChat : null) ??
    (st && typeof st.openCharacterChat === 'function' ? st.openCharacterChat : null);
  if (!opener) {
    toastr.error('无法打开聊天：缺少接口');
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
    close();
    return;
  }
  toastr.warning('未能打开聊天，可能需要先手动切到该角色');
}

async function selectManageCharacter(
  options: { ensureSelected?: boolean } = {},
): Promise<{ ctx: any; st: typeof SillyTavern | undefined; idx: number } | null> {
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
      console.warn('[CardHub] 刷新角色列表失败', error);
    }
  }
  const list = ctx?.characters ?? st?.characters ?? [];
  const idx = manageCard.value && Array.isArray(list) ? findCharacterIndex(list, manageCard.value) : -1;
  if (idx < 0) {
    toastr.warning('未找到角色索引，请先手动切到该角色后再试');
    return null;
  }
  const selector =
    (ctx && typeof ctx.selectCharacterById === 'function' ? ctx.selectCharacterById : null) ??
    (st && typeof st.selectCharacterById === 'function' ? st.selectCharacterById : null);
  if (!selector) {
    toastr.warning('无法切换角色，请先手动切到该角色后再试');
    return null;
  }
  try {
    await selector(idx, { switchMenu: false });
  } catch (error) {
    console.warn('[CardHub] 切换角色失败', error);
  }
  const selected = await waitForCharacterSelection(idx, ctx, st, 3000);
  if (options.ensureSelected && !selected) {
    toastr.warning('角色切换未完成，请稍后再试');
    return null;
  }
  return { ctx, st, idx };
}

async function waitForCharacterSelection(
  idx: number,
  ctx: any,
  st: typeof SillyTavern | undefined,
  timeoutMs: number,
): Promise<boolean> {
  const target = String(idx);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = getCurrentCharacterId(ctx, st);
    if (current === target) {
      return true;
    }
    await sleep(80);
  }
  return false;
}

function getCurrentCharacterId(ctx: any, st: typeof SillyTavern | undefined): string {
  const value = ctx?.characterId ?? st?.characterId ?? '';
  return value === undefined || value === null ? '' : String(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    const confirmDelete = await openConfirm({
      title: '删除角色',
      message: `确认永久删除「${card.name}」？此操作不可恢复。`,
      confirmLabel: '删除',
      cancelLabel: '取消',
    });
    if (confirmDelete !== 'confirm') {
      return;
    }
    setLibrary(removeFromLibrary(card.id));
    closeManage();
    return;
  }

  const confirmDelete = await openConfirm({
    title: '删除角色',
    message: `确定要删除「${card.name}」吗？`,
    confirmLabel: '继续',
    cancelLabel: '取消',
  });
  if (confirmDelete !== 'confirm') {
    return;
  }
  const deleteChoice = await openConfirm({
    title: '删除方式',
    message: `删除「${card.name}」：\n` + `- 移到私有库：可在私有库中找回\n` + `- 永久删除：不可恢复`,
    confirmLabel: '移到私有库',
    altLabel: '永久删除',
    cancelLabel: '取消',
  });
  if (deleteChoice === 'cancel') {
    return;
  }
  if (deleteChoice === 'confirm') {
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
  const confirmPermanent = await openConfirm({
    title: '永久删除',
    message: `确认永久删除「${card.name}」？此操作不可恢复。`,
    confirmLabel: '永久删除',
    cancelLabel: '取消',
  });
  if (confirmPermanent !== 'confirm') {
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
  const updated = await addToLibrary([new File([blob], `${card.name}.png`, { type: 'image/png' })]);
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
  font-family: 'ZCOOL XiaoWei', 'STSong', 'Songti SC', 'SimSun', serif;
  color: #1b1b1b;
  display: none;
  align-items: center;
  justify-content: center;
}

.cardhub-root.open {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cardhub-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  opacity: 0;
  transition: opacity 180ms ease;
}

.cardhub-root.open .cardhub-backdrop {
  opacity: 1;
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
  opacity: 0;
  transform: translateY(8px) scale(0.985);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.cardhub-root.open .cardhub-panel {
  opacity: 1;
  transform: translateY(0) scale(1);
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
  transition:
    background-color 160ms ease,
    transform 120ms ease;
}

.cardhub-close:hover {
  background: rgba(43, 32, 24, 0.2);
}

.cardhub-close:active {
  transform: scale(0.96);
}

.cardhub-toolbar {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  flex-wrap: wrap;
}

.cardhub-search {
  flex: 1;
  min-width: 180px;
  border-radius: 999px;
  border: 1px solid rgba(86, 59, 44, 0.2);
  padding: 6px 12px;
  background: #fffaf4;
}

.cardhub-button {
  border: none;
  padding: 6px 14px;
  border-radius: 999px;
  background: #d46b3d;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  transition:
    background-color 160ms ease,
    transform 120ms ease,
    box-shadow 160ms ease;
}

.cardhub-button:hover {
  background: #c55f36;
  box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
}

.cardhub-button:active {
  transform: translateY(1px);
}

.cardhub-button.is-ghost {
  background: transparent;
  color: #6a3f2a;
  border: 1px solid rgba(106, 63, 42, 0.4);
}

.cardhub-button.is-ghost:hover {
  background: rgba(106, 63, 42, 0.08);
  border-color: rgba(106, 63, 42, 0.6);
  box-shadow: none;
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

.cardhub-divider {
  height: 1px;
  width: 100%;
  background: rgba(86, 59, 44, 0.15);
  margin: 8px 0;
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
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 120ms ease;
}

.cardhub-chip.is-active {
  background: #2b2018;
  color: #fff5ea;
}

.cardhub-chip:not(.is-active):hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
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
  transition:
    background-color 160ms ease,
    color 160ms ease,
    border-color 160ms ease,
    transform 120ms ease;
}

.cardhub-tag-filter__chip.is-active {
  background: #2b2018;
  color: #fff5ea;
  border-color: transparent;
}

.cardhub-tag-filter__chip:not(.is-active):hover {
  border-color: rgba(106, 63, 42, 0.45);
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.cardhub-chip--clear {
  margin-top: 8px;
}

.cardhub-content {
  padding: 20px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.cardhub-grid-wrap {
  display: grid;
  gap: 12px;
}

.cardhub-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.cardhub-pagination__status {
  font-size: 12px;
  color: #7d5b46;
}

.cardhub-pagination__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-right: auto;
}

.cardhub-pagination__button {
  border: 1px solid rgba(106, 63, 42, 0.35);
  background: rgba(255, 255, 255, 0.85);
  color: #6a3f2a;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    transform 120ms ease;
}

.cardhub-pagination__button:disabled {
  opacity: 0.4;
  cursor: default;
}

.cardhub-pagination__button:not(:disabled):hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(106, 63, 42, 0.6);
  transform: translateY(-1px);
}

.cardhub-pagination__button:not(:disabled):active {
  transform: translateY(0);
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
  justify-items: center;
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
  transition:
    transform 140ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
  width: 100%;
  max-width: 260px;
}

.cardhub-card:hover {
  transform: translateY(-2px);
  border-color: rgba(86, 59, 44, 0.25);
  box-shadow: 0 12px 26px rgba(43, 32, 24, 0.16);
}

.cardhub-card:active {
  transform: translateY(0);
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
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    transform 120ms ease;
}

.cardhub-tag:hover {
  background: #fffaf4;
  border-color: rgba(106, 63, 42, 0.5);
  transform: translateY(-1px);
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
  transition:
    transform 120ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
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

.cardhub-card__action:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(43, 32, 24, 0.15);
}

.cardhub-card__action:active {
  transform: translateY(0);
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
  transition:
    background-color 160ms ease,
    transform 120ms ease;
}

.cardhub-preview__close:hover {
  background: rgba(43, 32, 24, 0.25);
}

.cardhub-preview__close:active {
  transform: scale(0.96);
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

.cardhub-manage__overview {
  display: grid;
  gap: 10px;
  margin-top: 10px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.cardhub-manage__overview-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(106, 63, 42, 0.2);
  border-radius: 14px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
}

.cardhub-manage__overview-label {
  font-size: 10px;
  color: #7d5b46;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.cardhub-manage__overview-value {
  font-size: 13px;
  font-weight: 600;
  color: #3b2a20;
}

.cardhub-manage__overview-hint {
  font-size: 11px;
  color: #7d5b46;
}

.cardhub-manage__section {
  display: grid;
  gap: 8px;
}

.cardhub-manage__details {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.cardhub-manage__detail {
  background: #fffaf4;
  border: 1px solid rgba(106, 63, 42, 0.2);
  border-radius: 16px;
  padding: 12px 14px;
  display: grid;
  gap: 6px;
}

.cardhub-manage__detail-label {
  font-size: 11px;
  color: #7d5b46;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.cardhub-manage__detail-content {
  font-size: 12px;
  line-height: 1.5;
  color: #3b2a20;
  white-space: pre-wrap;
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

.cardhub-manage__btn {
  border: none;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  text-transform: none;
  transition:
    background-color 160ms ease,
    transform 120ms ease,
    box-shadow 160ms ease;
}

.cardhub-manage__btn.is-primary {
  background: #2b2018;
  color: #fff5ea;
}

.cardhub-manage__btn.is-secondary {
  background: #d9c6b6;
  color: #3b2a20;
}

.cardhub-manage__jump-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.cardhub-manage__btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(43, 32, 24, 0.15);
}

.cardhub-manage__btn.is-primary:hover {
  background: #241a14;
}

.cardhub-manage__btn.is-secondary:hover {
  background: #d1bca8;
}

.cardhub-manage__btn:active {
  transform: translateY(0);
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

.cardhub-manage__chat-main {
  display: grid;
  gap: 4px;
}

.cardhub-manage__chat-name {
  flex: 0 0 auto;
  font-weight: 600;
  color: #6a3f2a;
  word-break: break-word;
}

.cardhub-manage__chat-label {
  font-size: 11px;
  color: #9a7a63;
  word-break: break-word;
}

.cardhub-manage__chat-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cardhub-manage__chat-tag {
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(106, 63, 42, 0.2);
  background: rgba(255, 255, 255, 0.75);
  font-size: 10px;
  color: #6a3f2a;
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

.cardhub-confirm {
  position: absolute;
  inset: 0;
  background: rgba(24, 16, 10, 0.55);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 100002;
}

.cardhub-confirm__panel {
  width: min(460px, 92vw);
  background: #fff6ea;
  border-radius: 22px;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.25);
  padding: 18px 20px;
  display: grid;
  gap: 12px;
}

.cardhub-confirm__title {
  font-size: 16px;
  font-weight: 600;
  color: #2b2018;
}

.cardhub-confirm__message {
  font-size: 13px;
  line-height: 1.5;
  color: #4a2a1f;
  white-space: pre-wrap;
}

.cardhub-confirm__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.cardhub-confirm__button {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  cursor: pointer;
  transition:
    transform 120ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease;
}

.cardhub-confirm__button.is-confirm {
  background: #d46b3d;
  color: #fff;
}

.cardhub-confirm__button.is-cancel {
  background: transparent;
  color: #6a3f2a;
  border: 1px solid rgba(106, 63, 42, 0.4);
}

.cardhub-confirm__button.is-danger {
  background: #b6452a;
  color: #fff;
}

.cardhub-confirm__button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(43, 32, 24, 0.18);
}

.cardhub-confirm__button:active {
  transform: translateY(0);
}

.cardhub-button:focus-visible,
.cardhub-chip:focus-visible,
.cardhub-tag-filter__chip:focus-visible,
.cardhub-tag:focus-visible,
.cardhub-card__action:focus-visible,
.cardhub-pagination__button:focus-visible,
.cardhub-manage__btn:focus-visible,
.cardhub-close:focus-visible,
.cardhub-preview__close:focus-visible,
.cardhub-confirm__button:focus-visible {
  outline: 2px solid rgba(212, 107, 61, 0.6);
  outline-offset: 2px;
}
@media (max-width: 720px) {
  .cardhub-root {
    position: absolute !important;
    inset: 0 !important;
    z-index: 99999 !important;
    display: none;
    align-items: center !important;
    justify-content: center !important;
    padding: 16px !important;
    box-sizing: border-box !important;
    overflow-y: auto !important;
  }

  .cardhub-root.open {
    display: flex !important;
  }

  .cardhub-backdrop {
    position: absolute !important;
    inset: 0 !important;
    z-index: 99998 !important;
    background: rgba(0, 0, 0, 0.4) !important;
    backdrop-filter: blur(8px) !important;
  }

  .cardhub-panel {
    position: relative !important;
    width: 100% !important;
    height: 100% !important;
    max-height: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    border-radius: 24px !important;
    box-shadow:
      0 12px 48px rgba(0, 0, 0, 0.3),
      0 2px 8px rgba(0, 0, 0, 0.1) !important;
    display: flex !important;
    flex-direction: column !important;
    z-index: 99999 !important;
    overflow: hidden !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
  }

  .cardhub-header {
    flex-shrink: 0;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(86, 59, 44, 0.12);
  }

  .cardhub-title__main {
    font-size: 20px;
  }

  .cardhub-title__sub {
    font-size: 11px;
  }

  .cardhub-close {
    width: 28px;
    height: 28px;
    font-size: 16px;
    line-height: 28px;
  }

  .cardhub-toolbar {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 14px;
  }

  .cardhub-search {
    width: 100%;
    font-size: 13px;
    padding: 8px 12px;
  }

  .cardhub-button {
    flex: 1;
    min-width: 0;
    font-size: 11px;
    padding: 6px 10px;
  }

  .cardhub-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .cardhub-sidebar {
    flex-shrink: 0;
    border-right: none;
    border-bottom: 1px solid rgba(86, 59, 44, 0.12);
    padding: 10px 14px;
    max-height: none;
    overflow: visible;
  }

  .cardhub-section-title {
    font-size: 10px;
    margin-bottom: 6px;
  }

  .cardhub-divider {
    margin: 6px 0;
  }

  .cardhub-chip-row,
  .cardhub-tag-filter {
    display: flex;
    flex-wrap: wrap;
    overflow: visible;
    gap: 6px;
    padding-bottom: 4px;
  }

  .cardhub-chip-row::-webkit-scrollbar,
  .cardhub-tag-filter::-webkit-scrollbar {
    height: 4px;
  }

  .cardhub-chip-row::-webkit-scrollbar-thumb,
  .cardhub-tag-filter::-webkit-scrollbar-thumb {
    background: rgba(106, 63, 42, 0.15);
    border-radius: 999px;
  }

  .cardhub-chip {
    font-size: 11px;
    padding: 5px 10px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .cardhub-tag-filter__chip {
    font-size: 10px;
    padding: 4px 8px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .cardhub-content {
    flex: 1;
    min-height: 0;
    overflow: visible;
    padding: 12px;
  }

  .cardhub-pagination {
    align-items: flex-start;
  }

  .cardhub-pagination__actions {
    width: 100%;
  }

  .cardhub-pagination__button {
    flex: 1;
    text-align: center;
  }

  .cardhub-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
    justify-content: center;
    justify-items: center;
  }

  .cardhub-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 14px;
    min-width: 0;
    width: 100%;
    max-width: none;
  }

  .cardhub-card__avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 10px;
  }

  .cardhub-card__info {
    flex: 1;
    min-width: 0;
  }

  .cardhub-card__name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cardhub-card__meta {
    font-size: 10px;
    gap: 6px;
  }

  .cardhub-card__tags {
    margin-top: 4px;
    gap: 4px;
  }

  .cardhub-tag {
    font-size: 9px;
    padding: 3px 6px;
  }

  .cardhub-card__actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }

  .cardhub-card__action {
    padding: 5px 10px;
    font-size: 10px;
    border-radius: 8px;
  }

  .cardhub-preview,
  .cardhub-manage {
    position: absolute !important;
    inset: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 16px !important;
    box-sizing: border-box !important;
    overflow-y: auto !important;
  }

  .cardhub-preview__panel,
  .cardhub-manage__panel {
    width: calc(100vw - 32px) !important;
    max-width: 360px !important;
    max-height: calc(100vh - 32px) !important;
    max-height: calc(100dvh - 32px) !important;
    border-radius: 18px !important;
    padding: 16px !important;
    overflow: auto !important;
  }

  .cardhub-preview__avatar {
    height: 180px;
    border-radius: 14px;
  }

  .cardhub-preview__name {
    font-size: 16px;
  }

  .cardhub-preview__meta {
    font-size: 11px;
  }

  .cardhub-preview__tag {
    font-size: 10px;
    padding: 4px 8px;
  }

  .cardhub-preview__actions {
    gap: 8px;
  }

  .cardhub-manage__top {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .cardhub-manage__media {
    width: 120px;
    margin: 0 auto;
  }

  .cardhub-manage__overview {
    grid-template-columns: 1fr;
  }

  .cardhub-manage__overview-value {
    font-size: 12px;
  }

  .cardhub-manage__overview-hint {
    font-size: 10px;
  }

  .cardhub-manage__label {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    font-size: 10px;
  }

  .cardhub-manage__details {
    grid-template-columns: 1fr;
  }

  .cardhub-manage__detail-label {
    font-size: 10px;
  }

  .cardhub-manage__detail-content {
    font-size: 11px;
  }

  .cardhub-manage__btn {
    width: 100%;
    text-align: center;
    font-size: 10px;
  }

  .cardhub-manage__jump-row {
    width: 100%;
  }

  .cardhub-manage__content {
    font-size: 11px;
    padding: 10px;
  }

  .cardhub-manage__chat-row {
    grid-template-columns: 1fr;
    gap: 3px;
    font-size: 11px;
  }

  .cardhub-manage__chat-label {
    font-size: 10px;
  }

  .cardhub-manage__chat-tag {
    font-size: 9px;
  }

  .cardhub-manage__chat-text {
    -webkit-line-clamp: 2;
  }

  .cardhub-manage__actions {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}
</style>
