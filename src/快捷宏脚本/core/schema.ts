import type { Macro, Theme } from '../ui/context';

export const ThemeSchema = z
  .object({
    bg: z.string().default('#f6f1ea'),
    surface: z.string().default('#ffffff'),
    surfaceAlt: z.string().default('#f1ebe4'),
    text: z.string().default('#1c1c1c'),
    textMuted: z.string().default('#6a5f54'),
    accent: z.string().default('#d9934f'),
    border: z.string().default('#e3d6c9'),
  })
  .prefault({});

export const MacroSchema = z
  .object({
    id: z.string().default(''),
    name: z.string().default(''),
    content: z.string().default(''),
    send: z.boolean().default(false),
    append: z.boolean().default(false),
    newline: z.boolean().default(true),
    scope: z.enum(['global', 'character']).default('global'),
    characterId: z.string().default(''),
    pinned: z.boolean().default(false),
    lastUsedAt: z.number().default(0),
    enabled: z.boolean().default(true),
  })
  .prefault({});

export const SettingsSchema = z
  .object({
    macros: z.array(MacroSchema).default([]),
    theme: ThemeSchema.default({}),
  })
  .prefault({ macros: [], theme: ThemeSchema.parse({}) });

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_MACROS: Macro[] = [
  {
    id: '',
    name: '问候',
    content: '你好！',
    send: false,
    append: false,
    newline: true,
    scope: 'global',
    characterId: '',
    pinned: false,
    lastUsedAt: 0,
    enabled: true,
  },
  {
    id: '',
    name: '继续',
    content: '继续。',
    send: true,
    append: false,
    newline: true,
    scope: 'global',
    characterId: '',
    pinned: false,
    lastUsedAt: 0,
    enabled: true,
  },
];

export const DEFAULT_THEME: Theme = ThemeSchema.parse({});
