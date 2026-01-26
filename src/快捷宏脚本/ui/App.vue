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
          <button class="macro-icon-btn" type="button" aria-label="宏库" title="宏库" @click="openLibrary(true)">
            <i class="macro-icon fa-solid fa-layer-group" aria-hidden="true"></i>
          </button>
          <button class="macro-icon-btn" type="button" aria-label="配色" title="配色" @click="themeOpen = true">
            <i class="macro-icon fa-solid fa-palette" aria-hidden="true"></i>
          </button>
          <button class="macro-close" type="button" aria-label="关闭" title="关闭" @click="close">
            <i class="macro-icon fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      </header>

      <div class="macro-body">
        <aside class="macro-sidebar">
          <div class="macro-section-title">快捷语句列表</div>
          <div class="macro-list">
            <template v-if="!activeGrouped.global.length && !activeGrouped.character.length">
              <div class="macro-empty-list">
                当前没有显示的快捷语句
                <button class="macro-btn is-ghost" type="button" @click="openLibrary(true)">打开宏库</button>
              </div>
            </template>
            <template v-else>
              <div v-if="activeGrouped.global.length" class="macro-subtitle">全局</div>
              <div v-if="activeGrouped.global.length" class="macro-group">
                <div
                  v-for="macro in activeGrouped.global"
                  :key="macro.id"
                  class="macro-item"
                  :class="{ active: macro.id === selectedId }"
                  @click="selectMacro(macro.id)"
                  role="button"
                  tabindex="0"
                  @keydown.enter.prevent="selectMacro(macro.id)"
                  @keydown.space.prevent="selectMacro(macro.id)"
                >
                  <MacroListItem
                    :macro="macro"
                    mode="active"
                    :character-label="getMacroCharacterLabel(macro)"
                    @pin="togglePinned"
                    @duplicate="duplicateItem"
                    @hide="hideFromList"
                  />
                </div>
              </div>
              <div v-if="activeGrouped.character.length" class="macro-subtitle">角色</div>
              <div v-if="activeGrouped.character.length" class="macro-group">
                <div
                  v-for="macro in activeGrouped.character"
                  :key="macro.id"
                  class="macro-item"
                  :class="{ active: macro.id === selectedId }"
                  @click="selectMacro(macro.id)"
                  role="button"
                  tabindex="0"
                  @keydown.enter.prevent="selectMacro(macro.id)"
                  @keydown.space.prevent="selectMacro(macro.id)"
                >
                  <MacroListItem
                    :macro="macro"
                    mode="active"
                    :character-label="getMacroCharacterLabel(macro)"
                    @pin="togglePinned"
                    @duplicate="duplicateItem"
                    @hide="hideFromList"
                  />
                </div>
              </div>
            </template>
          </div>
          <div class="macro-actions">
            <button class="macro-btn" type="button" @click="addMacro">
              <i class="macro-icon fa-solid fa-plus" aria-hidden="true"></i>
              新增
            </button>
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
            <textarea
              ref="contentRef"
              class="macro-textarea"
              v-model="selectedMacro.content"
              placeholder="输入要插入的文本"
              @input="resizeContent"
            ></textarea>
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
            <label class="macro-toggle">发送方式</label>
            <select v-model="actionMode" class="macro-select">
              <option value="send">直接发送</option>
              <option value="append">追加到输入框</option>
              <option value="replace">覆盖输入框</option>
            </select>
            <label class="macro-toggle"><input type="checkbox" v-model="selectedMacro.newline" /> 自动换行</label>
            <button class="macro-btn is-ghost" type="button" :disabled="!selectedMacro" @click="moveMacro(-1)">
              <i class="macro-icon fa-solid fa-arrow-up" aria-hidden="true"></i>
              上移
            </button>
            <button class="macro-btn is-ghost" type="button" :disabled="!selectedMacro" @click="moveMacro(1)">
              <i class="macro-icon fa-solid fa-arrow-down" aria-hidden="true"></i>
              下移
            </button>
          </div>
        </main>
      </div>

      <footer class="macro-footer">
        <button class="macro-btn is-ghost" type="button" @click="close">
          <i class="macro-icon fa-solid fa-xmark" aria-hidden="true"></i>
          取消
        </button>
        <button class="macro-btn is-primary" type="button" @click="save">
          <i class="macro-icon fa-solid fa-check" aria-hidden="true"></i>
          保存
        </button>
      </footer>
    </section>

    <div v-if="libraryOpen" class="macro-library-modal" @click.self="libraryOpen = false">
      <section class="macro-library-panel" role="dialog" aria-label="宏库管理">
        <header class="macro-library-header">
          <div>
            <div class="macro-theme-title">宏库管理</div>
            <div class="macro-theme-sub">在这里选择需要显示在快捷回复的内容</div>
          </div>
          <button class="macro-close" type="button" aria-label="关闭" title="关闭" @click="libraryOpen = false">
            <i class="macro-icon fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </header>

        <div class="macro-library-body">
          <div class="macro-search">
            <i class="macro-icon fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input v-model="searchTerm" class="macro-search-input" placeholder="搜索名称或内容" />
            <button v-if="searchTerm" class="macro-icon-btn is-ghost" type="button" aria-label="清除" @click="searchTerm = ''">
              <i class="macro-icon fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
          <div class="macro-filters">
            <button class="macro-filter-chip" :class="{ active: scopeFilter === 'all' }" type="button" @click="scopeFilter = 'all'">
              全部
            </button>
            <button
              class="macro-filter-chip"
              :class="{ active: scopeFilter === 'global' }"
              type="button"
              @click="scopeFilter = 'global'"
            >
              全局
            </button>
            <button
              class="macro-filter-chip"
              :class="{ active: scopeFilter === 'character' }"
              type="button"
              @click="scopeFilter = 'character'"
            >
              角色
            </button>
            <button class="macro-filter-chip" :class="{ active: onlyPinned }" type="button" @click="onlyPinned = !onlyPinned">
              <i class="macro-icon fa-solid fa-star" aria-hidden="true"></i>
              收藏
            </button>
            <button class="macro-filter-chip" :class="{ active: onlyRecent }" type="button" @click="onlyRecent = !onlyRecent">
              <i class="macro-icon fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
              最近
            </button>
          </div>

          <div class="macro-library-grid" :class="{ 'is-editing': !!librarySelectedMacro }">
            <div class="macro-library-list">
              <div class="macro-list">
            <template v-if="onlyRecent">
              <div class="macro-subtitle">最近使用</div>
              <div class="macro-group">
                <div
                  v-for="macro in recentMacros"
                  :key="macro.id"
                  class="macro-item"
                  :class="{ active: macro.id === librarySelectedId }"
                  @click="selectLibraryMacro(macro.id)"
                  role="button"
                  tabindex="0"
                  @keydown.enter.prevent="selectLibraryMacro(macro.id)"
                  @keydown.space.prevent="selectLibraryMacro(macro.id)"
                >
                  <MacroListItem
                    :macro="macro"
                    mode="library"
                    :character-label="getMacroCharacterLabel(macro)"
                    @pin="togglePinned"
                    @toggle="toggleEnabled"
                    @edit="editFromLibrary"
                    @delete="deleteItem"
                  />
                </div>
                <div v-if="!recentMacros.length" class="macro-empty-list">暂无最近使用</div>
              </div>
            </template>
            <template v-else>
              <template v-if="showRecentSection">
                <div class="macro-subtitle">最近使用</div>
                <div class="macro-group">
                  <div
                    v-for="macro in recentPreview"
                    :key="macro.id"
                    class="macro-item"
                    :class="{ active: macro.id === librarySelectedId }"
                    @click="selectLibraryMacro(macro.id)"
                    role="button"
                    tabindex="0"
                    @keydown.enter.prevent="selectLibraryMacro(macro.id)"
                    @keydown.space.prevent="selectLibraryMacro(macro.id)"
                  >
                    <MacroListItem
                      :macro="macro"
                      mode="library"
                      :character-label="getMacroCharacterLabel(macro)"
                      @pin="togglePinned"
                      @toggle="toggleEnabled"
                      @edit="editFromLibrary"
                      @delete="deleteItem"
                    />
                  </div>
                </div>
              </template>
              <div v-if="groupedMacros.global.length" class="macro-subtitle">全局</div>
              <div v-if="groupedMacros.global.length" class="macro-group">
                <div
                  v-for="macro in groupedMacros.global"
                  :key="macro.id"
                  class="macro-item"
                  :class="{ active: macro.id === librarySelectedId }"
                  @click="selectLibraryMacro(macro.id)"
                  role="button"
                  tabindex="0"
                  @keydown.enter.prevent="selectLibraryMacro(macro.id)"
                  @keydown.space.prevent="selectLibraryMacro(macro.id)"
                >
                  <MacroListItem
                    :macro="macro"
                    mode="library"
                    :character-label="getMacroCharacterLabel(macro)"
                    @pin="togglePinned"
                    @toggle="toggleEnabled"
                    @edit="editFromLibrary"
                    @delete="deleteItem"
                  />
                </div>
              </div>
              <div v-if="groupedMacros.character.length" class="macro-subtitle">角色</div>
              <div v-if="groupedMacros.character.length" class="macro-group">
                <div
                  v-for="macro in groupedMacros.character"
                  :key="macro.id"
                  class="macro-item"
                  :class="{ active: macro.id === librarySelectedId }"
                  @click="selectLibraryMacro(macro.id)"
                  role="button"
                  tabindex="0"
                  @keydown.enter.prevent="selectLibraryMacro(macro.id)"
                  @keydown.space.prevent="selectLibraryMacro(macro.id)"
                >
                  <MacroListItem
                    :macro="macro"
                    mode="library"
                    :character-label="getMacroCharacterLabel(macro)"
                    @pin="togglePinned"
                    @toggle="toggleEnabled"
                    @edit="editFromLibrary"
                    @delete="deleteItem"
                  />
                </div>
              </div>
              <div v-if="!groupedMacros.global.length && !groupedMacros.character.length" class="macro-empty-list">
                没有匹配的快捷语句
              </div>
            </template>
              </div>
            </div>

            <div v-if="librarySelectedMacro" class="macro-library-editor">
              <div class="macro-editor">
                <div class="macro-section-title">编辑宏</div>
                <div class="macro-field">
                  <label>名称</label>
                  <input class="macro-input" v-model="librarySelectedMacro.name" placeholder="例如：继续" />
                </div>

                <div class="macro-field">
                  <label>内容</label>
                  <textarea
                    ref="libraryContentRef"
                    class="macro-textarea"
                    v-model="librarySelectedMacro.content"
                    placeholder="输入要插入的文本"
                    @input="resizeLibraryContent"
                  ></textarea>
                </div>

                <div class="macro-field">
                  <label>作用范围</label>
                  <div class="macro-scope-row">
                    <select v-model="librarySelectedMacro.scope" class="macro-select">
                      <option value="global">全局快捷回复</option>
                      <option value="character">角色快捷回复</option>
                    </select>
                    <button
                      v-if="librarySelectedMacro.scope === 'character'"
                      class="macro-btn is-ghost"
                      type="button"
                      @click="bindCurrentCharacterToLibrary"
                    >
                      绑定当前角色
                    </button>
                    <span v-if="librarySelectedMacro.scope === 'character'" class="macro-scope-hint">
                      {{ getMacroCharacterLabel(librarySelectedMacro) }}
                    </span>
                  </div>
                </div>

                <div class="macro-toggle-row">
                  <label class="macro-toggle">发送方式</label>
                  <select v-model="libraryActionMode" class="macro-select">
                    <option value="send">直接发送</option>
                    <option value="append">追加到输入框</option>
                    <option value="replace">覆盖输入框</option>
                  </select>
                  <label class="macro-toggle">
                    <input type="checkbox" v-model="librarySelectedMacro.newline" />
                    自动换行
                  </label>
                  <label class="macro-toggle">
                    <input type="checkbox" v-model="librarySelectedMacro.enabled" />
                    显示在快捷回复
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="macro-library-footer">
          <button class="macro-btn is-ghost" type="button" @click="addFromLibrary">
            <i class="macro-icon fa-solid fa-plus" aria-hidden="true"></i>
            新增
          </button>
          <button class="macro-btn is-primary" type="button" @click="libraryOpen = false">完成</button>
        </footer>
      </section>
    </div>

    <div v-if="themeOpen" class="macro-theme-modal" @click.self="themeOpen = false">
      <section class="macro-theme-panel" role="dialog" aria-label="主题配色设置">
        <header class="macro-theme-header">
          <div>
            <div class="macro-theme-title">主题配色</div>
            <div class="macro-theme-sub">选择预设或手动微调颜色</div>
          </div>
          <button class="macro-close" type="button" aria-label="关闭" title="关闭" @click="themeOpen = false">
            <i class="macro-icon fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
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
import { computed, inject, nextTick, ref, watch } from 'vue';

import { MacroUiKey } from './context';
import type { Macro, MacroUiContext } from './context';
import { getCurrentCharacterId } from '../integration/character';
import { getUniqueName } from '../core/macros';
import MacroListItem from './MacroListItem.vue';
import { themePresets } from './theme-presets';

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
const libraryOpen = ref(false);
const librarySelectedId = ref<string | null>(null);
const searchTerm = ref('');
const scopeFilter = ref<'all' | 'global' | 'character'>('all');
const onlyPinned = ref(false);
const onlyRecent = ref(false);
const contentRef = ref<HTMLTextAreaElement | null>(null);
const libraryContentRef = ref<HTMLTextAreaElement | null>(null);

const normalizedSearch = computed(() => searchTerm.value.trim().toLowerCase());
const matchesMacro = (macro: Macro) => {
  const query = normalizedSearch.value;
  if (query) {
    const haystack = `${macro.name} ${macro.content}`.toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }
  if (scopeFilter.value !== 'all' && macro.scope !== scopeFilter.value) {
    return false;
  }
  if (onlyPinned.value && !macro.pinned) {
    return false;
  }
  return true;
};

const filteredMacros = computed(() => macros.value.filter(matchesMacro));
const activeMacros = computed(() => macros.value.filter(macro => macro.enabled));
const recentAll = computed(() =>
  macros.value.filter(macro => macro.lastUsedAt > 0).sort((a, b) => b.lastUsedAt - a.lastUsedAt),
);
const recentMacros = computed(() => recentAll.value.filter(matchesMacro));
const recentPreview = computed(() => recentMacros.value.slice(0, 5));
const showRecentSection = computed(() => !onlyRecent.value && !normalizedSearch.value && recentPreview.value.length > 0);

const orderPinnedFirst = (list: Macro[]) => {
  const pinned = list.filter(macro => macro.pinned);
  const rest = list.filter(macro => !macro.pinned);
  return [...pinned, ...rest];
};

const groupedMacros = computed(() => ({
  global: orderPinnedFirst(filteredMacros.value.filter(macro => macro.scope === 'global')),
  character: orderPinnedFirst(filteredMacros.value.filter(macro => macro.scope === 'character')),
}));

const activeGrouped = computed(() => ({
  global: orderPinnedFirst(activeMacros.value.filter(macro => macro.scope === 'global')),
  character: orderPinnedFirst(activeMacros.value.filter(macro => macro.scope === 'character')),
}));

const librarySelectedMacro = computed(() => macros.value.find(macro => macro.id === librarySelectedId.value) ?? null);
const actionMode = computed({
  get() {
    if (!selectedMacro.value) {
      return 'replace';
    }
    if (selectedMacro.value.send) {
      return 'send';
    }
    if (selectedMacro.value.append) {
      return 'append';
    }
    return 'replace';
  },
  set(mode: 'send' | 'append' | 'replace') {
    if (!selectedMacro.value) {
      return;
    }
    selectedMacro.value.send = mode === 'send';
    selectedMacro.value.append = mode === 'append';
  },
});
const applyPreset = (colors: (typeof themePresets)[number]['colors']) => {
  theme.value = { ...colors };
};

const getCharacterLabelById = (id: string) => {
  const idx = Number(id);
  const list = (SillyTavern as any)?.characters as { name?: string }[] | undefined;
  if (!Number.isNaN(idx) && list?.[idx]?.name) {
    return list[idx].name;
  }
  return id ? `角色ID：${id}` : '';
};

const getMacroCharacterLabel = (macro: Macro) => {
  if (macro.scope !== 'character') {
    return '';
  }
  return getCharacterLabelById(macro.characterId);
};

const resizeContent = () => {
  const el = contentRef.value;
  if (!el) {
    return;
  }
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

const resizeLibraryContent = () => {
  const el = libraryContentRef.value;
  if (!el) {
    return;
  }
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

watch(
  () => selectedMacro.value?.content,
  async () => {
    await nextTick();
    resizeContent();
  },
  { immediate: true },
);

watch(
  () => librarySelectedMacro.value?.content,
  async () => {
    await nextTick();
    resizeLibraryContent();
  },
  { immediate: true },
);

watch(
  () => visible.value,
  nextVisible => {
    if (!nextVisible) {
      libraryOpen.value = false;
      themeOpen.value = false;
    }
  },
);

watch(
  () => libraryOpen.value,
  nextOpen => {
    if (!nextOpen && selectedMacro.value && !selectedMacro.value.enabled) {
      selectedId.value = activeMacros.value[0]?.id ?? null;
    }
  },
);

watch(
  () => filteredMacros.value,
  next => {
    if (!libraryOpen.value) {
      return;
    }
    if (!librarySelectedId.value || !next.some(macro => macro.id === librarySelectedId.value)) {
      librarySelectedId.value = null;
    }
  },
  { deep: true },
);

const duplicateItem = (id: string) => {
  selectMacro(id);
  duplicateMacro();
};

const deleteItem = (id: string) => {
  const index = macros.value.findIndex(macro => macro.id === id);
  if (index < 0) {
    return;
  }
  const wasSelectedMain = selectedId.value === id;
  const wasSelectedLibrary = librarySelectedId.value === id;
  macros.value.splice(index, 1);
  if (wasSelectedMain) {
    selectedId.value = activeMacros.value[0]?.id ?? null;
  }
  if (wasSelectedLibrary) {
    librarySelectedId.value = filteredMacros.value[0]?.id ?? null;
  }
};

const togglePinned = (id: string) => {
  const target = macros.value.find(macro => macro.id === id);
  if (!target) {
    return;
  }
  target.pinned = !target.pinned;
};

const toggleEnabled = (id: string) => {
  const target = macros.value.find(macro => macro.id === id);
  if (!target) {
    return;
  }
  target.enabled = !target.enabled;
};

const hideFromList = (id: string) => {
  const target = macros.value.find(macro => macro.id === id);
  if (!target) {
    return;
  }
  target.enabled = false;
  if (selectedId.value === id) {
    selectedId.value = activeMacros.value[0]?.id ?? null;
  }
  if (librarySelectedId.value === id) {
    librarySelectedId.value = null;
  }
};

const editFromLibrary = (id: string) => {
  librarySelectedId.value = id;
};

const selectLibraryMacro = (id: string) => {
  librarySelectedId.value = id;
};

const createMacroDraft = (enabled: boolean, selectInMain: boolean) => {
  const macro: Macro = {
    id: SillyTavern.uuidv4(),
    name: getUniqueName('新快捷语句', macros.value),
    content: '',
    send: false,
    append: false,
    newline: true,
    scope: 'global',
    characterId: '',
    pinned: false,
    lastUsedAt: 0,
    enabled,
  };
  macros.value.push(macro);
  if (selectInMain) {
    selectedId.value = macro.id;
  }
  librarySelectedId.value = macro.id;
};

const addFromLibrary = () => {
  createMacroDraft(false, false);
};

const openLibrary = (resetSelection: boolean) => {
  if (resetSelection) {
    librarySelectedId.value = null;
  }
  libraryOpen.value = true;
};

const libraryActionMode = computed({
  get() {
    if (!librarySelectedMacro.value) {
      return 'replace';
    }
    if (librarySelectedMacro.value.send) {
      return 'send';
    }
    if (librarySelectedMacro.value.append) {
      return 'append';
    }
    return 'replace';
  },
  set(mode: 'send' | 'append' | 'replace') {
    if (!librarySelectedMacro.value) {
      return;
    }
    librarySelectedMacro.value.send = mode === 'send';
    librarySelectedMacro.value.append = mode === 'append';
  },
});

const bindCurrentCharacterToLibrary = () => {
  const current = librarySelectedMacro.value;
  if (!current) {
    return;
  }
  current.scope = 'character';
  current.characterId = getCurrentCharacterId();
};
</script>
