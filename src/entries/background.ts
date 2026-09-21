import {
  PROXY_URL, RETRY_DELAY_MIN, NOTIFICATION_ID,
  ALERT_LEVEL_COLORS, STATUS_ICON_PATHS
} from '../lib/constants';
import { resolveAndLoadLanguage, t } from '../lib/i18n';
import { translateRegionName } from '../lib/regionNames';
import { isRegionMonitored } from '../lib/regionUtils';
import type { RegionState, SnapshotPayload, RuntimeMessage, ToastPayload } from '../lib/types';

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('fetchAlerts', { periodInMinutes: 1 });
  fetchData();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetchAlerts' || alarm.name === 'retryFetch') {
    fetchData();
  }
});

chrome.runtime.onMessage.addListener((request: RuntimeMessage) => {
  if (request.action === 'forceUpdate') {
    // Cancel pending retry — fetch immediately
    chrome.alarms.clear('retryFetch');
    chrome.storage.local.set({ retryAt: null });
    fetchData();
  }
});

// ── Helper: schedule a retry after RETRY_DELAY_MIN minutes ──────────────────
function scheduleRetry(): void {
  const retryAt = Date.now() + RETRY_DELAY_MIN * 60 * 1000;
  chrome.storage.local.set({ retryAt });
  // Cancel any existing retry alarm before creating a new one
  chrome.alarms.clear('retryFetch', () => {
    chrome.alarms.create('retryFetch', { delayInMinutes: RETRY_DELAY_MIN });
  });
}

function setAttentionBadge(): void {
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: ALERT_LEVEL_COLORS.Yellow });
  chrome.action.setIcon({ path: STATUS_ICON_PATHS.yellow });
}

interface NewAlert {
  name: string;
  isRed?: boolean;
  isYellow?: boolean;
}

async function fetchData(): Promise<void> {
  chrome.storage.local.get(['previousStates', 'myRegion', 'notifyOnlyMine', 'customRegions', 'language'], async (result) => {
    const myRegion: string | undefined = result.myRegion;
    const notifyOnlyMine: boolean | undefined = result.notifyOnlyMine;
    const customRegions: string[] = result.customRegions || [];
    const lang = await resolveAndLoadLanguage(result.language);

    try {
      // All aggregation (rolling district/community alerts up into their parent
      // oblast, matching map.ukrainealarm.com's own behavior) already happened
      // server-side in the proxy — this is ready-to-render data, one small fetch,
      // no API key needed.
      const response = await fetch(PROXY_URL);

      if (!response.ok) {
        chrome.storage.local.set({ apiError: 'errorServer', apiErrorParams: { code: response.status } });
        setAttentionBadge();
        scheduleRetry();
        return;
      }

      const payload: SnapshotPayload = await response.json();
      const current = payload.regions || {};
      const allRegionNames = payload.allRegionNames || [];

      // Success — clear error state and cancel any pending retry. A stale proxy
      // snapshot (its own cron hasn't run in a while) is still usable data, so
      // it's surfaced as a soft notice, not a blocking error.
      chrome.alarms.clear('retryFetch');
      chrome.storage.local.set({
        apiError: null,
        apiErrorParams: null,
        retryAt: null,
        dataStale: Boolean(payload.stale),
        allRegionNames
      });

      const prev: Record<string, RegionState> = result.previousStates || {};

      let globalActiveCount = 0;
      let myActiveCount = 0;
      const newAlerts: NewAlert[] = [];
      let hasRedAlert = false;
      let hasYellowAlert = false;
      let myHasRedAlert = false;
      let myHasYellowAlert = false;

      Object.entries(current).forEach(([regionName, entry]) => {
        if (!entry.alertnow) return;
        const isMonitored = isRegionMonitored(regionName, myRegion, customRegions);

        if (entry.type === 'State') {
          globalActiveCount++;
          if (entry.hasRed) hasRedAlert = true;
          else if (entry.hasYellow) hasYellowAlert = true;
        }
        if (isMonitored) {
          myActiveCount++;
          if (entry.hasRed) myHasRedAlert = true;
          else if (entry.hasYellow) myHasYellowAlert = true;
        }

        // Check if it's a NEW alert
        if (!prev[regionName] || !prev[regionName].alertnow) {
          if (notifyOnlyMine) {
            if (isMonitored) newAlerts.push({ name: regionName, isRed: entry.hasRed, isYellow: entry.hasYellow });
          } else {
            if (entry.type === 'State' || isMonitored) {
              newAlerts.push({ name: regionName, isRed: entry.hasRed, isYellow: entry.hasYellow });
            }
          }
        }
      });

      // Badge color: red for missile threat, amber for drone-only
      const activeCount = notifyOnlyMine ? myActiveCount : (globalActiveCount > 0 ? globalActiveCount : myActiveCount);
      const useRed = notifyOnlyMine ? myHasRedAlert : hasRedAlert;
      const useYellow = notifyOnlyMine ? myHasYellowAlert : hasYellowAlert;

      if (activeCount > 0) {
        const badgeColor = useRed ? ALERT_LEVEL_COLORS.Red : (useYellow ? ALERT_LEVEL_COLORS.Yellow : ALERT_LEVEL_COLORS.Red);
        const iconStatus = useRed ? 'red' : (useYellow ? 'yellow' : 'red');
        chrome.action.setBadgeText({ text: activeCount.toString() });
        chrome.action.setBadgeBackgroundColor({ color: badgeColor });
        chrome.action.setIcon({ path: STATUS_ICON_PATHS[iconStatus] });
      } else {
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setIcon({ path: STATUS_ICON_PATHS.none });
      }

      if (newAlerts.length > 0) {
        // Separate Red (missiles) from Yellow (drones)
        const redAlerts = newAlerts.filter(a => a.isRed);
        const yellowAlerts = newAlerts.filter(a => a.isYellow && !a.isRed);
        const otherAlerts = newAlerts.filter(a => !a.isRed && !a.isYellow);

        let notifTitle: string;
        let notifMessage = '';

        const displayName = (a: NewAlert) => translateRegionName(lang, a.name);

        if (redAlerts.length > 0) {
          notifTitle = t(lang, 'notifTitleRed');
          const names = redAlerts.slice(0, 3).map(displayName);
          notifMessage = names.join(', ');
          if (redAlerts.length > 3) notifMessage += t(lang, 'moreItemsSuffix', { n: redAlerts.length - 3 });
          if (yellowAlerts.length > 0) notifMessage += `\n${t(lang, 'yellowInlinePrefix')}${yellowAlerts.slice(0, 2).map(displayName).join(', ')}`;
        } else if (yellowAlerts.length > 0) {
          notifTitle = t(lang, 'notifTitleYellow');
          const names = yellowAlerts.slice(0, 3).map(displayName);
          notifMessage = names.join(', ');
          if (yellowAlerts.length > 3) notifMessage += t(lang, 'moreItemsSuffix', { n: yellowAlerts.length - 3 });
        } else {
          notifTitle = t(lang, 'notifTitleGeneric');
          const names = otherAlerts.slice(0, 3).map(displayName);
          notifMessage = names.join(', ');
          if (otherAlerts.length > 3) notifMessage += t(lang, 'moreItemsSuffix', { n: otherAlerts.length - 3 });
        }

        // Same ID -> updates the existing notification instead of stacking new ones.
        // requireInteraction -> does not auto-dismiss on any OS, the user must close it.
        chrome.notifications.create(NOTIFICATION_ID, {
          type: 'basic',
          iconUrl: 'icons/status-none-128.png',
          title: notifTitle,
          message: notifMessage,
          priority: 2,
          requireInteraction: true
        });

        // Show toast overlay on all active tabs
        const toastLevel: ToastPayload['level'] = redAlerts.length > 0 ? 'red' : (yellowAlerts.length > 0 ? 'yellow' : 'generic');
        const formatToastRegions = (alerts: NewAlert[]) =>
          alerts.slice(0, 5).map(displayName).join(', ') + (alerts.length > 5 ? t(lang, 'moreItemsSuffix', { n: alerts.length - 5 }) : '');
        const toastRegions = redAlerts.length > 0
          ? formatToastRegions(redAlerts)
          : yellowAlerts.length > 0
            ? formatToastRegions(yellowAlerts)
            : formatToastRegions(otherAlerts);

        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'showToast',
                payload: {
                  title: notifTitle,
                  regions: toastRegions,
                  level: toastLevel
                }
              }).catch(() => {}); // Tab may not have content script yet — ignore
            }
          });
        });
      }


      chrome.storage.local.set({
        previousStates: current,
        lastUpdate: new Date().getTime(),
        lastData: current
      });

    } catch (error) {
      console.error('Error fetching alerts:', error);
      chrome.storage.local.set({ apiError: 'errorNetwork', apiErrorParams: null });
      setAttentionBadge();
      scheduleRetry();
    }
  });
}
