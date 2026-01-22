<template>
  <div class="cardhub-manage__top">
    <div class="cardhub-manage__summary">
      <div class="cardhub-preview__name">
        <span>{{ manageCard.name }}</span>
        <button class="cardhub-note-trigger" type="button" aria-label="编辑备注" @click="openNoteDialog">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button>
      </div>
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
        <button
          v-if="item.label === '世界书' && worldbookAvailable"
          class="cardhub-manage__overview-action"
          type="button"
          @click="openWorldbookList"
        >
          查看
        </button>
      </div>
    </div>
  </div>
    <div class="cardhub-manage__media">
      <img v-if="manageAvatarUrl" :src="manageAvatarUrl" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardHubItem } from '../../types';

type ManageOverviewItem = {
  label: string;
  value: string;
  hint?: string;
};

defineProps<{
  manageCard: CardHubItem;
  manageAvatarUrl: string | null;
  manageOverview: ManageOverviewItem[];
  displayTags: (card: CardHubItem) => string[];
  openNoteDialog: () => void;
  worldbookAvailable: boolean;
  openWorldbookList: () => void;
}>();
</script>
