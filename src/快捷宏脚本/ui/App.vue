<template>
  <div class="macro-root" :class="{ open: visible }">
    <div class="macro-backdrop" @click="close" />
    <section class="macro-panel" role="dialog" aria-label="快捷语句管理">
      <header class="macro-header">
        <div class="macro-title">
          <div class="macro-title__main">快捷语句管理</div>
          <div class="macro-title__sub">更新后会同步脚本按钮，支持发送/追加/换行控制。</div>
        </div>
        <div class="macro-header-actions">
          <button class="macro-icon-btn" type="button" aria-label="配色" @click="themeOpen = true">
            <i class="fa-solid fa-palette" aria-hidden="true"></i>
          </button>
          <button class="macro-close" type="button" @click="close">关闭</button>
        </div>
      </header>

      <div class="macro-body">
        <aside class="macro-sidebar">
          <div class="macro-section-title">快捷语句列表</div>
          <div class="macro-list">
            <button
              v-for="macro in macros"
              :key="macro.id"
              class="macro-item"
              :class="{ active: macro.id === selectedId }"
              type="button"
              @click="selectMacro(macro.id)"
            >
              <div class="macro-item__row">
                <div class="macro-item__name">{{ macro.name || '未命名' }}</div>
                <div class="macro-item__actions">
                  <button class="macro-icon-btn" type="button" aria-label="复制" @click.stop="duplicateItem(macro.id)">
                    <i class="fa-solid fa-copy" aria-hidden="true"></i>
                  </button>
                  <button class="macro-icon-btn" type="button" aria-label="删除" @click.stop="removeItem(macro.id)">
                    <i class="fa-solid fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              <div class="macro-item__meta">
                <span>{{ macro.scope === 'global' ? '全局' : '角色' }}</span>
                <span v-if="macro.send">发送</span>
                <span v-if="macro.append"> · 追加</span>
                <span v-if="!macro.newline"> · 无换行</span>
                <span v-if="!macro.send && !macro.append && macro.newline">默认</span>
              </div>
            </button>
          </div>
          <div class="macro-actions">
            <button class="macro-btn" type="button" @click="addMacro">新增</button>
          </div>
        </aside>

        <main class="macro-content">
          <div class="macro-field">
            <div class="macro-section-title">编辑快捷语句</div>
            <label>名称</label>
            <input
              v-if="selectedMacro"
              class="macro-input"
              data-focus="name"
              v-model="selectedMacro.name"
              placeholder="例如：继续"
            />
            <div v-else class="macro-empty">请选择左侧语句</div>
          </div>

          <div v-if="selectedMacro" class="macro-field">
            <label>内容</label>
            <textarea class="macro-textarea" v-model="selectedMacro.content" placeholder="输入要插入的文本"></textarea>
          </div>

          <div v-if="selectedMacro" class="macro-field">
            <label>作用范围</label>
            <div class="macro-scope-row">
              <select v-model="selectedMacro.scope" class="macro-select">
                <option value="global">全局快捷回复</option>
                <option value="character">角色快捷回复</option>
              </select>
              <button
                v-if="selectedMacro.scope === 'character'"
                class="macro-btn is-ghost"
                type="button"
                @click="bindCurrentCharacter"
              >
                绑定当前角色
              </button>
              <span v-if="selectedMacro.scope === 'character'" class="macro-scope-hint">
                {{ currentCharacterLabel }}
              </span>
            </div>
          </div>

          <div v-if="selectedMacro" class="macro-toggle-row">
            <label class="macro-toggle"><input type="checkbox" v-model="selectedMacro.send" /> 自动发送</label>
            <label class="macro-toggle"><input type="checkbox" v-model="selectedMacro.append" /> 追加到输入框</label>
            <label class="macro-toggle"><input type="checkbox" v-model="selectedMacro.newline" /> 自动换行</label>
            <button class="macro-btn is-ghost" type="button" :disabled="!selectedMacro" @click="moveMacro(-1)">
              上移
            </button>
            <button class="macro-btn is-ghost" type="button" :disabled="!selectedMacro" @click="moveMacro(1)">
              下移
            </button>
          </div>
        </main>
      </div>

      <footer class="macro-footer">
        <button class="macro-btn is-ghost" type="button" @click="close">取消</button>
        <button class="macro-btn is-primary" type="button" @click="save">保存</button>
      </footer>
    </section>

    <div v-if="themeOpen" class="macro-theme-modal" @click.self="themeOpen = false">
      <section class="macro-theme-panel" role="dialog" aria-label="主题配色设置">
        <header class="macro-theme-header">
          <div>
            <div class="macro-theme-title">主题配色</div>
            <div class="macro-theme-sub">选择预设或手动微调颜色</div>
          </div>
          <button class="macro-close" type="button" @click="themeOpen = false">关闭</button>
        </header>

        <div class="macro-theme-body">
          <div class="macro-theme-presets">
            <button
              v-for="preset in themePresets"
              :key="preset.name"
              class="macro-theme-preset"
              type="button"
              @click="applyPreset(preset.colors)"
            >
              <span class="macro-theme-dot" :style="{ background: preset.colors.accent }"></span>
              {{ preset.name }}
            </button>
          </div>

          <div class="macro-theme-grid">
            <div class="macro-theme-item">
              <span>背景</span>
              <input type="color" v-model="theme.bg" />
            </div>
            <div class="macro-theme-item">
              <span>面板</span>
              <input type="color" v-model="theme.surface" />
            </div>
            <div class="macro-theme-item">
              <span>面板辅助</span>
              <input type="color" v-model="theme.surfaceAlt" />
            </div>
            <div class="macro-theme-item">
              <span>文字</span>
              <input type="color" v-model="theme.text" />
            </div>
            <div class="macro-theme-item">
              <span>次级文字</span>
              <input type="color" v-model="theme.textMuted" />
            </div>
            <div class="macro-theme-item">
              <span>强调色</span>
              <input type="color" v-model="theme.accent" />
            </div>
            <div class="macro-theme-item">
              <span>边框</span>
              <input type="color" v-model="theme.border" />
            </div>
          </div>
        </div>

        <footer class="macro-theme-footer">
          <button class="macro-btn is-ghost" type="button" @click="resetTheme">恢复默认主题</button>
          <button class="macro-btn is-primary" type="button" @click="themeOpen = false">完成</button>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';

import { MacroUiKey } from './context';
import type { MacroUiContext, Theme } from './context';

const ctx = inject<MacroUiContext>(MacroUiKey);
if (!ctx) {
  throw new Error('Macro UI context missing.');
}

const {
  visible,
  macros,
  theme,
  selectedId,
  selectedMacro,
  selectMacro,
  currentCharacterLabel,
  bindCurrentCharacter,
  close,
  addMacro,
  duplicateMacro,
  removeMacro,
  moveMacro,
  resetTheme,
  save,
} = ctx;

const themeOpen = ref(false);
const themePresets: { name: string; colors: Theme }[] = [
  {
    name: '白天',
    colors: {
      bg: '#f6f1ea',
      surface: '#ffffff',
      surfaceAlt: '#f1ebe4',
      text: '#1c1c1c',
      textMuted: '#6a5f54',
      accent: '#d9934f',
      border: '#e3d6c9',
    },
  },
  {
    name: '夜晚',
    colors: {
      bg: '#0f1115',
      surface: '#1b1f27',
      surfaceAlt: '#232836',
      text: '#f5f5f7',
      textMuted: '#a7b0c0',
      accent: '#4cc3ff',
      border: '#2f3647',
    },
  },
  {
    name: '雾蓝',
    colors: {
      bg: '#e8eef6',
      surface: '#f7f9fc',
      surfaceAlt: '#e3ecf7',
      text: '#1b2533',
      textMuted: '#5b6b7f',
      accent: '#5e8cff',
      border: '#c8d6ea',
    },
  },
  {
    name: '琥珀',
    colors: {
      bg: '#f7efe4',
      surface: '#fff7ee',
      surfaceAlt: '#f4e3d0',
      text: '#2a1f17',
      textMuted: '#6f5a4a',
      accent: '#c9783b',
      border: '#e3c9b2',
    },
  },
];

const applyPreset = (colors: Theme) => {
  theme.value = { ...colors };
};

const duplicateItem = (id: string) => {
  selectMacro(id);
  duplicateMacro();
};

const removeItem = (id: string) => {
  selectMacro(id);
  removeMacro();
};
</script>
