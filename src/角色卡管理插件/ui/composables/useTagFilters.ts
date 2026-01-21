import { computed, ref, type ComputedRef } from 'vue';
import type { CardHubItem } from '../../types';

export function useTagFilters(allCards: ComputedRef<CardHubItem[]>, getTags: (card: CardHubItem) => string[]) {
  const selectedTags = ref<string[]>([]);

  const allTags = computed(() => {
    const tagSet = new Set<string>();
    allCards.value.forEach(card => {
      getTags(card).forEach(tag => tagSet.add(tag));
    });
    selectedTags.value.forEach(tag => tagSet.add(tag));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  });

  function applyTagFilter(list: CardHubItem[]): CardHubItem[] {
    if (!selectedTags.value.length) {
      return list;
    }
    return list.filter(card => selectedTags.value.some(tag => getTags(card).includes(tag)));
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

  return {
    selectedTags,
    allTags,
    applyTagFilter,
    toggleTagFilter,
    clearTagFilter,
  };
}
