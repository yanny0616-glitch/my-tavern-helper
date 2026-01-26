import type { Theme } from './context';

export const themePresets: { name: string; colors: Theme }[] = [
  {
    name: '白天',
    colors: {
      bg: '#f6f1ea',
      surface: '#ffffff',
      surfaceAlt: '#f1ebe4',
      text: '#1c1c1c',
      textMuted: '#6a5f54',
      accent: '#d9934f',
      border: '#e3d6c9',
    },
  },
  {
    name: '夜晚',
    colors: {
      bg: '#0f1115',
      surface: '#1b1f27',
      surfaceAlt: '#232836',
      text: '#f5f5f7',
      textMuted: '#a7b0c0',
      accent: '#4cc3ff',
      border: '#2f3647',
    },
  },
  {
    name: '雾蓝',
    colors: {
      bg: '#e8eef6',
      surface: '#f7f9fc',
      surfaceAlt: '#e3ecf7',
      text: '#1b2533',
      textMuted: '#5b6b7f',
      accent: '#5e8cff',
      border: '#c8d6ea',
    },
  },
  {
    name: '琥珀',
    colors: {
      bg: '#f7efe4',
      surface: '#fff7ee',
      surfaceAlt: '#f4e3d0',
      text: '#2a1f17',
      textMuted: '#6f5a4a',
      accent: '#c9783b',
      border: '#e3c9b2',
    },
  },
];
