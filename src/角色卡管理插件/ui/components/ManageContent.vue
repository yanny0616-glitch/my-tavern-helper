<template>
  <div class="cardhub-manage__section">
    <div class="cardhub-manage__label">角色卡预览</div>
    <div v-if="manageDetails.length" class="cardhub-manage__details">
      <div v-for="detail in manageDetails" :key="detail.label" class="cardhub-manage__detail">
        <div class="cardhub-manage__detail-label">{{ detail.label }}</div>
        <div class="cardhub-manage__detail-content">
          {{ detail.preview }}
        </div>
        <button
          v-if="detail.hasMore"
          class="cardhub-manage__detail-toggle"
          type="button"
          @click="openDetail(detail)"
        >
          查看
        </button>
      </div>
    </div>
    <div v-else class="cardhub-manage__empty">{{ manageDetailsHint }}</div>
  </div>
  <div class="cardhub-manage__section">
    <div class="cardhub-manage__label">
      <span>开场白</span>
      <button v-if="openingItems.length" class="cardhub-manage__toggle" type="button" @click="toggleOpenings">
        {{ showAllOpenings ? '收起列表' : `展开列表（${openingItems.length}）` }}
      </button>
    </div>
    <div class="cardhub-manage__content">
      <template v-if="openingItems.length">
        <div v-if="!showAllOpenings" class="cardhub-manage__empty">点击“展开列表”查看开场白</div>
        <div v-else>
          <div v-for="item in openingItems" :key="item.id" class="cardhub-manage__opening">
            <div class="cardhub-manage__opening-title">开场白 {{ item.id + 1 }}</div>
            <div class="cardhub-manage__opening-body">
              {{ item.preview }}
            </div>
            <button class="cardhub-manage__opening-toggle" type="button" @click="openOpening(item)">
              查看
            </button>
          </div>
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
import { ref, watch } from 'vue';
import type { CardHubItem } from '../../types';

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

type OpeningItem = {
  id: number;
  preview: string;
  html: string;
};

const props = defineProps<{
  manageCard: CardHubItem;
  manageDetails: ManageDetail[];
  manageDetailsHint: string;
  openingItems: OpeningItem[];
  manageChats: ManageChatEntry[];
  pagedChats: ManageChatEntry[];
  chatPage: number;
  chatTotalPages: number;
  manageChatHint: string;
  openDetail: (detail: ManageDetail) => void;
  openOpening: (item: OpeningItem) => void;
  openLatestChat: () => void;
  openNewChat: () => void;
  openChat: (entry: ManageChatEntry) => void;
  prevChatPage: () => void;
  nextChatPage: () => void;
  handleCardAction: (card: CardHubItem) => void;
  manageDelete: (card: CardHubItem) => void;
}>();

const showAllOpenings = ref(false);

watch(
  () => [props.manageDetails, props.openingItems],
  () => {
    showAllOpenings.value = false;
  },
);

function toggleOpenings() {
  showAllOpenings.value = !showAllOpenings.value;
}

</script>
