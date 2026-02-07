export function scanThirdPartyFromDom(doc: Document): string[] {
  const names = new Set<string>();
  const selector = [
    'link[href*="/scripts/extensions/third-party/"]',
    'script[src*="/scripts/extensions/third-party/"]',
    'img[src*="/scripts/extensions/third-party/"]',
  ].join(',');
  doc.querySelectorAll(selector).forEach(el => {
    const url = el.getAttribute('href') || el.getAttribute('src') || '';
    const match = url.match(/\/scripts\/extensions\/third-party\/([^/]+)\//);
    if (match) {
      names.add(match[1]);
    }
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

export function scanCoreFromDom(doc: Document): string[] {
  const names = new Set<string>();
  const selector = ['link[href*="/scripts/extensions/"]', 'script[src*="/scripts/extensions/"]'].join(',');
  doc.querySelectorAll(selector).forEach(el => {
    const url = el.getAttribute('href') || el.getAttribute('src') || '';
    if (url.includes('/third-party/')) {
      return;
    }
    const match = url.match(/\/scripts\/extensions\/([^/]+)\//);
    if (match) {
      names.add(match[1]);
    }
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}
