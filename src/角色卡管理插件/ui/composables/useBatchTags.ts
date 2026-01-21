import { computed, ref, type ComputedRef } from 'vue';
import type { CardHubItem } from '../../types';

type ConfirmResult = 'confirm' | 'cancel' | 'alt';
type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  altLabel?: string;
};

type BatchTagOptions = {
  allCards: ComputedRef<CardHubItem[]>;
  filteredCharacters: ComputedRef<CardHubItem[]>;
  allTags: ComputedRef<string[]>;
  displayTags: (card: CardHubItem) => string[];
  applyTagUpdate: (card: CardHubItem, tags: string[]) => void;
  openConfirm: (options: ConfirmOptions) => Promise<ConfirmResult>;
};

export function useBatchTags(options: BatchTagOptions) {
  const tagManagerOpen = ref(false);
  const tagManagerTab = ref<'filter' | 'batch'>('filter');
  const batchTagSelectedIds = ref<string[]>([]);
  const batchTagSearch = ref('');
  const batchTagInput = ref('');
  const batchTagSelectedTags = ref<string[]>([]);

  const batchTagCandidates = computed(() => options.filteredCharacters.value);
  const batchTagVisibleCandidates = computed(() => {
    const keyword = batchTagSearch.value.trim().toLowerCase();
    if (!keyword) {
      return batchTagCandidates.value;
    }
    return batchTagCandidates.value.filter(card => {
      if (card.name.toLowerCase().includes(keyword)) {
        return true;
      }
      const tags = options.displayTags(card);
      return tags.some(tag => tag.toLowerCase().includes(keyword));
    });
  });

  const batchTagSelectedSet = computed(() => new Set(batchTagSelectedIds.value));
  const batchTagSuggestions = computed(() => options.allTags.value);

  function openTagManager(tab: 'filter' | 'batch' = 'filter') {
    if (tab === 'batch') {
      if (!batchTagVisibleCandidates.value.length) {
        toastr.warning('当前没有可操作的角色卡');
        return;
      }
      batchTagInput.value = '';
      batchTagSearch.value = '';
      batchTagSelectedTags.value = [];
      batchTagSelectedIds.value = batchTagVisibleCandidates.value.map(item => item.id);
    }
    tagManagerTab.value = tab;
    tagManagerOpen.value = true;
  }

  function closeTagManager() {
    tagManagerOpen.value = false;
  }

  function toggleBatchTagSelection(id: string) {
    if (batchTagSelectedSet.value.has(id)) {
      batchTagSelectedIds.value = batchTagSelectedIds.value.filter(item => item !== id);
    } else {
      batchTagSelectedIds.value = [...batchTagSelectedIds.value, id];
    }
  }

  function selectAllBatchTags() {
    batchTagSelectedIds.value = batchTagVisibleCandidates.value.map(item => item.id);
  }

  function clearBatchTagSelection() {
    batchTagSelectedIds.value = [];
  }

  function parseBatchTags(input: string, selected: string[]): string[] {
    const items = input
      .split(/[,，\n;；、]/)
      .map(part => part.trim())
      .filter(Boolean);
    return Array.from(new Set([...items, ...selected]));
  }

  function getCardsByIds(ids: string[]): CardHubItem[] {
    const map = new Map(options.allCards.value.map(card => [card.id, card]));
    return ids.map(id => map.get(id)).filter(Boolean) as CardHubItem[];
  }

  function toggleBatchTagSuggestion(tag: string) {
    if (batchTagSelectedTags.value.includes(tag)) {
      batchTagSelectedTags.value = batchTagSelectedTags.value.filter(item => item !== tag);
    } else {
      batchTagSelectedTags.value = [...batchTagSelectedTags.value, tag];
    }
  }

  function isSameTagSet(current: string[], next: string[]): boolean {
    if (current.length !== next.length) {
      return false;
    }
    const currentSet = new Set(current);
    return next.every(tag => currentSet.has(tag));
  }

  async function applyBatchTags(mode: 'add' | 'remove') {
    if (!batchTagSelectedIds.value.length) {
      toastr.warning('请先选择要操作的角色卡');
      return;
    }
    const tags = parseBatchTags(batchTagInput.value, batchTagSelectedTags.value);
    if (!tags.length) {
      toastr.warning('请输入要操作的标签');
      return;
    }
    const actionLabel = mode === 'add' ? '添加' : '移除';
    const message = `将${actionLabel}标签：${tags.join('、')}\n应用到 ${batchTagSelectedIds.value.length} 张角色卡，是否继续？`;
    const result = await options.openConfirm({
      title: `批量${actionLabel}标签`,
      message,
      confirmLabel: `继续${actionLabel}`,
      cancelLabel: '取消',
    });
    if (result !== 'confirm') {
      return;
    }
    const cards = getCardsByIds(batchTagSelectedIds.value);
    let changed = 0;
    cards.forEach(card => {
      const currentTags = options.displayTags(card);
      const nextSet = new Set(currentTags);
      if (mode === 'add') {
        tags.forEach(tag => nextSet.add(tag));
      } else {
        tags.forEach(tag => nextSet.delete(tag));
      }
      const nextTags = Array.from(nextSet);
      if (!isSameTagSet(currentTags, nextTags)) {
        options.applyTagUpdate(card, nextTags);
        changed += 1;
      }
    });
    toastr.success(`已处理 ${changed} 张角色卡`);
  }

  return {
    tagManagerOpen,
    tagManagerTab,
    openTagManager,
    closeTagManager,
    batchTagSelectedIds,
    batchTagSearch,
    batchTagInput,
    batchTagSelectedTags,
    batchTagSelectedSet,
    batchTagVisibleCandidates,
    batchTagSuggestions,
    toggleBatchTagSelection,
    selectAllBatchTags,
    clearBatchTagSelection,
    toggleBatchTagSuggestion,
    applyBatchTags,
  };
}
