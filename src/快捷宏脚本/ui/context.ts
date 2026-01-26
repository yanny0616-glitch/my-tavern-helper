import type { ComputedRef, Ref } from 'vue';

export type Macro = {
  id: string;
  name: string;
  content: string;
  send: boolean;
  append: boolean;
  newline: boolean;
  scope: 'global' | 'character';
  characterId: string;
  pinned: boolean;
  lastUsedAt: number;
  enabled: boolean;
};

export type Theme = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
};

export type MacroUiContext = {
  visible: Ref<boolean>;
  macros: Ref<Macro[]>;
  theme: Ref<Theme>;
  selectedId: Ref<string | null>;
  selectedMacro: ComputedRef<Macro | null>;
  selectMacro: (id: string) => void;
  currentCharacterLabel: ComputedRef<string>;
  bindCurrentCharacter: () => void;
  close: () => void;
  addMacro: () => void;
  duplicateMacro: () => void;
  removeMacro: () => void;
  moveMacro: (delta: number) => void;
  resetTheme: () => void;
  save: () => void;
};

export const MacroUiKey = Symbol('MacroUi');
