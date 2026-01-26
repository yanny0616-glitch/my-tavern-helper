<template>
  <section class="status-bar">
    <header class="status-header">
      <div class="title">
        <span class="name">陆执衡</span>
        <span class="tag">状态栏</span>
      </div>
      <div class="time">{{ data?.世界环境?.时间 || '—' }}</div>
    </header>

    <div class="grid">
      <article class="panel">
        <h3>世界环境</h3>
        <div class="row">
          <span>季节</span>
          <span>{{ data?.世界环境?.气候?.季节 || '—' }}</span>
        </div>
        <div class="row">
          <span>天气</span>
          <span>{{ data?.世界环境?.气候?.天气 || '—' }}</span>
        </div>
        <div class="row">
          <span>温度</span>
          <span>{{ formatTemp(data?.世界环境?.气候?.温度) }}</span>
        </div>
      </article>

      <article class="panel">
        <h3>陆执衡</h3>
        <div class="row">
          <span>情绪</span>
          <span>{{ data?.孟砚白?.情绪 || '—' }}</span>
        </div>
        <div class="row">
          <span>克制值</span>
          <span>{{ data?.孟砚白?.克制值 ?? '—' }}</span>
        </div>
        <div class="row">
          <span>亲密度</span>
          <span>{{ data?.孟砚白?.亲密度 ?? '—' }}</span>
        </div>
        <div class="row">
          <span>当前位置</span>
          <span>{{ formatLocation(data?.孟砚白?.当前位置) }}</span>
        </div>
        <div class="row">
          <span>当前姿势</span>
          <span>{{ data?.孟砚白?.当前姿势 || '—' }}</span>
        </div>
      </article>

      <article class="panel">
        <h3>user</h3>
        <div class="row">
          <span>当前位置</span>
          <span>{{ formatLocation(data?.user?.当前位置) }}</span>
        </div>
        <div class="row">
          <span>服装</span>
          <span>{{ formatClothes(data?.user?.服装) }}</span>
        </div>
      </article>

      <article class="panel wide">
        <h3>心理活动</h3>
        <div class="thought">
          <div class="label">表层想法</div>
          <div class="content">{{ data?.孟砚白?.心理活动?.表层想法 || '—' }}</div>
        </div>
        <div class="thought">
          <div class="label">深层欲念</div>
          <div class="content">{{ data?.孟砚白?.心理活动?.深层欲念 || '—' }}</div>
        </div>
      </article>

      <article class="panel">
        <h3>服装</h3>
        <div class="row">
          <span>上衣</span>
          <span>{{ data?.孟砚白?.服装?.上衣 || '—' }}</span>
        </div>
        <div class="row">
          <span>下衣</span>
          <span>{{ data?.孟砚白?.服装?.下衣 || '—' }}</span>
        </div>
        <div class="row">
          <span>鞋子</span>
          <span>{{ data?.孟砚白?.服装?.鞋子 || '—' }}</span>
        </div>
        <div class="row">
          <span>配饰</span>
          <span>{{ data?.孟砚白?.服装?.配饰 || '—' }}</span>
        </div>
      </article>

      <article class="panel">
        <h3>备忘录</h3>
        <ul class="list" v-if="memoList.length">
          <li v-for="(item, idx) in memoList" :key="idx">{{ item }}</li>
        </ul>
        <div class="empty" v-else>暂无</div>
      </article>

      <article class="panel">
        <h3>最近搜索</h3>
        <ul class="list" v-if="searchList.length">
          <li v-for="(item, idx) in searchList" :key="idx">{{ item }}</li>
        </ul>
        <div class="empty" v-else>暂无</div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from './store';

const store = useDataStore();
const { data } = storeToRefs(store);

const searchList = computed(() => data.value?.孟砚白?.手机?.最近搜索 ?? []);
const memoList = computed(() => data.value?.孟砚白?.备忘录 ?? []);

const formatLocation = (loc?: { 地点?: string; 具体方位?: string }) => {
  if (!loc?.地点 && !loc?.具体方位) return '—';
  if (!loc?.具体方位) return loc.地点 || '—';
  if (!loc?.地点) return loc.具体方位 || '—';
  return `${loc.地点} / ${loc.具体方位}`;
};

const formatClothes = (clothes?: { 上衣?: string; 下衣?: string; 鞋子?: string; 配饰?: string }) => {
  if (!clothes) return '—';
  const parts = [clothes.上衣, clothes.下衣, clothes.鞋子, clothes.配饰].filter(Boolean);
  return parts.length ? parts.join('、') : '—';
};

const formatTemp = (value?: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value}°C`;
};
</script>

<style scoped>
.status-bar {
  --ink: #2a2522;
  --muted: #6b5f56;
  --accent: #b88b4a;
  --paper: #f7f1e7;
  --mist: #efe6d7;
  font-family: "Source Han Serif SC", "Noto Serif SC", "STSong", serif;
  color: var(--ink);
  background: linear-gradient(135deg, #f9f3ea 0%, #efe3d3 100%);
  border: 1px solid #d8c7b4;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(58, 40, 24, 0.12);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(184, 139, 74, 0.35);
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  letter-spacing: 0.5px;
}

.name {
  font-weight: 700;
}

.tag {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--accent);
  border: 1px solid rgba(184, 139, 74, 0.5);
  padding: 2px 6px;
  border-radius: 999px;
}

.time {
  font-size: 14px;
  color: var(--muted);
}

.grid {
  display: grid;
  gap: 12px;
  margin-top: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.panel {
  background: var(--paper);
  border: 1px solid #e1d4c6;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel.wide {
  grid-column: span 2;
}

.panel h3 {
  margin: 0;
  font-size: 14px;
  color: var(--accent);
  letter-spacing: 0.4px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--ink);
}

.thought {
  background: var(--mist);
  border-radius: 10px;
  padding: 8px 10px;
  display: grid;
  gap: 4px;
}

.thought .label {
  font-size: 12px;
  color: var(--muted);
}

.thought .content {
  font-size: 13px;
  line-height: 1.5;
}

.list {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 4px;
  font-size: 13px;
}

.empty {
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 520px) {
  .status-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel.wide {
    grid-column: span 1;
  }
}
</style>