// Shapes of the data the alert proxy (air-raid-alerts-proxy-worker) returns.
// Field names/casing come straight from the upstream API — see README.

export interface AlertLevelInfo {
  alertLevel: string; // 'Red' | 'Yellow', but the API doesn't guarantee an enum
  reason?: string;
  createdAt?: string;
}

export interface AlertEntry {
  regionId?: string;
  regionType?: string;
  // The API is inconsistent about the field name; both are seen in the wild.
  type?: string;
  alertType?: string;
  lastUpdate?: string;
  activeAlertLevels?: AlertLevelInfo[];
  alertLevel?: string;
  sourceRegionName?: string;
}

export interface RegionState {
  type: string; // 'State' | 'Community' | 'Unknown'
  alertnow: boolean;
  changed?: string;
  alerts?: AlertEntry[];
  hasRed?: boolean;
  hasYellow?: boolean;
  hasArtillery?: boolean;
  hasUrbanFights?: boolean;
}

export interface SnapshotPayload {
  updatedAt: number;
  regions: Record<string, RegionState>;
  allRegionNames?: string[];
  stale?: boolean;
}

export interface LanguageInfo {
  code: string;
  name: string;
}

export type TranslationVars = Record<string, string | number>;

export interface ToastPayload {
  title: string;
  regions: string;
  level: 'red' | 'yellow' | 'generic';
}

export interface ShowToastMessage {
  action: 'showToast';
  payload: ToastPayload;
}

export interface ForceUpdateMessage {
  action: 'forceUpdate';
}

export type RuntimeMessage = ShowToastMessage | ForceUpdateMessage;
