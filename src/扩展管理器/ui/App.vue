<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  clearUpdateSelection,
  extensionManagerActions,
  extensionManagerState,
  setFilter,
  setOpen,
  setUpdateSelected,
  setUpdating,
} from '../state/store';
import { setThirdPartyDisabled } from '../services/entries';
import { getContext } from '../services/tavern';
import { deleteExtension, updateExtensions } from '../services/updates';
import type { ExtensionEntry } from '../types';

const state = extensionManagerState;
const overlayRef = ref<HTMLDivElement | null>(null);
const modalRef = ref<HTMLDivElement | null>(null);
const dragging = ref(false);
const dragged = ref(false);
const justDragged = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const position = ref({ x: 0, y: 0 });
const deleteTarget = ref<ExtensionEntry | null>(null);
const deleting = ref(false);

const filteredEntries = computed(() => {
  const keyword = state.filter.trim().toLowerCase();
  if (!keyword) {
    return state.entries;
  }
  return state.entries.filter(entry => {
    const name = entry.displayName ?? entry.name;
    return name.toLowerCase().includes(keyword) || entry.name.toLowerCase().includes(keyword);
  });
});

const updateCandidates = computed(() =>
  state.entries.filter(entry => entry.update?.status === 'update-available'),
);

const updateCount = computed(() => updateCandidates.value.length);

const selectedUpdates = computed(() =>
  updateCandidates.value.filter(entry => state.updateSelection[entry.name]),
);

const selectedCount = computed(() => selectedUpdates.value.length);

const modalStyle = computed(() => {
  if (!dragged.value) {
    return {};
  }
  return {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
  };
});

function clampPosition(nextX: number, nextY: number) {
  const rect = modalRef.value?.getBoundingClientRect();
  if (!rect) {
    return { x: nextX, y: nextY };
  }
  const padding = 8;
  const win = window.parent ?? window;
  const maxX = win.innerWidth - rect.width - padding;
  const maxY = win.innerHeight - rect.height - padding;
  return {
    x: Math.min(Math.max(padding, nextX), Math.max(padding, maxX)),
    y: Math.min(Math.max(padding + 20, nextY), Math.max(padding + 20, maxY)),
  };
}

function onDragStart(event: PointerEvent) {
  if (window.matchMedia('(max-width: 640px)').matches) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const rect = modalRef.value?.getBoundingClientRect();
  if (!rect) {
    return;
  }
  dragged.value = true;
  dragging.value = true;
  justDragged.value = true;
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  const pos = clampPosition(rect.left, rect.top);
  position.value = pos;
  (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  window.setTimeout(() => {
    justDragged.value = false;
  }, 200);
}

function onDragMove(event: PointerEvent) {
  if (!dragging.value) {
    return;
  }
  event.preventDefault();
  const nextX = event.clientX - dragOffset.value.x;
  const nextY = event.clientY - dragOffset.value.y;
  position.value = clampPosition(nextX, nextY);
}

function onDragEnd(event: PointerEvent) {
  if (!dragging.value) {
    return;
  }
  dragging.value = false;
  (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
}

function onOverlayClick(event: MouseEvent) {
  if (justDragged.value) {
    return;
  }
  if (event.target === event.currentTarget) {
    close();
  }
}

function close() {
  setOpen(false);
}

function refresh() {
  extensionManagerActions.refresh();
}

function reloadPage() {
  (window.parent ?? window).location?.reload();
}

function toggleUpdateSelection(name: string) {
  const next = !state.updateSelection[name];
  setUpdateSelected(name, next);
}

function selectAllUpdates() {
  updateCandidates.value.forEach(entry => setUpdateSelected(entry.name, true));
}

function clearUpdates() {
  clearUpdateSelection();
}

async function updateSelected() {
  const targets =
    selectedCount.value > 0 ? selectedUpdates.value.map(entry => entry.name) : updateCandidates.value.map(entry => entry.name);
  if (!targets.length || state.updating) {
    return;
  }
  setUpdating(true);
  try {
    await updateExtensions(targets);
  } finally {
    setUpdating(false);
    refresh();
  }
}

function requestDelete(entry: ExtensionEntry) {
  if (entry.kind !== 'third-party') {
    return;
  }
  deleteTarget.value = entry;
}

function cancelDelete() {
  deleteTarget.value = null;
}

async function confirmDelete() {
  const target = deleteTarget.value;
  if (!target || deleting.value) {
    return;
  }
  deleting.value = true;
  try {
    const ok = await deleteExtension(target.name);
    if (ok) {
      refresh();
    }
  } finally {
    deleting.value = false;
    deleteTarget.value = null;
  }
}

function toggleEntry(entry: ExtensionEntry) {
  if (entry.kind !== 'third-party') {
    return;
  }
  const ctx = getContext();
  const nextDisabled = entry.status === 'enabled';
  setThirdPartyDisabled(ctx, entry.name, nextDisabled);
  entry.status = nextDisabled ? 'disabled' : 'enabled';
}

watch(
  () => state.open,
  async open => {
    if (!open) {
      dragging.value = false;
      dragged.value = false;
      return;
    }
    await nextTick();
    dragged.value = false;
    if (state.filter) {
      setFilter('');
    }
    syncOverlaySize();
  },
);

onMounted(() => {
  const host = window.parent ?? window;
  host.addEventListener('pointermove', onDragMove);
  host.addEventListener('pointerup', onDragEnd);
  host.addEventListener('pointercancel', onDragEnd);
  host.addEventListener('resize', syncOverlaySize);
  host.addEventListener('orientationchange', syncOverlaySize);
  syncOverlaySize();
});

onUnmounted(() => {
  const host = window.parent ?? window;
  host.removeEventListener('pointermove', onDragMove);
  host.removeEventListener('pointerup', onDragEnd);
  host.removeEventListener('pointercancel', onDragEnd);
  host.removeEventListener('resize', syncOverlaySize);
  host.removeEventListener('orientationchange', syncOverlaySize);
});

function syncOverlaySize() {
  const overlay = overlayRef.value;
  if (!overlay) {
    return;
  }
  const host = window.parent ?? window;
  overlay.style.setProperty('--em-viewport-w', `${host.innerWidth}px`);
  overlay.style.setProperty('--em-viewport-h', `${host.innerHeight}px`);
}
</script>

<template>
  <div v-if="state.open" ref="overlayRef" class="em-overlay" @click="onOverlayClick">
    <div
      ref="modalRef"
      class="em-modal"
      :class="{ dragged: dragged }"
      :style="modalStyle"
      @click.stop
    >
      <div class="em-root">
        <div class="em-header">
          <div class="em-dragbar" @pointerdown="onDragStart"></div>
          <div class="em-title">扩展管理器</div>
          <div class="em-actions">
            <button class="em-close icon-only" title="关闭" @click.stop="close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        <div class="em-body">
          <input
            class="em-search"
            :value="state.filter"
            placeholder="搜索扩展名称..."
            @input="setFilter(($event.target as HTMLInputElement).value)"
          />
          <div class="em-toolbar-row">
            <div class="em-hint">切换会写入 disabledExtensions，重载后生效。</div>
            <div class="em-toolbar">
              <button class="em-btn icon-only" title="刷新列表" @click="refresh">
                <i class="fa-solid fa-rotate"></i>
              </button>
              <button
                class="em-btn icon-only"
                :class="{ 'has-badge': updateCount > 0 }"
                :data-count="updateCount"
                :title="selectedCount > 0 ? `更新所选 ${selectedCount} 个` : `更新全部 ${updateCount} 个`"
                @click="updateSelected"
              >
                <i class="fa-solid fa-cloud-arrow-down"></i>
              </button>
              <button class="em-btn icon-only" title="全选可更新" @click="selectAllUpdates">
                <i class="fa-solid fa-square-check"></i>
              </button>
              <button class="em-btn icon-only" title="清空选择" @click="clearUpdates">
                <i class="fa-solid fa-square-minus"></i>
              </button>
              <button class="em-btn primary icon-only" title="重载页面" @click="reloadPage">
                <i class="fa-solid fa-arrow-rotate-right"></i>
              </button>
            </div>
          </div>
          <div v-if="state.loading" class="em-loading">加载中...</div>
        </div>
        <div class="em-list">
          <div v-if="!filteredEntries.length" class="em-empty">没有匹配项。</div>
          <div v-for="entry in filteredEntries" :key="entry.name" class="em-item">
            <div>
              <div class="em-item-name">
                {{ entry.displayName ?? entry.name }}
                <span v-if="entry.kind === 'core'" class="em-tag core">核心</span>
                <span v-if="entry.update?.status === 'update-available'" class="em-update-pill" title="有更新">
                  <i class="fa-solid fa-circle-up"></i>
                </span>
              </div>
              <div v-if="entry.displayName" class="em-item-meta">目录名：{{ entry.name }}</div>
              <div class="em-item-meta">第三方标识：{{ entry.kind }}</div>
              <div class="em-status" :class="entry.status">
                {{ entry.status === 'enabled' ? '已启用' : '已禁用' }}
              </div>
            </div>
            <div class="em-item-actions">
              <button
                class="em-action-delete"
                :disabled="entry.kind !== 'third-party'"
                title="删除扩展"
                @click.stop="requestDelete(entry)"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
              <button
                v-if="entry.update?.status === 'update-available'"
                class="em-update-select"
                :class="{ selected: !!state.updateSelection[entry.name] }"
                :title="state.updateSelection[entry.name] ? '已加入更新队列' : '加入更新队列'"
                @click="toggleUpdateSelection(entry.name)"
              >
                <i
                  class="fa-solid"
                  :class="state.updateSelection[entry.name] ? 'fa-square-check' : 'fa-square'"
                ></i>
              </button>
              <button
                class="em-toggle-switch"
                :class="{ on: entry.status === 'enabled' }"
                :disabled="entry.kind !== 'third-party'"
                role="switch"
                :aria-checked="entry.status === 'enabled'"
                @click.stop="toggleEntry(entry)"
                :title="entry.status === 'enabled' ? '禁用' : '启用'"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="deleteTarget" class="em-confirm">
    <div class="em-confirm-card">
      <div class="em-confirm-title">确认删除扩展？</div>
      <div class="em-confirm-desc">{{ deleteTarget.displayName ?? deleteTarget.name }}</div>
      <div class="em-confirm-actions">
        <button class="em-btn" @click="cancelDelete">取消</button>
        <button class="em-btn danger" :disabled="deleting" @click="confirmDelete">删除</button>
      </div>
    </div>
  </div>
</template>
