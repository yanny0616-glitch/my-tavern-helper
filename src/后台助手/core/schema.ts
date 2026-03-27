import { z } from 'zod';

export const NotificationFieldsSchema = z
  .object({
    characterName: z.boolean().prefault(true),
    duration: z.boolean().prefault(true),
    tokenCount: z.boolean().prefault(true),
    reasoningDuration: z.boolean().prefault(true),
    timeToFirstToken: z.boolean().prefault(false),
    model: z.boolean().prefault(false),
    api: z.boolean().prefault(false),
    preview: z.boolean().prefault(true),
    previewLength: z.coerce.number().prefault(80),
  })
  .prefault({});

export const SettingsSchema = z
  .object({
    keepAlive: z
      .object({
        enabled: z.boolean().prefault(false),
        autoResume: z.boolean().prefault(true),
      })
      .prefault({}),
    notification: z
      .object({
        enabled: z.boolean().prefault(true),
        barkEnabled: z.boolean().prefault(false),
        barkUrl: z.string().prefault(''),
        fields: NotificationFieldsSchema,
      })
      .prefault({}),
    panelOpen: z.boolean().prefault(false),
  })
  .prefault({});
