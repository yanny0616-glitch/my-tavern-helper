import { AUTO_RESUME_INTERVAL_MS, SILENT_AUDIO_URL } from './constants';
import { KeepAliveSnapshot } from '../types';

type CreateKeepAliveControllerOptions = {
  doc: Document;
  onChange?: () => void;
};

type KeepAliveController = {
  start: (reason?: string) => Promise<boolean>;
  stop: () => void;
  test: () => Promise<boolean>;
  setAutoResume: (value: boolean) => void;
  getSnapshot: () => KeepAliveSnapshot;
  dispose: () => void;
};

function explainPlayError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return '播放被浏览器拦截，需要手动点击"开始保活"';
    }
    if (error.name === 'NotSupportedError') {
      return '浏览器不支持该音频格式';
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return '播放失败，原因未知';
}

export function createKeepAliveController(options: CreateKeepAliveControllerOptions): KeepAliveController {
  const { doc } = options;
  const hostWindow = doc.defaultView ?? window;

  let audio: HTMLAudioElement | null = null;
  let desiredEnabled = false;
  let autoResume = true;
  let attempts = 0;
  let statusText = '未启动';
  let errorText = '';
  let lastStartedAt: number | null = null;
  let lastErrorAt: number | null = null;
  let resumeTimer = 0;
  let playPromise: Promise<boolean> | null = null;
  let testTimer = 0;
  let disposed = false;

  const emit = () => options.onChange?.();

  const getSnapshot = (): KeepAliveSnapshot => ({
    audioAttached: Boolean(audio),
    playing: Boolean(audio && !audio.paused && !audio.ended),
    statusText,
    errorText,
    visibilityState: doc.visibilityState,
    attempts,
    lastStartedAt,
    lastErrorAt,
  });

  const syncResumeTimer = () => {
    if (resumeTimer) {
      hostWindow.clearInterval(resumeTimer);
      resumeTimer = 0;
    }
    if (!desiredEnabled || !autoResume || disposed) return;

    resumeTimer = hostWindow.setInterval(() => {
      if (playPromise) return;
      if (!audio || audio.paused || audio.ended) {
        void playInternal(doc.visibilityState === 'hidden' ? '后台中，尝试恢复播放' : '前台中，尝试恢复播放');
      }
    }, AUTO_RESUME_INTERVAL_MS);
  };

  const ensureAudio = (): HTMLAudioElement => {
    if (audio) return audio;

    const el = doc.createElement('audio');
    el.src = SILENT_AUDIO_URL;
    el.loop = true;
    el.preload = 'auto';
    el.volume = 1;
    el.muted = false;
    el.autoplay = false;
    el.controls = false;
    el.setAttribute('playsinline', 'true');
    el.setAttribute('webkit-playsinline', 'true');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';

    el.addEventListener('play', () => {
      statusText = '播放中';
      errorText = '';
      lastStartedAt = Date.now();
      emit();
    });
    el.addEventListener('pause', () => {
      statusText = desiredEnabled ? '已暂停，等待恢复' : '已停止';
      emit();
    });
    el.addEventListener('ended', () => {
      statusText = '播放结束，等待恢复';
      emit();
    });
    el.addEventListener('error', () => {
      statusText = '音频元素报错';
      errorText = '空白音频触发了 error 事件';
      lastErrorAt = Date.now();
      emit();
    });

    (doc.body ?? doc.documentElement).appendChild(el);
    audio = el;
    emit();
    return el;
  };

  const playInternal = async (reason: string): Promise<boolean> => {
    if (disposed) return false;
    if (playPromise) return playPromise;

    const currentAudio = ensureAudio();
    attempts += 1;
    statusText = reason;
    emit();

    playPromise = currentAudio
      .play()
      .then(() => {
        errorText = '';
        lastStartedAt = Date.now();
        statusText = '播放中';
        emit();
        return true;
      })
      .catch((error: unknown) => {
        statusText = '播放失败';
        errorText = explainPlayError(error);
        lastErrorAt = Date.now();
        emit();
        return false;
      })
      .finally(() => {
        playPromise = null;
      });

    return playPromise;
  };

  const onVisibilityChange = () => {
    emit();
    if (!desiredEnabled || !autoResume || playPromise) return;
    if (!audio || audio.paused || audio.ended) {
      void playInternal(doc.visibilityState === 'hidden' ? '切到后台，尝试维持播放' : '回到前台，尝试恢复播放');
    }
  };

  doc.addEventListener('visibilitychange', onVisibilityChange, true);

  return {
    start: async (reason = '正在启动空白音频') => {
      desiredEnabled = true;
      syncResumeTimer();
      return playInternal(reason);
    },

    stop: () => {
      desiredEnabled = false;
      syncResumeTimer();
      if (testTimer) {
        hostWindow.clearTimeout(testTimer);
        testTimer = 0;
      }
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      statusText = '已停止';
      errorText = '';
      emit();
    },

    test: async () => {
      const keepRunning = desiredEnabled;
      // 测试不计入 attempts
      const savedAttempts = attempts;
      const ok = await playInternal('正在测试');
      attempts = savedAttempts;

      if (!ok) {
        toastr.error('播放测试失败：' + errorText);
        return false;
      }

      toastr.success('播放测试成功');
      statusText = keepRunning ? '播放中' : '测试成功';
      emit();

      if (!keepRunning) {
        if (testTimer) hostWindow.clearTimeout(testTimer);
        testTimer = hostWindow.setTimeout(() => {
          if (!desiredEnabled && audio) {
            audio.pause();
            audio.currentTime = 0;
            statusText = '未启动';
            emit();
          }
        }, 600);
      }
      return true;
    },

    setAutoResume: (value: boolean) => {
      autoResume = value;
      syncResumeTimer();
    },

    getSnapshot,

    dispose: () => {
      disposed = true;
      doc.removeEventListener('visibilitychange', onVisibilityChange, true);
      if (resumeTimer) hostWindow.clearInterval(resumeTimer);
      if (testTimer) hostWindow.clearTimeout(testTimer);
      if (audio) {
        audio.pause();
        audio.remove();
        audio = null;
      }
    },
  };
}
