import {
  LOCALE_TAGS, GEOCODE_URL, ALERT_TYPE_ICONS, DEFAULT_ALERT_ICON_KEY,
  ALERT_LEVEL_COLORS, ALERT_TYPE_COLORS, CHANGELOG_URL
} from '../lib/constants';
import { ICONS } from '../lib/icons';
import { DEFAULT_LANGUAGE, getLanguage, t, applyStaticI18n, LANGUAGE_LIST } from '../lib/i18n';
import { isRegionMonitored } from '../lib/regionUtils';
import { resolveTheme, applyTheme } from '../lib/theme';
import { formatTime } from '../lib/timeFormat';
import { alertTypeName } from '../lib/threats';
import type { RegionState, AlertEntry } from '../lib/types';

let currentLang: string = DEFAULT_LANGUAGE;

document.addEventListener('DOMContentLoaded', () => {
    getLanguage((lang) => {
        currentLang = lang;
        applyStaticI18n(currentLang);
        loadData();
        setupSettings();
    });
});

// The popup does not reload itself — without this listener the list stays
// "frozen" at whatever it was when opened, even after background.js has
// already refreshed the data (this used to be a real source of confusion:
// fresh data in storage, stale picture on screen).
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.lastData || changes.apiError || changes.lastUpdate || changes.timeFormat) {
        loadData();
    }
    if (changes.allRegionNames) {
        populateRegionsDatalist();
    }
});

let currentMyRegion: string | null = null;
let customRegionsArr: string[] = [];

// "5m", "1h 10m", "2d 3h 5m" — matching map.ukrainealarm.com's own format
function formatElapsed(lang: string, fromDate: Date): string {
    const totalMin = Math.max(0, Math.floor((Date.now() - fromDate.getTime()) / 60000));
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}${t(lang, 'days')}`);
    if (days > 0 || hours > 0) parts.push(`${hours}${t(lang, 'hours')}`);
    parts.push(`${mins}${t(lang, 'minutes')}`);
    return parts.join(' ');
}

function setupSettings(): void {
    const settingsBtn = document.getElementById('settings-btn')!;
    const closeSettingsBtn = document.getElementById('close-settings')!;
    const settingsPanel = document.getElementById('settings-panel')!;
    const saveBtn = document.getElementById('save-settings')!;
    const saveStatus = document.getElementById('save-status')!;
    const enableGeo = document.getElementById('enable-geo') as HTMLInputElement;
    const notifyOnlyMine = document.getElementById('notify-only-mine') as HTMLInputElement;
    const hideOthers = document.getElementById('hide-others') as HTMLInputElement;
    const regionDisplay = document.getElementById('region-status-value')!;
    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
    const timeFormatSelect = document.getElementById('time-format-select') as HTMLSelectElement;

    const appVersion = document.getElementById('app-version') as HTMLAnchorElement;
    const newBadge = document.getElementById('new-badge')!;
    appVersion.textContent = `v${chrome.runtime.getManifest().version}`;
    appVersion.href = CHANGELOG_URL;

    const addCustomBtn = document.getElementById('add-custom-region')!;
    const customInput = document.getElementById('custom-region-input') as HTMLInputElement;
    const customList = document.getElementById('custom-regions-list')!;

    // Options beyond "system" come from _locales/languages.json (see lib/i18n.ts) —
    // adding a new _locales/<lang>/messages.json + `npm run sync-languages` is
    // enough for it to show up here, no HTML/JS edits needed.
    LANGUAGE_LIST.forEach(({ code, name }) => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = name;
        languageSelect.appendChild(opt);
    });

    chrome.storage.local.get(['enableGeo', 'notifyOnlyMine', 'hideOthers', 'myRegion', 'customRegions', 'theme', 'language', 'timeFormat', 'unseenUpdate'], (result) => {
        if (result.enableGeo) enableGeo.checked = true;
        if (result.notifyOnlyMine) notifyOnlyMine.checked = true;
        if (result.hideOthers) hideOthers.checked = true;
        if (result.myRegion) {
            regionDisplay.textContent = result.myRegion;
            currentMyRegion = result.myRegion;
        } else {
            regionDisplay.textContent = t(currentLang, 'regionNotDetermined');
        }
        if (result.customRegions) {
            customRegionsArr = result.customRegions;
            renderCustomRegions(customList);
        }
        themeSelect.value = result.theme || 'system';
        languageSelect.value = result.language || 'system';
        timeFormatSelect.value = result.timeFormat || 'system';
        if (result.unseenUpdate) {
            settingsBtn.classList.add('has-update');
            newBadge.classList.remove('hidden');
        }
        populateRegionsDatalist();
    });

    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('hidden');
        // The badge next to the version stays visible for this popup session
        settingsBtn.classList.remove('has-update');
        chrome.storage.local.set({ unseenUpdate: false });
    });
    closeSettingsBtn.addEventListener('click', () => settingsPanel.classList.add('hidden'));

    themeSelect.addEventListener('change', () => {
        chrome.storage.local.set({ theme: themeSelect.value });
        applyTheme(resolveTheme(themeSelect.value));
    });

    languageSelect.addEventListener('change', () => {
        chrome.storage.local.set({ language: languageSelect.value }, () => {
            getLanguage((lang) => {
                currentLang = lang;
                applyStaticI18n(currentLang);
                loadData();
            });
        });
    });

    // storage.onChanged re-renders the list with the new format
    timeFormatSelect.addEventListener('change', () => {
        chrome.storage.local.set({ timeFormat: timeFormatSelect.value });
    });

    addCustomBtn.addEventListener('click', () => {
        const val = customInput.value.trim();
        if (val && !customRegionsArr.includes(val)) {
            customRegionsArr.push(val);
            renderCustomRegions(customList);
            customInput.value = '';
            persistCustomRegions();
        }
    });

    customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCustomBtn.click();
    });

    enableGeo.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) {
            regionDisplay.textContent = t(currentLang, 'regionDetecting');
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    try {
                        const res = await fetch(`${GEOCODE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=uk`);
                        const data = await res.json();
                        let region: string = data.principalSubdivision || data.city;
                        if (region === 'Київ') region = 'м. Київ';
                        else if (region === 'Севастополь') region = 'м. Севастополь';

                        regionDisplay.textContent = region;
                        currentMyRegion = region;
                        // Save immediately — otherwise background.js keeps using the
                        // old myRegion until someone clicks "Save" again.
                        chrome.storage.local.set({ myRegion: region, enableGeo: true }, () => {
                            chrome.runtime.sendMessage({ action: 'forceUpdate' });
                            setTimeout(loadData, 500);
                        });
                    } catch (err) {
                        regionDisplay.textContent = t(currentLang, 'regionDetectError');
                        (e.target as HTMLInputElement).checked = false;
                    }
                }, () => {
                    regionDisplay.textContent = t(currentLang, 'regionAccessDenied');
                    (e.target as HTMLInputElement).checked = false;
                });
            } else {
                regionDisplay.textContent = t(currentLang, 'regionNotSupported');
                (e.target as HTMLInputElement).checked = false;
            }
        } else {
            regionDisplay.textContent = t(currentLang, 'regionNotDetermined');
            currentMyRegion = null;
            chrome.storage.local.set({ myRegion: null, enableGeo: false }, () => {
                chrome.runtime.sendMessage({ action: 'forceUpdate' });
            });
        }
    });

    saveBtn.addEventListener('click', () => {
        chrome.storage.local.set({
            enableGeo: enableGeo.checked,
            notifyOnlyMine: notifyOnlyMine.checked,
            hideOthers: hideOthers.checked,
            myRegion: currentMyRegion,
            customRegions: customRegionsArr
        }, () => {
            saveStatus.classList.remove('hidden');
            setTimeout(() => saveStatus.classList.add('hidden'), 2000);
            chrome.runtime.sendMessage({ action: 'forceUpdate' });
            setTimeout(loadData, 500);
            settingsPanel.classList.add('hidden');
        });
    });
}

// The list of all region names for autocomplete is refreshed server-side by
// the proxy Worker once a day, together with the alert data — this just reads
// the already-cached list from storage, no network request of its own.
function populateRegionsDatalist(): void {
    chrome.storage.local.get(['allRegionNames'], (result) => {
        const names: string[] = result.allRegionNames || [];
        const datalist = document.getElementById('regions-datalist')!;
        datalist.innerHTML = '';
        names.slice().sort((a, b) => a.localeCompare(b, LOCALE_TAGS[currentLang])).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            datalist.appendChild(option);
        });
    });
}

function renderCustomRegions(listElement: HTMLElement): void {
    listElement.innerHTML = '';
    customRegionsArr.forEach((cr, index) => {
        const li = document.createElement('li');
        li.textContent = cr;
        const rmBtn = document.createElement('button');
        rmBtn.innerHTML = '&times;';
        rmBtn.onclick = () => {
            customRegionsArr.splice(index, 1);
            renderCustomRegions(listElement);
            persistCustomRegions();
        };
        li.appendChild(rmBtn);
        listElement.appendChild(li);
    });
}

// Save immediately when a region is added/removed — otherwise, just like
// automatic region detection, the change is only visible in this popup
// session until someone clicks "Save" again, while background.js keeps
// working off the old list.
function persistCustomRegions(): void {
    chrome.storage.local.set({ customRegions: customRegionsArr }, () => {
        chrome.runtime.sendMessage({ action: 'forceUpdate' });
        setTimeout(loadData, 500);
    });
}

// ── Countdown timer in error block ──────────────────────────────────────────
let _countdownInterval: ReturnType<typeof setInterval> | undefined;

function showErrorWithCountdown(lang: string, el: HTMLElement, errorText: string, retryAt: number | null): void {
    clearInterval(_countdownInterval);

    function render() {
        const remaining = retryAt ? Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)) : 0;
        const mins = Math.floor(remaining / 60);
        const secs = (remaining % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;

        el.innerHTML = `
            <div class="error-main">${errorText}</div>
            ${retryAt
                ? `<div class="error-retry">
                     ${remaining > 0
                         ? `${t(lang, 'retryIn')} <strong>${timeStr}</strong>`
                         : t(lang, 'retryingNow')}
                   </div>`
                : ''}
        `;
        if (remaining <= 0) clearInterval(_countdownInterval);
    }

    render();
    if (retryAt) {
        _countdownInterval = setInterval(render, 1000);
    }
}

function loadData(): void {

    chrome.storage.local.get(['lastData', 'lastUpdate', 'apiError', 'apiErrorParams', 'dataStale', 'retryAt', 'myRegion', 'customRegions', 'hideOthers', 'timeFormat'], (result) => {
        const loader = document.getElementById('loader')!;
        const errorMsg = document.getElementById('error-message')!;
        const list = document.getElementById('regions-list')!;

        loader.classList.add('hidden');

        if (result.apiError) {
            const errorText = t(currentLang, result.apiError, result.apiErrorParams || undefined);
            showErrorWithCountdown(currentLang, errorMsg, errorText, result.retryAt || null);
            errorMsg.classList.remove('hidden');
            list.classList.add('hidden');
            return;
        } else {
            errorMsg.classList.add('hidden');
        }

        if (result.lastData && result.lastUpdate) {
            renderData(result.lastData, result.lastUpdate, result.myRegion, result.customRegions || [], result.hideOthers, result.dataStale, result.timeFormat);
        } else {
            setTimeout(loadData, 1000);
        }
    });
}

interface RegionDisplayItem {
    name: string;
    data: RegionState;
    isMonitored: boolean;
}

function renderData(
    states: Record<string, RegionState>,
    lastUpdate: number,
    myRegion: string | undefined,
    customRegions: string[],
    hideOthers: boolean | undefined,
    dataStale: boolean | undefined,
    timeFormat: string | undefined
): void {
    const list = document.getElementById('regions-list')!;
    list.classList.remove('hidden');
    list.innerHTML = '';

    const updateDate = new Date(lastUpdate);
    document.getElementById('last-update')!.textContent =
        formatTime(updateDate, currentLang, timeFormat, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + (dataStale ? ` ${t(currentLang, 'staleNotice')}` : '');

    // Convert to array and filter out non-States unless it's a monitored custom region
    const regionsToDisplay: RegionDisplayItem[] = [];
    const processedNames = new Set<string>();

    Object.entries(states).forEach(([name, data]) => {
        const isMonitored = isRegionMonitored(name, myRegion, customRegions);

        if (hideOthers && !isMonitored) return;

        if (data.type === 'State' || isMonitored) {
            regionsToDisplay.push({name, data, isMonitored});
            processedNames.add(name);
        }
    });

    // Ensure myRegion is rendered even if not alerting
    if (myRegion && !processedNames.has(myRegion)) {
        regionsToDisplay.push({
            name: myRegion,
            data: { alertnow: false, type: 'Unknown' },
            isMonitored: true
        });
        processedNames.add(myRegion);
    }

    // Ensure customRegions are rendered even if not alerting
    customRegions.forEach(cr => {
        // Check if already processed by substring match
        const alreadyAdded = Array.from(processedNames).some(n => n.toLowerCase().includes(cr.toLowerCase()));
        if (!alreadyAdded) {
            regionsToDisplay.push({
                name: cr,
                data: { alertnow: false, type: 'Unknown' },
                isMonitored: true
            });
            processedNames.add(cr);
        }
    });

    regionsToDisplay.sort((a, b) => {
        if (a.isMonitored && !b.isMonitored) return -1;
        if (!a.isMonitored && b.isMonitored) return 1;

        if (a.data.alertnow && !b.data.alertnow) return -1;
        if (!a.data.alertnow && b.data.alertnow) return 1;

        return a.name.localeCompare(b.name, LOCALE_TAGS[currentLang]);
    });

    regionsToDisplay.forEach((itemInfo) => {
        const {name, data, isMonitored} = itemInfo;

        const item = document.createElement('li');
        item.className = `region-item ${data.alertnow ? 'active' : ''}`;

        let alertLines = '';
        let firstIconKey = DEFAULT_ALERT_ICON_KEY;

        if (data.alertnow && data.alerts) {
            data.alerts.forEach((alert: AlertEntry, idx: number) => {
                // API field is `alertType`, not `type`
                const alertType = alert.alertType || alert.type || '';

                const typeIconKey = ALERT_TYPE_ICONS[alertType] || DEFAULT_ALERT_ICON_KEY;
                const typeName = alertTypeName(currentLang, alertType);
                if (idx === 0) firstIconKey = typeIconKey;

                const addLine = (levelStr: string | null, text: string) => {
                    // The icon always matches the alert TYPE (as on map.ukrainealarm.com,
                    // which has a single glyph for air raid alerts) — level conveys color.
                    const color = (levelStr && ALERT_LEVEL_COLORS[levelStr]) || ALERT_TYPE_COLORS[alertType] || ALERT_LEVEL_COLORS.default;
                    alertLines += `<div class="alert-line" style="color:${color};"><span class="alert-line-icon">${ICONS[typeIconKey]}</span>${text}</div>`;
                };

                // If the alert was rolled up from a district/community into its
                // oblast (server-side aggregation), show exactly where it's from,
                // same as the official map's own detail view.
                const withSource = (text: string) => alert.sourceRegionName ? `${text} — ${alert.sourceRegionName}` : text;

                if (alert.activeAlertLevels && alert.activeAlertLevels.length > 0) {
                    alert.activeAlertLevels.forEach(levelInfo => {
                        addLine(levelInfo.alertLevel, withSource(levelInfo.reason || typeName));
                    });
                } else if (alert.alertLevel) {
                    addLine(alert.alertLevel, withSource(typeName));
                } else {
                    addLine(null, withSource(typeName));
                }
            });
        }

        const iconLevelClass = data.hasRed ? 'red' : (data.hasYellow ? 'yellow' : (data.hasArtillery ? 'artillery' : (data.hasUrbanFights ? 'urbanFights' : 'generic')));
        const iconKey = (data.hasRed || data.hasYellow) ? 'air' : firstIconKey;

        let metaStr = '';
        if (data.alertnow && data.changed) {
            const changedDate = new Date(data.changed);
            const timePart = formatTime(changedDate, currentLang, timeFormat, { hour: '2-digit', minute: '2-digit' });
            metaStr = `${timePart} · ${formatElapsed(currentLang, changedDate)} ${t(currentLang, 'ago')}`;
        }

        item.innerHTML = `
            <div class="region-icon ${data.alertnow ? `region-icon--${iconLevelClass}` : 'region-icon--safe'}">${data.alertnow ? ICONS[iconKey] : ''}</div>
            <div class="region-info">
                <div class="region-name">${isMonitored ? '⭐ ' : ''}${name}</div>
                ${alertLines ? `<div class="region-alert-lines">${alertLines}</div>` : ''}
                ${metaStr ? `<div class="region-meta">${metaStr}</div>` : ''}
            </div>
        `;
        list.appendChild(item);
    });

    // For visual count, just count the monitored ones if setting is on
    chrome.storage.local.get(['notifyOnlyMine'], (result) => {
        let displayCount = 0;
        if (result.notifyOnlyMine) {
            regionsToDisplay.forEach(r => { if(r.isMonitored && r.data.alertnow) displayCount++; });
        } else {
            regionsToDisplay.forEach(r => { if((r.data.type === 'State' || r.isMonitored) && r.data.alertnow) displayCount++; });
        }

        document.getElementById('active-count')!.textContent = String(displayCount);

        const radar = document.querySelector('.radar') as HTMLElement | null;
        if (!radar) return;
        if (displayCount > 0) {
            radar.style.animationPlayState = 'running';
            radar.style.backgroundColor = 'var(--alert-red)';
        } else {
            radar.style.animationPlayState = 'paused';
            radar.style.backgroundColor = 'var(--no-alert-color)';
            radar.style.boxShadow = 'none';
        }
    });
}
