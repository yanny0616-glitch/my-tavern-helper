<template>
  <div class="macro-item__row">
    <div class="macro-item__name">{{ macro.name || '未命名' }}</div>
    <div class="macro-item__actions">
      <button
        class="macro-icon-btn"
        type="button"
        :aria-label="macro.pinned ? '取消收藏' : '收藏'"
        :title="macro.pinned ? '取消收藏' : '收藏'"
        @click.stop="emit('pin', macro.id)"
      >
        <i
          class="macro-icon"
          :class="macro.pinned ? 'fa-solid fa-star is-pinned' : 'fa-regular fa-star'"
          aria-hidden="true"
        ></i>
      </button>

      <template v-if="mode === 'active'">
        <button
          class="macro-icon-btn"
          type="button"
          aria-label="复制"
          title="复制"
          @click.stop="emit('duplicate', macro.id)"
        >
          <i class="macro-icon fa-regular fa-copy" aria-hidden="true"></i>
        </button>
        <button
          class="macro-icon-btn"
          type="button"
          aria-label="移出列表"
          title="移出列表"
          @click.stop="emit('hide', macro.id)"
        >
          <i class="macro-icon fa-regular fa-eye-slash" aria-hidden="true"></i>
        </button>
      </template>
      <template v-else>
        <button
          class="macro-icon-btn"
          type="button"
          :aria-label="macro.enabled ? '移出快捷回复' : '加入快捷回复'"
          :title="macro.enabled ? '移出快捷回复' : '加入快捷回复'"
          @click.stop="emit('toggle', macro.id)"
        >
          <i
            class="macro-icon"
            :class="macro.enabled ? 'fa-solid fa-minus' : 'fa-solid fa-plus'"
            aria-hidden="true"
          ></i>
        </button>
        <button
          class="macro-icon-btn"
          type="button"
          aria-label="编辑"
          title="编辑"
          @click.stop="emit('edit', macro.id)"
        >
          <i class="macro-icon fa-regular fa-pen-to-square" aria-hidden="true"></i>
        </button>
        <button
          class="macro-icon-btn"
          type="button"
          aria-label="删除"
          title="删除"
          @click.stop="emit('delete', macro.id)"
        >
          <i class="macro-icon fa-regular fa-trash-can" aria-hidden="true"></i>
        </button>
      </template>
    </div>
  </div>
  <div class="macro-item__meta">
    <span class="macro-tag">
      <i class="macro-icon fa-solid" :class="macro.scope === 'global' ? 'fa-globe' : 'fa-user'" aria-hidden="true"></i>
      {{ macro.scope === 'global' ? '全局' : '角色' }}
    </span>
    <span v-if="macro.scope === 'character' && characterLabel" class="macro-tag">
      <i class="macro-icon fa-regular fa-id-badge" aria-hidden="true"></i>
      {{ characterLabel }}
    </span>
    <span v-if="macro.send" class="macro-tag">
      <i class="macro-icon fa-regular fa-paper-plane" aria-hidden="true"></i>
      发送
    </span>
    <span v-if="macro.append" class="macro-tag">
      <i class="macro-icon fa-solid fa-plus" aria-hidden="true"></i>
      追加
    </span>
    <span v-if="!macro.send && !macro.append" class="macro-tag">
      <i class="macro-icon fa-regular fa-square" aria-hidden="true"></i>
      覆盖
    </span>
    <span v-if="!macro.newline" class="macro-tag">
      <i class="macro-icon fa-solid fa-ban" aria-hidden="true"></i>
      无换行
    </span>
    <span v-if="!macro.enabled" class="macro-tag">
      <i class="macro-icon fa-regular fa-eye-slash" aria-hidden="true"></i>
      未显示
    </span>
  </div>
</template>

<script setup lang="ts">
import type { Macro } from './context';

defineProps<{ macro: Macro; mode: 'active' | 'library'; characterLabel?: string }>();
const emit = defineEmits<{
  (event: 'pin', id: string): void;
  (event: 'duplicate', id: string): void;
  (event: 'hide', id: string): void;
  (event: 'toggle', id: string): void;
  (event: 'edit', id: string): void;
  (event: 'delete', id: string): void;
}>();
</script>
