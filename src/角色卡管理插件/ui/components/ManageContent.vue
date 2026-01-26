<template>
  <div class="cardhub-manage__section">
    <div class="cardhub-manage__label">角色卡预览</div>
    <div v-if="manageDetails.length" class="cardhub-manage__details">
      <div v-for="detail in manageDetails" :key="detail.label" class="cardhub-manage__detail">
        <div class="cardhub-manage__detail-head">
          <div class="cardhub-manage__detail-label">{{ detail.label }}</div>
          <button
            v-if="detail.editable"
            class="cardhub-manage__detail-edit"
            type="button"
            @click="openEdit(detail)"
          >
            ✎
          </button>
        </div>
        <div class="cardhub-manage__detail-content">
          {{ detail.preview }}
        </div>
        <button v-if="detail.hasMore" class="cardhub-manage__detail-toggle" type="button" @click="openDetail(detail)">
          查看
        </button>
      </div>
    </div>
    <div v-else class="cardhub-manage__empty">{{ manageDetailsHint }}</div>
  </div>
  <div class="cardhub-manage__section">
    <div class="cardhub-manage__label">
      <span>开场白</span>
      <button v-if="openingItems.length" class="cardhub-manage__toggle" type="button" @click="openOpeningList">
        查看列表（{{ openingItems.length }}）
      </button>
    </div>
    <div class="cardhub-manage__content">
      <div v-if="openingSummary.hasData" class="cardhub-manage__opening-meta">
        <span class="cardhub-manage__opening-meta-value">{{ openingSummary.value }}</span>
        <span v-if="openingSummary.hint" class="cardhub-manage__opening-meta-hint">{{ openingSummary.hint }}</span>
      </div>
      <div v-if="!openingItems.length" class="cardhub-manage__empty">暂无开场白</div>
      <div v-else class="cardhub-manage__empty">点击“查看列表”浏览开场白</div>
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
    <div v-if="pagedChats.length" class="cardhub-manage__chat">
      <div
        v-for="(msg, index) in pagedChats"
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
        </div>
        <span class="cardhub-manage__chat-text">{{ msg.mes }}</span>
      </div>
    </div>
    <div v-else class="cardhub-manage__empty">{{ manageChatHint }}</div>
    <div v-if="chatTotalPages > 1" class="cardhub-manage__pager">
      <button class="cardhub-manage__pager-btn" type="button" :disabled="chatPage <= 1" @click="prevChatPage">
        上一页
      </button>
      <span class="cardhub-manage__pager-status">{{ chatPage }} / {{ chatTotalPages }}</span>
      <button
        class="cardhub-manage__pager-btn"
        type="button"
        :disabled="chatPage >= chatTotalPages"
        @click="nextChatPage"
      >
        下一页
      </button>
    </div>
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
</template>

<script setup lang="ts">
import type { CardHubItem } from '../../types';

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

type OpeningItem = {
  id: number;
  preview: string;
  html: string;
};

type OpeningSummary = {
  value: string;
  hint: string;
  hasData: boolean;
};

defineProps<{
  manageCard: CardHubItem;
  manageDetails: ManageDetail[];
  manageDetailsHint: string;
  openingItems: OpeningItem[];
  openingSummary: OpeningSummary;
  manageChats: ManageChatEntry[];
  pagedChats: ManageChatEntry[];
  chatPage: number;
  chatTotalPages: number;
  manageChatHint: string;
  openDetail: (detail: ManageDetail) => void;
  openEdit: (detail: ManageDetail) => void;
  openOpeningList: () => void;
  openLatestChat: () => void;
  openNewChat: () => void;
  openChat: (entry: ManageChatEntry) => void;
  prevChatPage: () => void;
  nextChatPage: () => void;
  handleCardAction: (card: CardHubItem) => void;
  manageDelete: (card: CardHubItem) => void;
}>();
</script>
