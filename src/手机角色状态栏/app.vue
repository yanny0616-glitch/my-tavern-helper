<template>
  <div class="scene">
    <div class="ambient-layer"></div>
    <div class="phone">
      <div class="phone-shell">
        <div class="phone-bezel">
          <div class="notch">
            <span class="camera"></span>
            <span class="speaker"></span>
          </div>
          <div class="screen">
            <header class="topbar stagger" style="--delay: 1">
              <div class="time">21:48</div>
              <div class="status-icons">
                <span class="signal"></span>
                <span class="wifi"></span>
                <span class="battery">82%</span>
              </div>
            </header>

            <section class="hero stagger" style="--delay: 2">
              <div class="avatar-ring">
                <div class="avatar"></div>
                <span class="pulse"></span>
              </div>
              <div class="role-meta">
                <p class="role-title">角色状态栏</p>
                <h1>{{ status.name }}</h1>
                <p class="role-subtitle">位置: {{ status.location }} | 时间: {{ status.date }} {{ status.time }}</p>
              </div>
              <div class="status-pill">在线</div>
            </section>

            <section class="status-panel stagger" style="--delay: 3">
              <div class="panel-header">
                <h2>当前状态</h2>
                <span class="chip">{{ status.weather }}</span>
              </div>
              <div class="stats-grid">
                <div class="stat-card">
                  <span class="label">天气</span>
                  <span class="value">{{ status.weather }}</span>
                  <span class="note">环境</span>
                </div>
                <div class="stat-card">
                  <span class="label">外观</span>
                  <span class="value">{{ status.outfit }}</span>
                  <span class="note">穿着</span>
                </div>
                <div class="stat-card">
                  <span class="label">姿态</span>
                  <span class="value">{{ status.posture }}</span>
                  <span class="note">动作</span>
                </div>
              </div>
              <div class="bars">
                <div v-for="emotion in emotions" :key="emotion.name" class="bar-row">
                  <span>{{ emotion.name }}</span>
                  <div class="bar">
                    <i :style="{ width: `${emotion.value}%` }"></i>
                  </div>
                  <em>{{ emotion.value }}%</em>
                </div>
              </div>
            </section>

            <section class="chat-panel stagger" style="--delay: 4">
              <div class="panel-header">
                <h2>聊天界面</h2>
                <span class="chip">3 条新消息</span>
              </div>
              <div class="chat">
                <div class="bubble incoming">
                  <p>{{ status.thought || '我看到了你。今晚别走那么快。' }}</p>
                  <span class="stamp">19:34</span>
                </div>
                <div class="bubble outgoing">
                  <p>我们不熟，请别打扰。</p>
                  <span class="stamp">19:35</span>
                </div>
                <div class="bubble incoming">
                  <p>胃不好就别空着，坐回去。</p>
                  <span class="stamp">19:35</span>
                </div>
              </div>
              <div class="input-bar">
                <span>输入消息...</span>
                <button class="send-btn">发送</button>
              </div>
            </section>
          </div>
        </div>
        <div class="side-buttons">
          <span></span>
          <span></span>
          <span class="long"></span>
        </div>
      </div>
      <p class="device-label">手机角色状态栏</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const sampleStatus = `<status>
2024.12.24 周二
10:00 上午
古城 主殿
冬 大雪
黑色大衣,深灰围巾,牛仔裤,短靴
站在窗边,单手插兜,指尖轻触玻璃窗
平静,意外
「怎么会看到她？」
</status>`;

const rawText = ref<string>((window as Window & { statusText?: string }).statusText || sampleStatus);

function extractLines(text: string) {
  const match = text.match(/<status>([\s\S]*?)<\/status>/);
  const block = match ? match[1] : text;
  return block
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

const status = computed(() => {
  const lines = extractLines(rawText.value);
  let name = '未知角色';
  const nameIndex = lines.findIndex(line => /^角色[:：]/.test(line));
  if (nameIndex !== -1) {
    const match = lines[nameIndex].match(/^角色[:：]\s*(.+)$/);
    if (match) name = match[1].trim();
    lines.splice(nameIndex, 1);
  }

  return {
    name,
    date: lines[0] || '----',
    time: lines[1] || '--:--',
    location: lines[2] || '未知地点',
    weather: lines[3] || '天气未知',
    outfit: lines[4] || '未记录',
    posture: lines[5] || '未记录',
    emotions: lines[6] || '平静',
    thought: lines[7] || '',
  };
});

const emotions = computed(() => {
  const raw = status.value.emotions;
  const parts = raw
    .split(/[，,]/)
    .map(item => item.trim())
    .filter(Boolean);

  if (!parts.length) {
    return [{ name: '平静', value: 50 }];
  }

  return parts.map(item => {
    const match = item.match(/^(.*?)(?:\s*(\d+)%|\s+(\d+))?$/);
    const name = match ? match[1].trim() : item;
    const value = match && (match[2] || match[3]) ? Number(match[2] || match[3]) : 50;
    return { name, value: Math.min(100, Math.max(0, value)) };
  });
});

(window as Window & { setStatusText?: (text: string) => void }).setStatusText = text => {
  rawText.value = text;
};
</script>

<style lang="scss" scoped>
.scene {
  --ink: #0f1115;
  --paper: #f6f0e6;
  --accent: #d86b3b;
  --accent-strong: #b64523;
  --deep: #1b212a;
  --soft: #f3dcc4;
  --glow: rgba(216, 107, 59, 0.35);
  --teal: #2e6f6d;
  --mist: rgba(255, 255, 255, 0.6);
  font-family: 'PingFang SC', 'Songti SC', 'STSong', 'SimSun', serif;
  color: var(--ink);
  display: flex;
  justify-content: center;
  padding: 32px 16px 40px;
  position: relative;
  background: linear-gradient(150deg, #fef8f2 0%, #f5e7d8 45%, #e8d2c0 100%);
  border-radius: 24px;
  overflow: hidden;
}

.ambient-layer {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 10% 20%, rgba(216, 107, 59, 0.2), transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(46, 111, 109, 0.18), transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(15, 17, 21, 0.08), transparent 45%);
  pointer-events: none;
}

.phone {
  width: min(380px, 100%);
  position: relative;
  z-index: 1;
}

.phone-shell {
  background: linear-gradient(160deg, #161a22, #0c0f14);
  padding: 14px;
  border-radius: 38px;
  box-shadow: 0 25px 60px rgba(15, 17, 21, 0.4);
  position: relative;
}

.phone-bezel {
  background: #0b0f14;
  border-radius: 30px;
  padding: 10px;
  position: relative;
}

.screen {
  background: linear-gradient(180deg, #fef9f4 0%, #f6ede3 100%);
  border-radius: 24px;
  padding: 18px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  aspect-ratio: 9 / 19.5;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.notch {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 130px;
  height: 26px;
  background: #0b0f14;
  border-radius: 0 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 3;
}

.notch .camera {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1b212a;
  box-shadow: 0 0 6px rgba(95, 168, 255, 0.6);
}

.notch .speaker {
  width: 40px;
  height: 4px;
  border-radius: 4px;
  background: #1c222c;
}

.topbar {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #5b4a3a;
  margin-top: 18px;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.signal,
.wifi {
  width: 18px;
  height: 10px;
  background: linear-gradient(90deg, #2e6f6d, #7ab7b0);
  border-radius: 4px;
  mask: linear-gradient(90deg, transparent 0 20%, #000 20% 40%, transparent 40% 60%, #000 60% 80%, transparent 80%);
}

.battery {
  font-weight: 600;
}

.hero {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  gap: 12px;
  align-items: center;
  position: relative;
}

.avatar-ring {
  position: relative;
  width: 68px;
  height: 68px;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: linear-gradient(135deg, #2e6f6d, #d86b3b);
  box-shadow:
    0 0 0 3px #f5e4d2,
    0 10px 18px rgba(0, 0, 0, 0.2);
}

.pulse {
  position: absolute;
  inset: -6px;
  border-radius: 24px;
  border: 1px solid rgba(216, 107, 59, 0.4);
  animation: pulse 2.5s ease-in-out infinite;
}

.role-meta h1 {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 26px;
  letter-spacing: 2px;
  margin: 0;
}

.role-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #9b6e55;
  margin: 0 0 4px;
}

.role-subtitle {
  font-size: 11px;
  color: #6f5d4d;
  margin: 4px 0 0;
}

.status-pill {
  background: var(--deep);
  color: #fef9f4;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  box-shadow: 0 6px 10px rgba(15, 17, 21, 0.2);
}

.status-panel,
.chat-panel {
  background: #ffffff;
  border-radius: 20px;
  padding: 14px;
  box-shadow: 0 10px 24px rgba(15, 17, 21, 0.1);
  border: 1px solid rgba(216, 107, 59, 0.15);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-header h2 {
  font-size: 14px;
  margin: 0;
}

.chip {
  background: var(--soft);
  color: #7a3c2a;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-card {
  background: var(--paper);
  border-radius: 12px;
  padding: 8px;
  display: grid;
  gap: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-card .label {
  font-size: 10px;
  color: #815f4a;
}

.stat-card .value {
  font-size: 13px;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stat-card .note {
  font-size: 10px;
  color: #a0674c;
}

.bars {
  display: grid;
  gap: 8px;
}

.bar-row {
  display: grid;
  grid-template-columns: 48px 1fr 36px;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #5d4a3b;
}

.bar {
  height: 8px;
  background: #f1e4d6;
  border-radius: 999px;
  position: relative;
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), var(--accent-strong));
}

.chat {
  display: grid;
  gap: 8px;
}

.bubble {
  padding: 8px 10px;
  border-radius: 14px;
  font-size: 12px;
  line-height: 1.4;
  position: relative;
}

.bubble.incoming {
  background: #f1e4d6;
  color: #3a2a20;
  align-self: flex-start;
}

.bubble.outgoing {
  background: #1b212a;
  color: #f8f4ef;
  align-self: flex-end;
}

.stamp {
  font-size: 9px;
  color: rgba(0, 0, 0, 0.4);
  display: block;
  margin-top: 4px;
}

.bubble.outgoing .stamp {
  color: rgba(255, 255, 255, 0.5);
}

.input-bar {
  margin-top: 10px;
  background: #f6ede3;
  border-radius: 12px;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #8d6c56;
}

.send-btn {
  border: none;
  background: var(--accent);
  color: #fff;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 11px;
  letter-spacing: 1px;
}

.side-buttons {
  position: absolute;
  right: -6px;
  top: 80px;
  display: grid;
  gap: 8px;
}

.side-buttons span {
  width: 4px;
  height: 30px;
  background: #1b212a;
  border-radius: 8px;
}

.side-buttons .long {
  height: 50px;
}

.device-label {
  text-align: center;
  color: #5d4a3b;
  font-size: 12px;
  letter-spacing: 4px;
  margin-top: 16px;
}

.stagger {
  animation: rise 0.8s ease both;
  animation-delay: calc(var(--delay, 1) * 0.1s);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@media (max-width: 520px) {
  .screen {
    padding: 16px 14px 18px;
  }

  .hero {
    grid-template-columns: 60px 1fr;
    grid-template-rows: auto auto;
  }

  .status-pill {
    grid-column: 2 / 3;
    justify-self: start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
