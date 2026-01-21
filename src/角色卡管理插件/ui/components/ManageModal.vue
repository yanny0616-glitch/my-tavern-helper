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
      />
      <ManageContent
        :manage-card="manageCard"
        :manage-details="manageDetails"
        :manage-details-hint="manageDetailsHint"
        :opening-items="openingItems"
        :manage-chats="manageChats"
        :paged-chats="pagedChats"
        :chat-page="chatPage"
        :chat-total-pages="chatTotalPages"
        :manage-chat-hint="manageChatHint"
        :open-detail="openDetailViewer"
        :open-opening="openOpeningViewer"
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
};

type ManageChatEntry = {
  name: string;
  label?: string;
  mes: string;
  file: string;
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

type ManageData = {
  openings: string[];
  profile: ManageProfile | null;
  openingSummary: ManageOpeningSummary | null;
};

type OpeningItem = {
  id: number;
  preview: string;
  html: string;
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
const manageDetails = computed<ManageDetail[]>(() => {
  const details: ManageDetail[] = [];
  const profile = manageProfile.value;
  const pushDetail = (label: string, value: string, maxChars = 240) => {
    const preview = previewDetailText(value, 3, maxChars);
    if (preview) {
      details.push({ label, preview, full: value.trim(), hasMore: preview !== value.trim() });
    }
  };
  if (manageCard.value?.origin === 'library' && manageCard.value.importFileName) {
    pushDetail('导入文件名', manageCard.value.importFileName, 120);
  }
  if (manageCard.value?.note?.trim()) {
    pushDetail('备注', manageCard.value.note.trim(), 200);
  }
  if (profile) {
    pushDetail('角色描述', profile.description ?? '');
    pushDetail('性格', profile.personality ?? '');
    pushDetail('场景', profile.scenario ?? '');
    pushDetail('创作者备注', profile.creatorNotes ?? '');
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

const chatPage = ref(1);
const chatPageSize = 6;
const chatTotalPages = computed(() => Math.max(1, Math.ceil(manageChats.value.length / chatPageSize)));
const pagedChats = computed(() => {
  const start = (chatPage.value - 1) * chatPageSize;
  return manageChats.value.slice(start, start + chatPageSize);
});

const noteDialogOpen = ref(false);
const noteDraft = ref('');
const viewerOpen = ref(false);
const viewerTitle = ref('');
const viewerHtml = ref('');
let manageRequestId = 0;

watch(
  manageCard,
  card => {
    if (!card) {
      manageOpenings.value = [];
      manageProfile.value = null;
      manageOpeningSummary.value = null;
      manageChats.value = [];
      manageChatSummary.value = null;
      chatPage.value = 1;
      noteDialogOpen.value = false;
      noteDraft.value = '';
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
  viewerTitle.value = `开场白 ${item.id + 1}`;
  viewerHtml.value = item.html || textToHtml(item.preview);
  viewerOpen.value = true;
}

function closeViewer() {
  viewerOpen.value = false;
}

async function openManage(card: CardHubItem) {
  const requestId = ++manageRequestId;
  manageOpenings.value = [];
  manageChats.value = [];
  manageProfile.value = null;
  manageOpeningSummary.value = null;
  manageChatSummary.value = null;
  chatPage.value = 1;

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

async function resolveManageData(card: CardHubItem): Promise<ManageData> {
  if (card.origin !== 'tavern') {
    const data = props.parseLibraryCardData(card);
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
  return text
    .replace(/^\s*```[a-zA-Z0-9_-]*\s*$/gm, '')
    .replace(/^\s*```\s*$/gm, '');
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
</script>
