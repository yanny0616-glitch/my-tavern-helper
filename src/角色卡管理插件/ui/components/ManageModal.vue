<template>
  <div v-if="manageCard" class="cardhub-manage cardhub-modal" @click.self="closeManage">
    <div class="cardhub-manage__panel cardhub-modal__panel" role="dialog" aria-label="角色管理">
      <button class="cardhub-preview__close" type="button" @click="closeManage">×</button>
      <ManageOverview
        :manage-card="manageCard"
        :manage-avatar-url="manageAvatarUrl"
        :manage-overview="manageOverview"
        :display-tags="displayTags"
        :open-note-dialog="openNoteDialog"
        :worldbook-available="worldbookAvailable"
        :open-worldbook-list="openWorldbookList"
      />
      <ManageContent
        :manage-card="manageCard"
        :manage-details="manageDetails"
        :manage-details-hint="manageDetailsHint"
        :opening-items="openingItems"
        :opening-summary="openingSummary"
        :manage-chats="manageChats"
        :paged-chats="pagedChats"
        :chat-page="chatPage"
        :chat-total-pages="chatTotalPages"
        :manage-chat-hint="manageChatHint"
        :open-detail="openDetailViewer"
        :open-edit="openEditDialog"
        :open-opening-list="openOpeningList"
        :open-latest-chat="openLatestChat"
        :open-new-chat="openNewChat"
        :open-chat="openChat"
        :prev-chat-page="prevChatPage"
        :next-chat-page="nextChatPage"
        :handle-card-action="handleCardAction"
        :manage-delete="manageDelete"
      />
    </div>
  </div>

  <div v-if="noteDialogOpen" class="cardhub-note cardhub-modal" @click.self="closeNoteDialog">
    <div class="cardhub-note__panel cardhub-modal__panel" role="dialog" aria-label="备注">
      <div class="cardhub-note__header">
        <div class="cardhub-note__title">备注</div>
        <button class="cardhub-preview__close" type="button" @click="closeNoteDialog">×</button>
      </div>
      <textarea v-model="noteDraft" class="cardhub-note__input" placeholder="填写备注内容" />
      <div class="cardhub-note__actions">
        <button class="cardhub-note__btn is-secondary" type="button" @click="closeNoteDialog">取消</button>
        <button class="cardhub-note__btn is-primary" type="button" @click="saveNoteDialog">保存</button>
      </div>
    </div>
  </div>

  <div v-if="editDialogOpen" class="cardhub-edit cardhub-modal" @click.self="closeEditDialog">
    <div class="cardhub-edit__panel cardhub-modal__panel" role="dialog" :aria-label="editDialogTitle">
      <div class="cardhub-edit__header">
        <div class="cardhub-edit__title">{{ editDialogTitle }}</div>
        <button class="cardhub-preview__close" type="button" @click="closeEditDialog">×</button>
      </div>
      <textarea v-model="editDraft" class="cardhub-edit__input" placeholder="填写内容" />
      <div class="cardhub-edit__actions">
        <button class="cardhub-edit__btn is-secondary" type="button" @click="closeEditDialog">取消</button>
        <button class="cardhub-edit__btn is-primary" type="button" @click="saveEditDialog" :disabled="editSaving">
          {{ editSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>

  <div v-if="openingListOpen" class="cardhub-openings cardhub-modal" @click.self="closeOpeningList">
    <div class="cardhub-openings__panel cardhub-modal__panel" role="dialog" aria-label="开场白列表">
      <div class="cardhub-openings__header">
        <div class="cardhub-openings__title">开场白列表</div>
        <button class="cardhub-preview__close" type="button" @click="closeOpeningList">×</button>
      </div>
      <div class="cardhub-openings__meta">
        <span>{{ openingSummary.value }}</span>
        <span v-if="openingSummary.hint">{{ openingSummary.hint }}</span>
      </div>
      <div v-if="pagedOpenings.length" class="cardhub-openings__list">
        <button
          v-for="item in pagedOpenings"
          :key="item.id"
          class="cardhub-openings__item"
          type="button"
          @click="openOpeningViewer(item)"
        >
          <div class="cardhub-openings__item-title">开场白 {{ item.id + 1 }}</div>
          <div class="cardhub-openings__item-preview">{{ item.preview }}</div>
        </button>
      </div>
      <div v-else class="cardhub-manage__empty">暂无开场白</div>
      <div v-if="openingTotalPages > 1" class="cardhub-manage__pager">
        <button class="cardhub-manage__pager-btn" type="button" :disabled="openingPage <= 1" @click="prevOpeningPage">
          上一页
        </button>
        <span class="cardhub-manage__pager-status">{{ openingPage }} / {{ openingTotalPages }}</span>
        <button
          class="cardhub-manage__pager-btn"
          type="button"
          :disabled="openingPage >= openingTotalPages"
          @click="nextOpeningPage"
        >
          下一页
        </button>
      </div>
    </div>
  </div>

  <div v-if="worldbookOpen" class="cardhub-worldbook cardhub-modal" @click.self="closeWorldbookList">
    <div class="cardhub-worldbook__panel cardhub-modal__panel" role="dialog" aria-label="世界书">
      <div class="cardhub-worldbook__header">
        <div class="cardhub-worldbook__title">{{ worldbookName || '世界书' }}</div>
        <button class="cardhub-preview__close" type="button" @click="closeWorldbookList">×</button>
      </div>
      <div class="cardhub-worldbook__meta">
        <span>{{ worldbookSummary }}</span>
        <span v-if="worldbookSummaryHint">{{ worldbookSummaryHint }}</span>
      </div>
      <div v-if="worldbookLoading" class="cardhub-manage__empty">加载中...</div>
      <div v-else-if="worldbookError" class="cardhub-manage__empty">{{ worldbookError }}</div>
      <div v-else-if="pagedWorldbookItems.length" class="cardhub-worldbook__list">
        <button
          v-for="item in pagedWorldbookItems"
          :key="item.uid"
          class="cardhub-worldbook__item"
          type="button"
          @click="openWorldbookEntry(item)"
        >
          <div class="cardhub-worldbook__item-title">
            <span class="cardhub-worldbook__item-index">{{ item.indexLabel }}</span>
            <span class="cardhub-worldbook__item-name">{{ item.title || '未命名条目' }}</span>
            <span
              v-if="item.strategyLabel"
              class="cardhub-worldbook__item-strategy"
              :class="`is-${item.strategyType}`"
            >
              {{ item.strategyLabel }}
            </span>
            <span v-if="!item.enabled" class="cardhub-worldbook__item-disabled">已禁用</span>
          </div>
          <div class="cardhub-worldbook__item-preview">{{ item.preview }}</div>
        </button>
      </div>
      <div v-else class="cardhub-manage__empty">暂无条目</div>
      <div v-if="worldbookTotalPages > 1" class="cardhub-manage__pager">
        <button
          class="cardhub-manage__pager-btn"
          type="button"
          :disabled="worldbookPage <= 1"
          @click="prevWorldbookPage"
        >
          上一页
        </button>
        <span class="cardhub-manage__pager-status">{{ worldbookPage }} / {{ worldbookTotalPages }}</span>
        <button
          class="cardhub-manage__pager-btn"
          type="button"
          :disabled="worldbookPage >= worldbookTotalPages"
          @click="nextWorldbookPage"
        >
          下一页
        </button>
      </div>
    </div>
  </div>

  <div v-if="viewerOpen" class="cardhub-manage-viewer cardhub-modal" @click.self="closeViewer">
    <div class="cardhub-manage-viewer__panel cardhub-modal__panel" role="dialog" :aria-label="viewerTitle">
      <div class="cardhub-manage-viewer__header">
        <div class="cardhub-manage-viewer__title">{{ viewerTitle }}</div>
        <button class="cardhub-preview__close" type="button" @click="closeViewer">×</button>
      </div>
      <div class="cardhub-manage-viewer__content" v-html="viewerHtml"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ManageContent from './ManageContent.vue';
import ManageOverview from './ManageOverview.vue';
import type { CardHubItem } from '../../types';

type ManageOverviewItem = {
  label: string;
  value: string;
  hint?: string;
};

type ManageDetail = {
  label: string;
  preview: string;
  full: string;
  hasMore: boolean;
  editable?: boolean;
  field?: string;
};

type ManageChatEntry = {
  name: string;
  label?: string;
  mes: string;
  file: string;
};

type ManageProfile = {
  description?: string;
  descriptionField?: string;
  personality?: string;
  scenario?: string;
  creatorNotes?: string;
  creatorNotesField?: string;
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

type OpeningSummary = {
  value: string;
  hint: string;
  hasData: boolean;
};

type ManageChatData = {
  list: ManageChatEntry[];
  summary: ManageChatSummary | null;
};

type ManageData = {
  openings: string[];
  profile: ManageProfile | null;
  openingSummary: ManageOpeningSummary | null;
  worldbookEntries: WorldbookEntry[];
};

type OpeningItem = {
  id: number;
  preview: string;
  html: string;
};

type WorldbookItem = {
  uid: number;
  name: string;
  title: string;
  indexLabel: string;
  strategyLabel: string;
  strategyType: 'constant' | 'selective' | 'vectorized' | 'unknown';
  enabled: boolean;
  preview: string;
  content: string;
};

const props = defineProps<{
  card: CardHubItem | null;
  displayTags: (card: CardHubItem) => string[];
  handleCardAction: (card: CardHubItem) => void;
  manageDelete: (card: CardHubItem) => void;
  closeManage: () => void;
  closeRoot: () => void;
  applyNoteUpdate: (card: CardHubItem, note: string) => void;
  parseLibraryCardData: (card: CardHubItem) => any | null;
  updateLastChatCacheForCard: (card: CardHubItem, timestamp: number) => void;
}>();

const manageCard = computed(() => props.card);
const manageOpenings = ref<string[]>([]);
const manageWorldbookEntries = ref<WorldbookEntry[]>([]);
const manageProfile = ref<ManageProfile | null>(null);
const manageOpeningSummary = ref<ManageOpeningSummary | null>(null);
const manageChats = ref<ManageChatEntry[]>([]);
const manageChatSummary = ref<ManageChatSummary | null>(null);
const manageAvatarUrl = computed(() => (manageCard.value ? avatarUrl(manageCard.value, true) : null));
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
  return items;
});
const manageDetails = computed<ManageDetail[]>(() => {
  const details: ManageDetail[] = [];
  const profile = manageProfile.value;
  const pushDetail = (label: string, value: string, maxChars = 240, editable = false, field = '') => {
    const preview = previewDetailText(value, 3, maxChars);
    const trimmed = value.trim();
    if (!preview && !editable) {
      return;
    }
    const displayPreview = preview || (editable ? '（空）' : '');
    const hasMore = Boolean(displayPreview) && trimmed.length > displayPreview.replace(/…$/, '').length;
    details.push({
      label,
      preview: displayPreview,
      full: trimmed,
      hasMore,
      editable,
      field,
    });
  };
  if (manageCard.value?.origin === 'library' && manageCard.value.importFileName) {
    pushDetail('导入文件名', manageCard.value.importFileName, 120);
  }
  if (manageCard.value?.note?.trim()) {
    pushDetail('备注', manageCard.value.note.trim(), 200);
  }
  const canEdit = manageCard.value?.origin === 'tavern';
  if (profile) {
    pushDetail('角色描述', profile.description ?? '', 240, Boolean(canEdit && profile.descriptionField), profile.descriptionField ?? '');
    pushDetail('性格', profile.personality ?? '');
    pushDetail('场景', profile.scenario ?? '');
    pushDetail(
      '创作者备注',
      profile.creatorNotes ?? '',
      240,
      Boolean(canEdit && profile.creatorNotesField),
      profile.creatorNotesField ?? '',
    );
    pushDetail('系统提示', profile.systemPrompt ?? '', 200);
    pushDetail('历史指令', profile.postHistory ?? '', 200);
    pushDetail('作者', profile.creator ?? '', 80);
  }
  return details;
});

const openingItems = computed<OpeningItem[]>(() =>
  manageOpenings.value.map((opening, index) => ({
    id: index,
    preview: previewOpeningLines(opening, 2).join('\n'),
    html: renderOpeningHtml(opening),
  })),
);

const openingSummary = computed<OpeningSummary>(() => {
  const opening = manageOpeningSummary.value;
  const total = opening?.total ?? openingItems.value.length;
  const alternate = opening?.alternate ?? 0;
  if (!total) {
    return { value: '暂无开场白', hint: '', hasData: false };
  }
  return {
    value: `共 ${total} 条`,
    hint: alternate > 0 ? `替代 ${alternate} 条` : '无替代',
    hasData: true,
  };
});

const worldbookName = computed(() => manageProfile.value?.worldBookName?.trim() || '');
const worldbookAvailable = computed(() => Boolean(worldbookName.value || manageWorldbookEntries.value.length));
const worldbookEntries = ref<WorldbookEntry[]>([]);
const worldbookLoadedName = ref('');
const worldbookLoading = ref(false);
const worldbookError = ref('');
const worldbookOpen = ref(false);
const worldbookPage = ref(1);
const worldbookPageSize = 10;
function resolveWorldbookTitle(entry: WorldbookEntry): string {
  const name = pickString(
    entry?.name,
    (entry as any)?.title,
    (entry as any)?.comment,
    (entry as any)?.annotation,
    (entry as any)?.label,
  );
  if (name) {
    return name;
  }
  const primary = pickWorldbookKey(
    entry?.strategy?.keys ??
      (entry as any)?.keys ??
      (entry as any)?.keywords ??
      (entry as any)?.key ??
      (entry as any)?.search?.keys,
  );
  if (primary) {
    return primary;
  }
  const secondary = pickWorldbookKey(
    entry?.strategy?.keys_secondary?.keys ??
      (entry as any)?.keys_secondary ??
      (entry as any)?.secondary_keys,
  );
  if (secondary) {
    return secondary;
  }
  const content = typeof entry?.content === 'string' ? entry.content : '';
  return pickWorldbookContentTitle(content);
}

function pickWorldbookKey(keys: unknown): string {
  const normalized = normalizeWorldbookKeys(keys);
  if (!normalized.length) {
    return '';
  }
  for (const key of normalized) {
    if (typeof key === 'string') {
      const trimmed = key.trim();
      if (trimmed) {
        return trimmed;
      }
    } else if (key instanceof RegExp) {
      return String(key);
    }
  }
  return '';
}

function normalizeWorldbookKeys(keys: unknown): Array<string | RegExp> {
  if (!keys) {
    return [];
  }
  if (Array.isArray(keys)) {
    return keys as Array<string | RegExp>;
  }
  if (typeof keys === 'string' || keys instanceof RegExp) {
    return [keys as string | RegExp];
  }
  if (typeof keys === 'object') {
    const inner = (keys as any).keys;
    if (Array.isArray(inner)) {
      return inner as Array<string | RegExp>;
    }
  }
  return [];
}

function pickWorldbookContentTitle(content: string): string {
  if (!content) {
    return '';
  }
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const cleaned = trimmed.replace(/^<[^>]+>/g, '').trim();
    if (cleaned) {
      return cleaned.length > 32 ? `${cleaned.slice(0, 32)}...` : cleaned;
    }
  }
  return '';
}

function resolveWorldbookStrategyType(entry: WorldbookEntry): WorldbookItem['strategyType'] {
  const raw =
    (entry as any)?.strategy?.type ??
    (entry as any)?.strategy_type ??
    (entry as any)?.strategyType ??
    (entry as any)?.type ??
    '';
  if (raw === 'constant' || raw === 'selective' || raw === 'vectorized') {
    return raw;
  }
  if (
    (entry as any)?.vectorized === true ||
    (entry as any)?.use_vectorized === true ||
    (entry as any)?.strategy?.vectorized === true
  ) {
    return 'vectorized';
  }
  const primaryKeys = normalizeWorldbookKeys(
    (entry as any)?.strategy?.keys ?? (entry as any)?.keys ?? (entry as any)?.key ?? (entry as any)?.keywords,
  );
  const secondaryKeys = normalizeWorldbookKeys(
    (entry as any)?.strategy?.keys_secondary?.keys ?? (entry as any)?.keys_secondary ?? (entry as any)?.secondary_keys,
  );
  if (primaryKeys.length || secondaryKeys.length) {
    return 'selective';
  }
  return 'constant';
}

function formatWorldbookStrategyLabel(type: WorldbookItem['strategyType']): string {
  if (type === 'constant') {
    return '蓝灯';
  }
  if (type === 'selective') {
    return '绿灯';
  }
  if (type === 'vectorized') {
    return '向量';
  }
  return '';
}
const worldbookItems = computed<WorldbookItem[]>(() =>
  worldbookEntries.value.map((entry, index) => {
    const title = resolveWorldbookTitle(entry);
    const strategyType = resolveWorldbookStrategyType(entry);
    return {
      uid: entry.uid ?? index,
      name: entry.name || '',
      title,
      indexLabel: `条目 ${index + 1}`,
      strategyLabel: formatWorldbookStrategyLabel(strategyType),
      strategyType,
      enabled: entry.enabled !== false,
      preview: previewDetailText(String(entry.content ?? ''), 2, 200) || '（无内容）',
      content: String(entry.content ?? ''),
    };
  }),
);
const worldbookTotalPages = computed(() => Math.max(1, Math.ceil(worldbookItems.value.length / worldbookPageSize)));
const pagedWorldbookItems = computed(() => {
  const start = (worldbookPage.value - 1) * worldbookPageSize;
  return worldbookItems.value.slice(start, start + worldbookPageSize);
});
const worldbookSummary = computed(() => {
  if (!worldbookAvailable.value) {
    return '未绑定世界书';
  }
  if (worldbookLoading.value) {
    return '正在读取条目';
  }
  return `共 ${worldbookItems.value.length} 条`;
});
const worldbookSummaryHint = computed(() => (worldbookItems.value.length ? worldbookName.value : ''));

const chatPage = ref(1);
const chatPageSize = 6;
const chatTotalPages = computed(() => Math.max(1, Math.ceil(manageChats.value.length / chatPageSize)));
const pagedChats = computed(() => {
  const start = (chatPage.value - 1) * chatPageSize;
  return manageChats.value.slice(start, start + chatPageSize);
});

const openingPage = ref(1);
const openingPageSize = 10;
const openingTotalPages = computed(() => Math.max(1, Math.ceil(openingItems.value.length / openingPageSize)));
const pagedOpenings = computed(() => {
  const start = (openingPage.value - 1) * openingPageSize;
  return openingItems.value.slice(start, start + openingPageSize);
});

const noteDialogOpen = ref(false);
const noteDraft = ref('');
const editDialogOpen = ref(false);
const editDialogTitle = ref('');
const editDraft = ref('');
const editField = ref('');
const editSaving = ref(false);
const openingListOpen = ref(false);
const viewerOpen = ref(false);
const viewerTitle = ref('');
const viewerHtml = ref('');
let manageRequestId = 0;

watch(
  manageCard,
  card => {
    if (!card) {
      manageOpenings.value = [];
      manageWorldbookEntries.value = [];
      manageProfile.value = null;
      manageOpeningSummary.value = null;
      manageChats.value = [];
      manageChatSummary.value = null;
      chatPage.value = 1;
      openingPage.value = 1;
      noteDialogOpen.value = false;
      noteDraft.value = '';
      editDialogOpen.value = false;
      editDialogTitle.value = '';
      editDraft.value = '';
      editField.value = '';
      editSaving.value = false;
      openingListOpen.value = false;
      worldbookOpen.value = false;
      worldbookEntries.value = [];
      worldbookLoadedName.value = '';
      worldbookLoading.value = false;
      worldbookError.value = '';
      worldbookPage.value = 1;
      viewerOpen.value = false;
      viewerTitle.value = '';
      viewerHtml.value = '';
      return;
    }
    void openManage(card);
  },
  { immediate: true },
);

function prevChatPage() {
  if (chatPage.value > 1) {
    chatPage.value -= 1;
  }
}

function nextChatPage() {
  if (chatPage.value < chatTotalPages.value) {
    chatPage.value += 1;
  }
}

async function openWorldbookList() {
  const name = worldbookName.value;
  if (!name && !manageWorldbookEntries.value.length) {
    return;
  }
  worldbookOpen.value = true;
  worldbookError.value = '';
  worldbookPage.value = 1;
  if (manageWorldbookEntries.value.length) {
    worldbookEntries.value = manageWorldbookEntries.value;
    worldbookLoadedName.value = name || 'embedded';
    return;
  }
  if (worldbookLoadedName.value === name && worldbookEntries.value.length) {
    return;
  }
  if (typeof getWorldbook !== 'function') {
    worldbookError.value = '世界书接口不可用';
    return;
  }
  worldbookLoading.value = true;
  try {
    const entries = await getWorldbook(name);
    worldbookEntries.value = Array.isArray(entries) ? entries : [];
    worldbookLoadedName.value = name;
  } catch (error) {
    worldbookError.value = '读取世界书失败';
    worldbookEntries.value = [];
    console.warn('[CardHub] 读取世界书失败', error);
  } finally {
    worldbookLoading.value = false;
  }
}

function closeWorldbookList() {
  worldbookOpen.value = false;
}

function prevWorldbookPage() {
  if (worldbookPage.value > 1) {
    worldbookPage.value -= 1;
  }
}

function nextWorldbookPage() {
  if (worldbookPage.value < worldbookTotalPages.value) {
    worldbookPage.value += 1;
  }
}

function openOpeningList() {
  if (!openingItems.value.length) {
    return;
  }
  openingPage.value = 1;
  openingListOpen.value = true;
}

function closeOpeningList() {
  openingListOpen.value = false;
}

function prevOpeningPage() {
  if (openingPage.value > 1) {
    openingPage.value -= 1;
  }
}

function nextOpeningPage() {
  if (openingPage.value < openingTotalPages.value) {
    openingPage.value += 1;
  }
}

function openNoteDialog() {
  if (!manageCard.value) {
    return;
  }
  noteDraft.value = manageCard.value.note ?? '';
  noteDialogOpen.value = true;
}

function closeNoteDialog() {
  noteDialogOpen.value = false;
}

function saveNoteDialog() {
  if (!manageCard.value) {
    return;
  }
  props.applyNoteUpdate(manageCard.value, noteDraft.value);
  noteDialogOpen.value = false;
}

function openDetailViewer(detail: ManageDetail) {
  viewerTitle.value = detail.label;
  viewerHtml.value = textToHtml(detail.full || detail.preview);
  viewerOpen.value = true;
}

function openOpeningViewer(item: OpeningItem) {
  openingListOpen.value = false;
  viewerTitle.value = `开场白 ${item.id + 1}`;
  viewerHtml.value = item.html || textToHtml(item.preview);
  viewerOpen.value = true;
}

function openWorldbookEntry(item: WorldbookItem) {
  worldbookOpen.value = false;
  viewerTitle.value = item.title || item.indexLabel || '世界书条目';
  viewerHtml.value = textToHtml(item.content);
  viewerOpen.value = true;
}

function closeViewer() {
  viewerOpen.value = false;
}

async function openManage(card: CardHubItem) {
  const requestId = ++manageRequestId;
  manageOpenings.value = [];
  manageWorldbookEntries.value = [];
  manageChats.value = [];
  manageProfile.value = null;
  manageOpeningSummary.value = null;
  manageChatSummary.value = null;
  chatPage.value = 1;
  openingPage.value = 1;
  openingListOpen.value = false;
  worldbookOpen.value = false;
  worldbookEntries.value = [];
  worldbookLoadedName.value = '';
  worldbookLoading.value = false;
  worldbookError.value = '';
  worldbookPage.value = 1;

  const [manageResult, chatsResult] = await Promise.allSettled([resolveManageData(card), resolveRecentChats(card)]);

  if (requestId !== manageRequestId || manageCard.value?.id !== card.id) {
    return;
  }

  const manageData: ManageData =
    manageResult.status === 'fulfilled'
      ? manageResult.value
      : { openings: [], profile: null, openingSummary: null, worldbookEntries: [] };
  manageOpenings.value = manageData.openings;
  manageProfile.value = manageData.profile;
  manageOpeningSummary.value = manageData.openingSummary;
  manageWorldbookEntries.value = manageData.worldbookEntries;

  const chatData: ManageChatData = chatsResult.status === 'fulfilled' ? chatsResult.value : { list: [], summary: null };
  manageChats.value = chatData.list;
  manageChatSummary.value = chatData.summary;
}

async function resolveManageData(card: CardHubItem): Promise<ManageData> {
  if (card.origin !== 'tavern') {
    const data = props.parseLibraryCardData(card);
    return {
      openings: extractOpeningMessages(data),
      profile: extractCardProfile(data),
      openingSummary: extractOpeningSummary(data),
      worldbookEntries: extractWorldbookEntries(data),
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
    worldbookEntries: extractWorldbookEntries(primary ?? fallback),
  };
}

async function resolveRecentChats(card: CardHubItem): Promise<ManageChatData> {
  if (card.origin !== 'tavern') {
    return { list: [], summary: null };
  }
  const brief = await TavernHelper.getChatHistoryBrief(card.name ?? card.avatar ?? '', true);
  if (!Array.isArray(brief) || !brief.length) {
    return { list: [], summary: { total: 0, latest: '' } };
  }
  const sorted = sortChatBrief(brief);
  const latestTimestamp = extractChatLatestTimestamp(sorted[0]) ?? 0;
  props.updateLastChatCacheForCard(card, latestTimestamp);
  const list = sorted.map((entry: any) => ({
    name: formatChatTitle(entry),
    label: formatChatFileLabel(entry),
    file: String(entry?.file_name ?? entry?.file_id ?? ''),
    mes: normalizeBriefMessage(String(entry?.mes ?? '')).slice(0, 120),
  }));
  const latest = extractChatLatestLabel(sorted[0]);
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
    props.closeManage();
    props.closeRoot();
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
    props.closeManage();
    props.closeRoot();
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

function getCurrentCharacterId(ctx: any, st: typeof SillyTavern | undefined): string {
  const value = ctx?.characterId ?? st?.characterId ?? '';
  return value === undefined || value === null ? '' : String(value);
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
    await sleep(200);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findCharacterIndex(list: SillyTavern.v1CharData[], card: CardHubItem): number {
  const targetName = normalizeNameKey(card.name);
  const targetAvatar = card.avatar ? normalizeAvatarKey(card.avatar) : '';
  const byAvatar = targetAvatar
    ? list.findIndex(item => normalizeAvatarKey(String(item.avatar ?? '')) === targetAvatar)
    : -1;
  if (byAvatar >= 0) {
    return byAvatar;
  }
  const byName = list.findIndex(item => normalizeNameKey(String(item.name ?? '')) === targetName);
  if (byName >= 0) {
    return byName;
  }
  return list.findIndex(item => normalizeNameKey(String(item?.data?.name ?? '')) === targetName);
}

function normalizeNameKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function normalizeAvatarKey(value: string): string {
  let raw = value.trim();
  if (!raw) {
    return '';
  }
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // ignore
  }
  raw = raw.split('?')[0];
  if (raw.includes('/')) {
    raw = raw.split('/').pop() ?? raw;
  }
  return raw.trim().toLowerCase();
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
  const descriptionField = hasField(data, 'description') ? 'description' : '';
  const creatorNotesField = resolveCreatorNotesField(data);
  const profile: ManageProfile = {
    description: pickString(data?.description, data?.data?.description),
    descriptionField,
    personality: pickString(data?.personality, data?.data?.personality),
    scenario: pickString(data?.scenario, data?.data?.scenario),
    creatorNotes: pickString(
      data?.creatorcomment,
      data?.data?.creatorcomment,
      data?.creator_notes,
      data?.data?.creator_notes,
    ),
    creatorNotesField,
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

function hasField(data: any, field: string): boolean {
  return data?.[field] !== undefined || data?.data?.[field] !== undefined;
}

function resolveCreatorNotesField(data: any): string {
  if (hasField(data, 'creatorcomment')) {
    return 'creatorcomment';
  }
  if (hasField(data, 'creator_notes')) {
    return 'creator_notes';
  }
  return '';
}

function extractWorldbookEntries(data: any): WorldbookEntry[] {
  const book = data?.character_book ?? data?.data?.character_book;
  if (!book || !Array.isArray(book?.entries)) {
    return [];
  }
  return book.entries as WorldbookEntry[];
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

function isEditableDetail(detail: ManageDetail): boolean {
  return Boolean(detail.editable && detail.field);
}

function resolveEditFields(field: string): string[] {
  if (field === 'creatorcomment' || field === 'creator_notes') {
    return ['creatorcomment', 'creator_notes'];
  }
  return [field];
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

function normalizeBriefMessage(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function renderOpeningHtml(text: string): string {
  const trimmed = stripCodeFences(text).trim();
  if (!trimmed) {
    return '';
  }
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }
  return escapeHtml(trimmed).replace(/\n/g, '<br>');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textToHtml(text: string): string {
  const trimmed = stripCodeFences(text).trim();
  if (!trimmed) {
    return '';
  }
  return escapeHtml(trimmed).replace(/\n/g, '<br>');
}

function stripCodeFences(text: string): string {
  return text.replace(/^\s*```[a-zA-Z0-9_-]*\s*$/gm, '').replace(/^\s*```\s*$/gm, '');
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

function sortChatBrief(list: any[]): any[] {
  return [...list].sort((a, b) => (extractChatLatestTimestamp(b) ?? 0) - (extractChatLatestTimestamp(a) ?? 0));
}

function extractChatLatestLabel(entry: any): string {
  return pickString(entry?.chat_name, entry?.chat_title, entry?.name, entry?.file_name, entry?.file_id);
}

function extractChatLatestTimestamp(entry: any): number | null {
  const raw =
    entry?.last_message_time ??
    entry?.last_message_date ??
    entry?.last_message_timestamp ??
    entry?.last_chat_time ??
    entry?.last_chat_date ??
    entry?.last_interaction ??
    entry?.update_time ??
    entry?.timestamp ??
    entry?.time ??
    null;
  return coerceToTimestamp(raw) ?? parseTimestampFromText(String(entry?.file_name ?? entry?.file_id ?? ''));
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

function parseTimestampFromText(raw: string): number | null {
  const text = raw.replace(/\.jsonl$/i, '').trim();
  const pattern = /(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T_@-]*(\d{1,2})[:：](\d{1,2})(?:[:：](\d{1,2}))?)?/;
  const match = text.match(pattern);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] ? Number(match[4]) : 0;
  const minute = match[5] ? Number(match[5]) : 0;
  const second = match[6] ? Number(match[6]) : 0;
  if (!year || !month || !day) {
    return null;
  }
  const value = new Date(year, month - 1, day, hour, minute, second).getTime();
  return Number.isNaN(value) ? null : value;
}

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

function openEditDialog(detail: ManageDetail) {
  if (!manageCard.value || manageCard.value.origin !== 'tavern' || !isEditableDetail(detail)) {
    return;
  }
  editDialogOpen.value = true;
  editDialogTitle.value = `编辑${detail.label}`;
  editDraft.value = detail.full ?? '';
  editField.value = detail.field ?? '';
}

function closeEditDialog() {
  editDialogOpen.value = false;
  editDialogTitle.value = '';
  editDraft.value = '';
  editField.value = '';
  editSaving.value = false;
}

async function saveEditDialog() {
  if (!manageCard.value || manageCard.value.origin !== 'tavern' || !editField.value) {
    return;
  }
  if (editSaving.value) {
    return;
  }
  editSaving.value = true;
  try {
    const token = await fetchCsrfToken();
    if (!token) {
      toastr.error('未获取到 CSRF Token');
      return;
    }
    const basePayload = {
      avatar_url: manageCard.value.avatar ?? '',
      ch_name: manageCard.value.name ?? manageCard.value.avatar ?? '',
      value: editDraft.value ?? '',
    };
    const fields = resolveEditFields(editField.value);
    for (const field of fields) {
      const response = await fetch('/api/characters/edit-attribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ ...basePayload, field }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || '保存失败');
      }
    }
    toastr.success('已保存角色卡字段');
    closeEditDialog();
    if (manageCard.value) {
      void openManage(manageCard.value);
    }
  } catch (error) {
    console.warn('[CardHub] 编辑角色卡字段失败', error);
    toastr.error('保存失败，请稍后再试');
  } finally {
    editSaving.value = false;
  }
}

async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/csrf-token', { credentials: 'same-origin' });
    if (!response.ok) {
      return '';
    }
    const data = await response.json();
    return typeof data?.token === 'string' ? data.token : '';
  } catch (error) {
    console.warn('[CardHub] 获取 CSRF Token 失败', error);
    return '';
  }
}
</script>
