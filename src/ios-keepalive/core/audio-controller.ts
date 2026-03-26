import { AUTO_RESUME_INTERVAL_MS, SILENT_AUDIO_DATA_URI } from './constants';
import { KeepAliveSettings, KeepAliveSnapshot } from '../types';

type CreateKeepAliveControllerOptions = {
  doc: Document;
  onChange?: () => void;
};

type KeepAliveController = {
  applySettings: (settings: KeepAliveSettings, reason?: string) => void;
  start: (reason?: string) => Promise<boolean>;
  stop: () => void;
  test: () => Promise<boolean>;
  getSnapshot: () => KeepAliveSnapshot;
  dispose: () => void;
};

function explainPlayError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return '播放被浏览器拦截，需要手动点击“开始保活”';
    }
    if (error.name === 'NotSupportedError') {
      return '浏览器不支持这段空白音频';
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

  const emit = () => {
    options.onChange?.();
  };

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

  const setStatus = (next: string) => {
    statusText = next;
    emit();
  };

  const setError = (next: string) => {
    errorText = next;
    if (next) {
      lastErrorAt = Date.now();
    }
    emit();
  };

  const syncResumeTimer = () => {
    if (resumeTimer) {
      hostWindow.clearInterval(resumeTimer);
      resumeTimer = 0;
    }
    if (!desiredEnabled || !autoResume || disposed) {
      return;
    }
    resumeTimer = hostWindow.setInterval(() => {
      if (playPromise) {
        return;
      }
      if (!audio || audio.paused || audio.ended) {
        void playInternal(doc.visibilityState === 'hidden' ? '后台中，尝试恢复播放' : '前台中，尝试恢复播放');
      }
    }, AUTO_RESUME_INTERVAL_MS);
  };

  const ensureAudio = (): HTMLAudioElement => {
    if (audio) {
      return audio;
    }

    const nextAudio = doc.createElement('audio');
    nextAudio.src = SILENT_AUDIO_DATA_URI;
    nextAudio.loop = true;
    nextAudio.preload = 'auto';
    nextAudio.volume = 1;
    nextAudio.muted = false;
    nextAudio.autoplay = false;
    nextAudio.controls = false;
    nextAudio.setAttribute('playsinline', 'true');
    nextAudio.setAttribute('webkit-playsinline', 'true');
    nextAudio.setAttribute('aria-hidden', 'true');
    nextAudio.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';

    nextAudio.addEventListener('play', () => {
      statusText = '播放中';
      errorText = '';
      lastStartedAt = Date.now();
      emit();
    });
    nextAudio.addEventListener('pause', () => {
      statusText = desiredEnabled ? '已暂停，等待恢复' : '已停止';
      emit();
    });
    nextAudio.addEventListener('ended', () => {
      statusText = '播放结束，等待恢复';
      emit();
    });
    nextAudio.addEventListener('error', () => {
      setStatus('音频元素报错');
      setError('空白音频触发了 error 事件');
    });

    (doc.body ?? doc.documentElement).appendChild(nextAudio);
    audio = nextAudio;
    emit();
    return nextAudio;
  };

  const playInternal = async (reason: string): Promise<boolean> => {
    if (disposed) {
      return false;
    }
    if (playPromise) {
      return playPromise;
    }

    const currentAudio = ensureAudio();
    attempts += 1;
    setStatus(reason);

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

  const stop = () => {
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
  };

  const start = async (reason = '正在启动空白音频'): Promise<boolean> => {
    desiredEnabled = true;
    syncResumeTimer();
    return playInternal(reason);
  };

  const applySettings = (settings: KeepAliveSettings, reason = '根据设置恢复空白音频') => {
    desiredEnabled = settings.enabled;
    autoResume = settings.autoResume;
    syncResumeTimer();

    if (!desiredEnabled) {
      stop();
      return;
    }
    if (!audio || audio.paused || audio.ended) {
      void playInternal(reason);
      return;
    }
    emit();
  };

  const test = async (): Promise<boolean> => {
    const keepRunning = desiredEnabled;
    const ok = await playInternal('正在测试空白音频');
    if (!ok) {
      return false;
    }
    setStatus(keepRunning ? '测试成功，保活仍在运行' : '测试成功');
    if (!keepRunning) {
      if (testTimer) {
        hostWindow.clearTimeout(testTimer);
      }
      testTimer = hostWindow.setTimeout(() => {
        if (!desiredEnabled && audio) {
          audio.pause();
          audio.currentTime = 0;
          statusText = '测试完成（当前未开启保活）';
          emit();
        }
      }, 600);
    }
    return true;
  };

  const onVisibilityChange = () => {
    emit();
    if (!desiredEnabled || !autoResume || playPromise) {
      return;
    }
    if (!audio || audio.paused || audio.ended) {
      void playInternal(doc.visibilityState === 'hidden' ? '切到后台，尝试维持播放' : '回到前台，尝试恢复播放');
    }
  };

  doc.addEventListener('visibilitychange', onVisibilityChange, true);

  return {
    applySettings,
    start,
    stop,
    test,
    getSnapshot,
    dispose: () => {
      disposed = true;
      doc.removeEventListener('visibilitychange', onVisibilityChange, true);
      if (resumeTimer) {
        hostWindow.clearInterval(resumeTimer);
      }
      if (testTimer) {
        hostWindow.clearTimeout(testTimer);
      }
      if (audio) {
        audio.pause();
        audio.remove();
        audio = null;
      }
    },
  };
}
