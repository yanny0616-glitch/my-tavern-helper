<template>
  <div class="th-panel">
    <div class="th-header">
      <div class="th-title">
        <span class="th-title__dot"></span>
        记忆索引
      </div>
      <div class="th-tools">
        <button class="th-btn" :class="{ active: isAutoMode }" @click="enableAutoTheme">自动</button>
        <button class="th-btn" @click="toggleManualTheme">
          <i v-if="isDarkMode" class="fa-solid fa-moon"></i>
          <i v-else class="fa-solid fa-sun"></i>
        </button>
      </div>
    </div>

    <section class="th-card">
      <div class="th-card__header">
        <div class="th-card__title">输入</div>
        <button class="th-icon-btn" @click="copyUserInput" title="复制内容">
          <i v-if="!copied" class="fa-regular fa-copy"></i>
          <i v-else class="fa-solid fa-check"></i>
        </button>
      </div>
      <div class="th-card__body" v-html="userInputHtml"></div>
    </section>

    <section class="th-card th-card--collapsible" :class="{ collapsed: recallCollapsed }">
      <div class="th-card__header" @click="toggleRecallSection">
        <div class="th-card__title">回声</div>
        <span class="th-badge">{{ memoryCount }}</span>
        <i class="fa-solid fa-chevron-down th-chevron"></i>
      </div>
      <div class="th-card__body">
        <div class="th-memory-list" v-html="memoryListHtml"></div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const userInputHtml = ref('');
const memoryListHtml = ref('');
const memoryCount = ref(0);
const recallCollapsed = ref(true);
const isAutoMode = ref(true);
const isDarkMode = ref(true);
const copied = ref(false);
const memoriesLoaded = ref(false);

const rawContent = String((window as any).__TH_RAW__ ?? '');
const THEME_STORAGE_KEY = 'th-ui-theme';
const THEME_CHANNEL = 'th-ui-theme-channel';
const THEME_EVENT = 'th-ui-theme-event';

function updateThemeUI() {
  const body = document.body;
  if (isDarkMode.value) {
    body.classList.remove('theme-light');
    body.classList.add('theme-dark');
  } else {
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
  }
  syncThemeState();
}

function checkTimeAndApplyAuto() {
  if (!isAutoMode.value) return;
  const hour = new Date().getHours();
  const isDayTime = hour >= 6 && hour < 18;
  isDarkMode.value = !isDayTime;
  updateThemeUI();
}

function enableAutoTheme() {
  isAutoMode.value = true;
  checkTimeAndApplyAuto();
}

function toggleManualTheme() {
  isAutoMode.value = false;
  isDarkMode.value = !isDarkMode.value;
  updateThemeUI();
}

function updateIframeHeight() {
  setTimeout(() => {
    const bodyHeight = document.body.scrollHeight;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'resizeIframe', height: bodyHeight }, '*');
    }
  }, 50);
}

async function toggleRecallSection() {
  recallCollapsed.value = !recallCollapsed.value;
  if (!recallCollapsed.value && !memoriesLoaded.value) {
    await loadMemories();
    memoriesLoaded.value = true;
  }
  updateIframeHeight();
}

function escapeHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function parseUserInput(content: string) {
  const match = content.match(/<本轮用户输入>([\s\S]*?)<\/本轮用户输入>/);
  return match ? match[1].replace(/^\s+|\s+$/g, '') : '';
}

function parseRecallContent(content: string) {
  const match = content.match(/<recall>([\s\S]*?)<\/recall>/);
  return match ? match[1].replace(/^\s+|\s+$/g, '') : '';
}

function parseAmCodes(raw: string) {
  const arr = raw.split(/[,，\s]+/);
  const result: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    const s = arr[i].replace(/^\s+|\s+$/g, '');
    if (!s) continue;
    if (/^AM\d+$/i.test(s) || /^\d+$/.test(s)) result.push(s);
  }
  return result;
}

function findEntryByKey(entries: any[], keyToFind: string) {
  const keyUpper = keyToFind.toUpperCase();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.key && entry.key.length) {
      for (let j = 0; j < entry.key.length; j++) {
        if (String(entry.key[j]).toUpperCase() === keyUpper) return entry;
      }
    }
  }
  return null;
}

function renderMemoryItem(amCode: string, entry: any) {
  if (!entry) {
    return `<div class="th-memory-item"><div class="th-memory-item__id">${escapeHtml(amCode)}</div></div>`;
  }
  const title = entry.comment || '无标题';
  const content = entry.content || '（无内容）';
  return `<div class="th-memory-item"><div class="th-memory-item__id">${escapeHtml(
    amCode,
  )}</div><div class="th-memory-item__title">${escapeHtml(title)}</div><div class="th-memory-item__body">${escapeHtml(
    content,
  )}</div></div>`;
}

function initUserInput() {
  const trimmed = parseUserInput(rawContent).replace(/^\s+|\s+$/g, '');
  userInputHtml.value = trimmed
    ? escapeHtml(trimmed)
    : '<span class="th-muted">（无输入内容）</span>';
}

async function loadMemories() {
  const rawAmList = parseRecallContent(rawContent);
  const amCodes = parseAmCodes(rawAmList);
  memoryCount.value = amCodes.length;
  if (amCodes.length === 0) {
    memoryListHtml.value = '<div class="th-muted">暂无回声</div>';
    return;
  }

  let wbName = '';
  try {
    memoryListHtml.value = '<div class="th-muted">载入中…</div>';
    if (typeof getVariables === 'function') {
      const cv = await getVariables({ type: 'chat' });
      if (cv && (cv as any).selectedWorldBook) wbName = (cv as any).selectedWorldBook;
    }
    if (!wbName && typeof getCurrentCharPrimaryLorebook === 'function') {
      wbName = await getCurrentCharPrimaryLorebook();
    }
    if (!wbName || typeof getLorebookEntries !== 'function') {
      memoryListHtml.value = amCodes.map(code => renderMemoryItem(code, null)).join('');
      updateIframeHeight();
      return;
    }
    const entries = await getLorebookEntries(wbName);
    if (!entries) return;
    memoryListHtml.value = amCodes
      .map(code => renderMemoryItem(code, findEntryByKey(entries as any[], code)))
      .join('');
    updateIframeHeight();
  } catch (err) {
    console.error('记忆召回失败:', err);
    memoryListHtml.value = amCodes.map(code => renderMemoryItem(code, null)).join('');
    updateIframeHeight();
  }
}

function copyUserInput(event: MouseEvent) {
  event.stopPropagation();
  const text = userInputHtml.value.replace(/<[^>]+>/g, '').trim();
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    copied.value = true;
    setTimeout(() => (copied.value = false), 1200);
  } catch (err) {
    console.error('Copy failed', err);
  }
  document.body.removeChild(textarea);
}

function syncThemeState() {
  const payload = JSON.stringify({
    mode: isAutoMode.value ? 'auto' : 'manual',
    dark: isDarkMode.value,
    updatedAt: Date.now(),
  });
  try {
    localStorage.setItem(THEME_STORAGE_KEY, payload);
  } catch (err) {
    console.warn('[theme-sync] failed to write storage', err);
  }
  try {
    const channel = new BroadcastChannel(THEME_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch (err) {
    console.warn('[theme-sync] failed to broadcast', err);
  }
  try {
    if (window.parent && window.parent !== window) {
      (window.parent as any).__TH_UI_THEME__ = payload;
      window.parent.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: payload }));
    }
  } catch (err) {
    console.warn('[theme-sync] failed to notify parent', err);
  }
}

function applyThemeState(raw: string | null) {
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as { mode?: string; dark?: boolean };
    if (parsed.mode === 'auto') {
      isAutoMode.value = true;
      checkTimeAndApplyAuto();
      return;
    }
    if (parsed.mode === 'manual') {
      isAutoMode.value = false;
      if (typeof parsed.dark === 'boolean') isDarkMode.value = parsed.dark;
      updateThemeUI();
    }
  } catch (err) {
    console.warn('[theme-sync] failed to parse storage', err);
  }
}

function syncFontSizeFromParent() {
  try {
    if (window.parent && window.parent !== window) {
      const parentDoc = window.parent.document;
      const sample =
        parentDoc.querySelector('.mes_text') ||
        parentDoc.querySelector('.message') ||
        parentDoc.body;
      const style = window.parent.getComputedStyle(sample as Element);
      const size = style.fontSize;
      const lineHeight = style.lineHeight;
      if (size) {
        document.documentElement.style.setProperty('--st-font-size', size);
        document.body.style.fontSize = size;
      }
      if (lineHeight) {
        document.body.style.lineHeight = lineHeight;
      }
    }
  } catch (err) {
    console.warn('[font-sync] failed to read parent font size', err);
  }
}

onMounted(() => {
  syncFontSizeFromParent();
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored) {
    applyThemeState(stored);
  } else {
    syncThemeState();
  }
  window.addEventListener('storage', event => {
    if (event.key === THEME_STORAGE_KEY) applyThemeState(event.newValue);
  });
  try {
    const channel = new BroadcastChannel(THEME_CHANNEL);
    channel.addEventListener('message', event => applyThemeState(String(event.data || '')));
  } catch (err) {
    console.warn('[theme-sync] failed to listen broadcast', err);
  }
  try {
    if (window.parent && window.parent !== window) {
      window.parent.addEventListener(THEME_EVENT, (event: Event) => {
        applyThemeState(String((event as CustomEvent).detail || ''));
      });
      const parentValue = (window.parent as any).__TH_UI_THEME__ as string | undefined;
      if (parentValue) applyThemeState(parentValue);
    }
  } catch (err) {
    console.warn('[theme-sync] failed to listen parent event', err);
  }
  checkTimeAndApplyAuto();
  initUserInput();
  updateIframeHeight();
});
</script>

<style lang="scss">
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

:root {
  --panel-bg-dark: rgba(30, 26, 38, 0.82);
  --panel-bg-light: rgba(255, 252, 253, 0.9);
  --panel-border-dark: rgba(255, 192, 203, 0.14);
  --panel-border-light: rgba(219, 112, 147, 0.18);
  --text-main-dark: #e9dfe6;
  --text-main-light: #5a3a4a;
  --text-sub-dark: #b097b3;
  --text-sub-light: #8a6a8a;
  --accent: #e8a9c2;
}

body {
  font-family: 'Noto Serif SC', 'Source Han Serif CN', serif;
  font-weight: 600;
  font-size: var(--st-font-size, 14px);
  background: transparent;
  color: var(--text-main-dark);
  margin: 0;
  padding: 10px;
}

body.theme-dark {
  color: var(--text-main-dark);
}

body.theme-light {
  color: var(--text-main-light);
}

.th-panel {
  border-radius: 18px;
  border: 1px solid var(--panel-border-dark);
  background: var(--panel-bg-dark);
  padding: 12px;
  display: grid;
  gap: 12px;
  contain: content;
}

body.theme-light .th-panel {
  background: var(--panel-bg-light);
  border-color: var(--panel-border-light);
}

.th-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.th-title {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.th-title__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  display: inline-block;
}

.th-tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

.th-btn {
  border: 1px solid var(--panel-border-dark);
  background: transparent;
  color: inherit;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.85em;
  cursor: pointer;
}

body.theme-light .th-btn {
  border-color: var(--panel-border-light);
}

.th-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}

.th-card {
  border: 1px solid var(--panel-border-dark);
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
}

body.theme-light .th-card {
  border-color: var(--panel-border-light);
  background: rgba(0, 0, 0, 0.03);
}

.th-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: default;
}

.th-card--collapsible .th-card__header {
  cursor: pointer;
}

.th-card__title {
  font-weight: 700;
}

.th-icon-btn {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.th-badge {
  margin-left: auto;
  font-size: 0.8em;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(232, 169, 194, 0.22);
}

.th-chevron {
  margin-left: 6px;
  transition: transform 0.2s ease;
}

.th-card--collapsible.collapsed .th-card__body {
  display: none;
}

.th-card--collapsible.collapsed .th-chevron {
  transform: rotate(-90deg);
}

.th-card__body {
  margin-top: 8px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.th-muted {
  color: var(--text-sub-dark);
  font-style: italic;
}

body.theme-light .th-muted {
  color: var(--text-sub-light);
}

.th-memory-list {
  display: grid;
  gap: 8px;
}

.th-memory-item {
  border: 1px dashed var(--panel-border-dark);
  border-radius: 12px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.04);
}

body.theme-light .th-memory-item {
  border-color: var(--panel-border-light);
  background: rgba(0, 0, 0, 0.02);
}

.th-memory-item__id {
  font-size: 0.85em;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
}

.th-memory-item__title {
  font-weight: 700;
  margin-bottom: 4px;
}

.th-memory-item__body {
  font-size: 0.95em;
}

@media (max-width: 480px) {
  body {
    padding: 6px;
  }
}
</style>
