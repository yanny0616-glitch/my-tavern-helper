import { z } from 'zod';
import { KeepAliveSettings } from '../types';

export const KeepAliveSettingsSchema = z
  .object({
    enabled: z.boolean().default(false),
    autoResume: z.boolean().default(true),
    panelOpen: z.boolean().default(true),
  })
  .prefault({});

export function parseKeepAliveSettings(value: unknown): KeepAliveSettings {
  return KeepAliveSettingsSchema.parse(value ?? {});
}
