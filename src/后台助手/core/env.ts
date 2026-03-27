export function isIOS(): boolean {
  const ua = navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
  const isModernIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isAppleMobile || isModernIPad;
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;

  // iOS
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iPad';
  if (/iPod/.test(ua)) return 'iPod';

  // Android
  if (/Android/.test(ua)) {
    if (/Mobile/.test(ua)) return 'Android 手机';
    return 'Android 平板';
  }

  // Desktop
  if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  if (/CrOS/.test(ua)) return 'ChromeOS';

  return '未知设备';
}
