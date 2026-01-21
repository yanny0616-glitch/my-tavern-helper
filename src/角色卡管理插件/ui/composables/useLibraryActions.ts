import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { CardHubItem } from '../../types';

type ConfirmResult = 'confirm' | 'cancel' | 'alt';
type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  altLabel?: string;
};

type LibraryActionOptions = {
  allCards: ComputedRef<CardHubItem[]>;
  stateSearch: Ref<string>;
  selectedTags: Ref<string[]>;
  statusFilter: Ref<'all' | 'imported' | 'unimported'>;
  getCharacters: () => CardHubItem[];
  getLibrary: () => CardHubItem[];
  setLibrary: (library: CardHubItem[]) => void;
  setCharacters: (characters: CardHubItem[]) => void;
  fetchCharacterSummaries: () => Promise<CardHubItem[]>;
  addToLibrary: (files: FileList | File[], existingEntries?: CardHubItem[]) => Promise<CardHubItem[]>;
  removeFromLibrary: (entryId: string) => CardHubItem[];
  updateCharacterTags: (target: CardHubItem, nextTags: string[]) => string[];
  parseLibraryCardData: (card: CardHubItem) => any | null;
  extractCardTagsFromData: (data: any) => string[];
  normalizeNameKey: (value: string) => string;
  normalizeAvatarKey: (value: string) => string;
  dataUrlToBlob: (dataUrl: string) => Promise<Blob>;
  downloadBlob: (blob: Blob, fileName: string) => void;
  openConfirm: (options: ConfirmOptions) => Promise<ConfirmResult>;
  closeManage: () => void;
  sleep: (ms: number) => Promise<void>;
};

export function useLibraryActions(options: LibraryActionOptions) {
  const importInput = ref<HTMLInputElement | null>(null);
  const exportDialogOpen = ref(false);
  const exportSelectedIds = ref<string[]>([]);
  const exportSearch = ref('');
  const exportStatusFilter = ref<'all' | 'imported' | 'unimported'>('all');
  const exportTagFilters = ref<string[]>([]);

  const exportCandidates = computed(() => [...options.allCards.value]);
  const exportAllTags = computed(() => {
    const tagSet = new Set<string>();
    exportCandidates.value.forEach(card => {
      (card.tags ?? []).forEach(tag => tagSet.add(tag));
    });
    exportTagFilters.value.forEach(tag => tagSet.add(tag));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  });
  const exportVisibleCandidates = computed(() => {
    let list = exportCandidates.value;
    if (exportStatusFilter.value === 'imported') {
      list = list.filter(item => item.origin === 'tavern');
    } else if (exportStatusFilter.value === 'unimported') {
      list = list.filter(item => item.origin === 'library');
    }
    if (exportTagFilters.value.length) {
      list = list.filter(card => exportTagFilters.value.some(tag => (card.tags ?? []).includes(tag)));
    }
    const keyword = exportSearch.value.trim().toLowerCase();
    if (!keyword) {
      return list;
    }
    return list.filter(card => {
      if (card.name.toLowerCase().includes(keyword)) {
        return true;
      }
      const tags = card.tags ?? [];
      return tags.some(tag => tag.toLowerCase().includes(keyword));
    });
  });
  const exportSelectedSet = computed(() => new Set(exportSelectedIds.value));
  const exportSelectedItems = computed(() =>
    exportCandidates.value.filter(item => exportSelectedSet.value.has(item.id)),
  );

  function openExportDialog() {
    exportDialogOpen.value = true;
    exportSelectedIds.value = exportVisibleCandidates.value.map(item => item.id);
  }

  function isExportSelected(id: string): boolean {
    return exportSelectedSet.value.has(id);
  }

  function toggleExportSelection(id: string) {
    if (exportSelectedSet.value.has(id)) {
      exportSelectedIds.value = exportSelectedIds.value.filter(item => item !== id);
    } else {
      exportSelectedIds.value = [...exportSelectedIds.value, id];
    }
  }

  function selectAllExport() {
    exportSelectedIds.value = exportVisibleCandidates.value.map(item => item.id);
  }

  function clearExportSelection() {
    exportSelectedIds.value = [];
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
    const updated = await options.addToLibrary(files, options.getLibrary());
    options.setLibrary(updated);
    target.value = '';
  }

  function findDuplicateCharacterByName(name: string): CardHubItem | null {
    const target = options.normalizeNameKey(name);
    if (!target) {
      return null;
    }
    return options.getCharacters().find(item => options.normalizeNameKey(item.name) === target) ?? null;
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

    const beforeCharacters = await options.fetchCharacterSummaries();
    const beforeAvatarKeys = new Set(
      beforeCharacters.map(item => options.normalizeAvatarKey(item.avatar ?? '')).filter(Boolean),
    );

    if (card.rawType === 'png') {
      const blob = await options.dataUrlToBlob(card.raw);
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

    const characters = await options.fetchCharacterSummaries();
    const expectedNames = new Set([card.name]);
    if (card.rawType === 'json') {
      try {
        const parsed = JSON.parse(card.raw) as { name?: string; data?: { name?: string } };
        if (parsed?.name) {
          expectedNames.add(parsed.name);
        }
        if (parsed?.data?.name) {
          expectedNames.add(parsed.data.name);
        }
      } catch {
        // ignore invalid json name parsing
      }
    }
    const matchedByAvatar = characters.find(item => {
      const avatarKey = options.normalizeAvatarKey(item.avatar ?? '');
      return avatarKey && !beforeAvatarKeys.has(avatarKey);
    });
    const matchedByName = characters.find(item =>
      Array.from(expectedNames).some(name => options.normalizeNameKey(item.name) === options.normalizeNameKey(name)),
    );
    const importedCard = matchedByAvatar ?? matchedByName ?? null;
    if (importedCard) {
      options.setLibrary(options.removeFromLibrary(card.id));
      const rawTags = card.tags?.length
        ? card.tags
        : options.extractCardTagsFromData(options.parseLibraryCardData(card));
      if (rawTags.length) {
        const cleanedTags = options.updateCharacterTags(importedCard, rawTags);
        importedCard.tags = cleanedTags;
      }
      toastr.success(`已导入 ${card.name}`);
    } else {
      toastr.warning(`导入完成但未在角色列表中找到「${card.name}」，已保留未导入记录`);
    }
    options.setCharacters(characters);
  }

  async function exportLibraryCard(card: CardHubItem) {
    if (!card.raw || !card.rawType) {
      toastr.error('无法导出：缺少原始数据');
      return;
    }
    if (card.rawType === 'png') {
      const blob = await options.dataUrlToBlob(card.raw);
      options.downloadBlob(blob, `${card.name}.png`);
      return;
    }
    const blob = new Blob([card.raw], { type: 'application/json' });
    options.downloadBlob(blob, `${card.name}.json`);
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
    options.downloadBlob(blob, `${card.name}.png`);
  }

  async function exportSelected() {
    openExportDialog();
  }

  async function confirmExportSelected() {
    const list = exportSelectedItems.value;
    if (!list.length) {
      toastr.warning('请选择要导出的角色卡');
      return;
    }
    const tagLabel = options.selectedTags.value.length ? options.selectedTags.value.join('、') : '无';
    const statusLabel =
      options.statusFilter.value === 'all' ? '全部' : options.statusFilter.value === 'imported' ? '已导入' : '未导入';
    const searchLabel = options.stateSearch.value.trim() || '无';
    const message =
      `将导出 ${list.length} 张角色卡。\n` +
      `筛选状态：${statusLabel}\n` +
      `筛选标签：${tagLabel}\n` +
      `搜索关键字：${searchLabel}\n` +
      `是否继续？`;

    const result = await options.openConfirm({
      title: '批量导出',
      message,
      confirmLabel: '继续导出',
      cancelLabel: '取消',
    });
    if (result !== 'confirm') {
      return;
    }
    exportDialogOpen.value = false;
    for (const item of list) {
      await exportCard(item);
      await options.sleep(120);
    }
    toastr.success(`批量导出完成，共 ${list.length} 张`);
  }

  async function handleCardAction(card: CardHubItem) {
    if (card.origin === 'library') {
      await importLibraryCard(card);
    } else {
      exportCard(card);
    }
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
    const updated = await options.addToLibrary([new File([blob], `${card.name}.png`, { type: 'image/png' })]);
    options.setLibrary(updated);
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
      await options.sleep(80);
    }
    return false;
  }

  function findCharacterIndex(list: SillyTavern.v1CharData[], card: CardHubItem): number {
    const targetName = options.normalizeNameKey(card.name);
    const targetAvatar = card.avatar ? options.normalizeAvatarKey(card.avatar) : '';
    const byAvatar = targetAvatar
      ? list.findIndex(item => options.normalizeAvatarKey(String(item.avatar ?? '')) === targetAvatar)
      : -1;
    if (byAvatar >= 0) {
      return byAvatar;
    }
    const byName = list.findIndex(item => options.normalizeNameKey(String(item.name ?? '')) === targetName);
    if (byName >= 0) {
      return byName;
    }
    return list.findIndex(item => options.normalizeNameKey(String(item?.data?.name ?? '')) === targetName);
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
    const list = ctx?.characters ?? st?.characters ?? [];
    const targetIdx = findCharacterIndex(list, card);
    const currentId = getCurrentCharacterId(ctx, st);
    const deletingActive = targetIdx >= 0 && currentId && String(targetIdx) === String(currentId);
    if (deletingActive) {
      if (list.length > 1) {
        const nextIdx = targetIdx === 0 ? 1 : 0;
        const selector =
          (ctx && typeof ctx.selectCharacterById === 'function' ? ctx.selectCharacterById : null) ??
          (st && typeof st.selectCharacterById === 'function' ? st.selectCharacterById : null);
        if (selector) {
          try {
            await selector(nextIdx, { switchMenu: false });
            await waitForCharacterSelection(nextIdx, ctx, st, 3000);
          } catch (error) {
            console.warn('[CardHub] 删除前切换角色失败', error);
          }
        }
      } else {
        toastr.warning('当前角色为唯一角色，删除后酒馆可能需要刷新');
      }
    }
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
      try {
        await triggerSlash('/closechat');
      } catch (error) {
        console.warn('[CardHub] 关闭聊天失败', error);
      }
      return true;
    }
    const detail = await response.text();
    toastr.error(`删除失败：${response.status} ${detail || response.statusText}`);
    return false;
  }

  async function manageDelete(card: CardHubItem) {
    if (card.origin === 'library') {
      const confirmDelete = await options.openConfirm({
        title: '删除角色',
        message: `确认永久删除「${card.name}」？此操作不可恢复。`,
        confirmLabel: '删除',
        cancelLabel: '取消',
      });
      if (confirmDelete !== 'confirm') {
        return;
      }
      options.setLibrary(options.removeFromLibrary(card.id));
      options.closeManage();
      return;
    }

    const confirmDelete = await options.openConfirm({
      title: '删除角色',
      message: `确定要删除「${card.name}」吗？`,
      confirmLabel: '继续',
      cancelLabel: '取消',
    });
    if (confirmDelete !== 'confirm') {
      return;
    }
    const deleteChoice = await options.openConfirm({
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
      options.closeManage();
      const characters = await options.fetchCharacterSummaries();
      options.setCharacters(characters);
      return;
    }
    const confirmPermanent = await options.openConfirm({
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
    options.closeManage();
    const characters = await options.fetchCharacterSummaries();
    options.setCharacters(characters);
  }

  return {
    importInput,
    exportDialogOpen,
    exportSearch,
    exportStatusFilter,
    exportTagFilters,
    exportAllTags,
    exportVisibleCandidates,
    exportSelectedItems,
    exportSelectedIds,
    openExportDialog,
    exportSelected,
    confirmExportSelected,
    isExportSelected,
    toggleExportSelection,
    selectAllExport,
    clearExportSelection,
    triggerImport,
    handleImportFiles,
    handleCardAction,
    importLibraryCard,
    exportCard,
    exportLibraryCard,
    manageDelete,
  };
}
