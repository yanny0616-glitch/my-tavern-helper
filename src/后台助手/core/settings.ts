import { getScriptVariableOption } from './constants';
import { SettingsSchema } from './schema';
import { Settings } from '../types';

export function loadSettings(): Settings {
  const opt = getScriptVariableOption();
  const settings = SettingsSchema.parse(getVariables(opt));
  replaceVariables(settings, opt);
  return settings;
}

export function saveSettings(settings: Settings): void {
  replaceVariables(settings, getScriptVariableOption());
}
