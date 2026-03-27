import { NotificationFields, NotificationSnapshot } from '../types';

type NotificationControllerOptions = {
  getFields: () => NotificationFields;
  getBarkEnabled: () => boolean;
  getBarkUrl: () => string;
  onChange?: () => void;
};

type NotificationController = {
  requestPermission: () => Promise<boolean>;
  notifyGenerationDone: (messageId?: number) => void;
  getSnapshot: () => NotificationSnapshot;
};

function getNotificationApi(): typeof Notification | null {
  try {
    if (window.parent && 'Notification' in window.parent) {
      return window.parent.Notification;
    }
  } catch {
    // cross-origin
  }
  if ('Notification' in window) {
    return Notification;
  }
  return null;
}

function getPermissionStatus(): string {
  const api = getNotificationApi();
  if (!api) return '浏览器不支持';
  if (api.permission === 'granted') return '已授权';
  if (api.permission === 'denied') return '已拒绝';
  return '未授权';
}

function getCurrentCharacterInfo(): { name: string; icon?: string } {
  try {
    const chid = Number(SillyTavern.characterId);
    const character = Number.isFinite(chid) ? SillyTavern.characters?.[chid] : undefined;
    const name = character?.name || '当前角色';
    if (character?.avatar && typeof SillyTavern.getThumbnailUrl === 'function') {
      try {
        return { name, icon: SillyTavern.getThumbnailUrl('avatar', character.avatar) };
      } catch {
        // ignore
      }
    }
    return { name };
  } catch {
    return { name: '当前角色' };
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function createNotificationController(options: NotificationControllerOptions): NotificationController {
  let lastNotifiedAt: number | null = null;
  let lastDuration: string | null = null;

  const emit = () => options.onChange?.();

  const requestPermission = async (): Promise<boolean> => {
    const api = getNotificationApi();
    if (!api) {
      toastr.error('当前浏览器不支持系统通知');
      return false;
    }
    if (api.permission === 'granted') {
      toastr.success('通知权限已授权');
      return true;
    }
    if (api.permission === 'denied') {
      toastr.warning('通知权限已被拒绝，请点击地址栏左边的图标，将通知权限改为"允许"后刷新页面');
      return false;
    }
    const result = await api.requestPermission();
    emit();
    if (result === 'granted') {
      toastr.success('通知权限授权成功');
      return true;
    }
    toastr.warning('通知权限未授权');
    return false;
  };

  const sendNotification = async (notiApi: typeof Notification, messageId?: number) => {
    const fields = options.getFields();
    const { name, icon } = getCurrentCharacterInfo();
    const message = typeof messageId === 'number' ? getChatMessages(messageId)[0] : getChatMessages(-1)[0];
    const extra = message?.extra as Record<string, any> | undefined;
    const inner = extra?.extra as Record<string, any> | undefined;

    // gen_started/gen_finished 在 extra 顶层，其余在 extra.extra 里
    const genStarted = extra?.gen_started ? new Date(extra.gen_started).getTime() : null;
    const genFinished = extra?.gen_finished ? new Date(extra.gen_finished).getTime() : null;
    const durationMs = genStarted && genFinished ? genFinished - genStarted : null;
    const duration = durationMs !== null ? formatDuration(durationMs) : null;
    const reasoningMs: number | undefined = inner?.reasoning_duration;
    const ttft: number | undefined = inner?.time_to_first_token;
    const tokenCount: number | undefined = inner?.token_count;
    const model: string | undefined = inner?.model;
    const api: string | undefined = inner?.api;

    lastDuration = duration;
    lastNotifiedAt = Date.now();

    // 全部压成两行：统计行 + 正文预览，避免被系统截断
    const stats: string[] = [];
    if (fields.characterName) stats.push(name);
    if (fields.duration && duration) stats.push(duration);
    if (fields.tokenCount && typeof tokenCount === 'number') stats.push(`${tokenCount}t`);
    if (fields.reasoningDuration && typeof reasoningMs === 'number') stats.push(`思考${formatDuration(reasoningMs)}`);
    if (fields.timeToFirstToken && typeof ttft === 'number') stats.push(`首字${formatDuration(ttft)}`);
    if (fields.model && model) stats.push(model);
    if (fields.api && api) stats.push(api);

    const lines: string[] = [];
    if (stats.length) lines.push(stats.join(' · '));

    if (fields.preview) {
      const rawText = message?.message || '';
      const preview = rawText
        .replace(/```[\s\S]*?```/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, fields.previewLength);
      if (preview) lines.push(preview + (preview.length >= fields.previewLength ? '...' : ''));
    }

    const body = lines.join('\n');

    // 浏览器通知
    const opts: NotificationOptions = { body };
    if (icon) opts.icon = icon;
    new notiApi('生成已完成', opts);

    // Bark 推送（仅开关开启时）
    const barkUrl = options.getBarkUrl();
    if (options.getBarkEnabled() && barkUrl) {
      const base = barkUrl.endsWith('/') ? barkUrl : barkUrl + '/';
      const paramStr =
        '?icon=https://raw.githubusercontent.com/SillyTavern/SillyTavern/release/public/img/apple-icon-72x72.png';
      const barkFetchUrl = base + encodeURIComponent('生成已完成') + '/' + encodeURIComponent(body) + paramStr;
      fetch(barkFetchUrl).catch(err => {
        console.warn('[后台助手] Bark 推送失败:', err);
      });
    }

    emit();
  };

  return {
    requestPermission,

    notifyGenerationDone: (messageId?: number) => {
      const api = getNotificationApi();
      if (api?.permission === 'granted') {
        void sendNotification(api, messageId);
      }
    },

    getSnapshot: (): NotificationSnapshot => ({
      permissionStatus: getPermissionStatus(),
      lastNotifiedAt,
      lastGenerationDuration: lastDuration,
    }),
  };
}
