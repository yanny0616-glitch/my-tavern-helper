export const SCRIPT_BUTTON_NAME = '后台助手设置';

export function getScriptVariableOption() {
  return { type: 'script', script_id: getScriptId() } as const;
}

export const AUTO_RESUME_INTERVAL_MS = 12_000;

// 10 秒 44100Hz 16bit 立体声 WAV，1Hz 极低音量正弦波，loop 播放实现保活。
// 通过酒馆页面 origin 相对路径加载，由 Live Server 或生产环境提供。
export const SILENT_AUDIO_URL = 'http://localhost:5500/src/后台助手/core/silence.wav';
