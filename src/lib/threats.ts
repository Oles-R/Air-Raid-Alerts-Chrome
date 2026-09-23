// Human-readable threat labels for a region — the same text popup.ts shows per
// alert line: the API's level reason when present, otherwise the translated alert type.
import { t } from './i18n';
import type { RegionState } from './types';

export function alertTypeName(lang: string, alertType: string): string {
  const key = `alertType_${alertType}`;
  const translated = t(lang, key);
  return translated === key ? (alertType || t(lang, 'alertType_default')) : translated;
}

export function getThreatLabels(lang: string, entry: RegionState): string[] {
  const labels = new Set<string>();
  (entry.alerts || []).forEach((alert) => {
    const typeName = alertTypeName(lang, alert.alertType || alert.type || '');
    if (alert.activeAlertLevels && alert.activeAlertLevels.length > 0) {
      alert.activeAlertLevels.forEach((levelInfo) => labels.add(levelInfo.reason || typeName));
    } else {
      labels.add(typeName);
    }
  });
  return Array.from(labels);
}
