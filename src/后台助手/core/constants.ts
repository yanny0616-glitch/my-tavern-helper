export const SCRIPT_BUTTON_NAME = '后台助手设置';

export function getScriptVariableOption() {
  return { type: 'script', script_id: getScriptId() } as const;
}

export const AUTO_RESUME_INTERVAL_MS = 12_000;

// CDN 上的静音 m4a 作为首选，动态生成 WAV 作为备选（CDN 加载慢时）
export const SILENT_AUDIO_CDN =
  'https://cdn.jsdelivr.net/gh/yanny0616-glitch/my-tavern-helper@main/dist/后台助手/silence.m4a';

// 动态生成 30 秒静音 WAV（约 480KB），用于 CDN 还没加载完时的过渡
let cachedWavUrl: string | null = null;
export function createFallbackWavUrl(): string {
  if (cachedWavUrl) return cachedWavUrl;
  const sampleRate = 8000;
  const numSamples = sampleRate * 30;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buffer);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, dataSize, true);
  for (let i = 0; i < numSamples; i++) {
    v.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * i / sampleRate) * 100), true);
  }
  cachedWavUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  return cachedWavUrl;
}
