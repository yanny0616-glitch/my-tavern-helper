import { SCRIPT_VARIABLE_OPTION } from './constants';
import { parseKeepAliveSettings } from './schema';
import { KeepAliveSettings } from '../types';

export function loadSettings(): KeepAliveSettings {
  const settings = parseKeepAliveSettings(getVariables(SCRIPT_VARIABLE_OPTION));
  replaceVariables(settings, SCRIPT_VARIABLE_OPTION);
  return settings;
}

export function saveSettings(settings: KeepAliveSettings): void {
  replaceVariables(settings, SCRIPT_VARIABLE_OPTION);
}
