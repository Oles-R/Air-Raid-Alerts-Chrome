let currentLang = DEFAULT_LANGUAGE;

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
    if (changes.lastData || changes.apiError || changes.lastUpdate) {
        loadData();
    }
    if (changes.allRegionNames) {
        populateRegionsDatalist();
    }
});

let currentMyRegion = null;
let customRegionsArr = [];

// "5m", "1h 10m", "2d 3h 5m" — matching map.ukrainealarm.com's own format
function formatElapsed(lang, fromDate) {
    const totalMin = Math.max(0, Math.floor((Date.now() - fromDate.getTime()) / 60000));
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}${t(lang, 'days')}`);
    if (days > 0 || hours > 0) parts.push(`${hours}${t(lang, 'hours')}`);
    parts.push(`${mins}${t(lang, 'minutes')}`);
    return parts.join(' ');
}

function setupSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const saveBtn = document.getElementById('save-settings');
    const saveStatus = document.getElementById('save-status');
    const enableGeo = document.getElementById('enable-geo');
    const notifyOnlyMine = document.getElementById('notify-only-mine');
    const hideOthers = document.getElementById('hide-others');
    const regionDisplay = document.getElementById('region-status-value');
    const themeSelect = document.getElementById('theme-select');
    const languageSelect = document.getElementById('language-select');

    const addCustomBtn = document.getElementById('add-custom-region');
    const customInput = document.getElementById('custom-region-input');
    const customList = document.getElementById('custom-regions-list');

    // Options beyond "system" come from _locales/languages.json (see i18n.js) —
    // adding a new _locales/<lang>/messages.json + `npm run sync-languages` is
    // enough for it to show up here, no HTML/JS edits needed.
    LANGUAGE_LIST.forEach(({ code, name }) => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = name;
        languageSelect.appendChild(opt);
    });

    chrome.storage.local.get(['enableGeo', 'notifyOnlyMine', 'hideOthers', 'myRegion', 'customRegions', 'theme', 'language'], (result) => {
        if (result.enableGeo) enableGeo.checked = true;
        if (result.notifyOnlyMine) notifyOnlyMine.checked = true;
        if (result.hideOthers) hideOthers.checked = true;
        if (result.myRegion) {
            regionDisplay.textContent = translateRegionName(currentLang, result.myRegion);
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
        populateRegionsDatalist();
    });

    settingsBtn.addEventListener('click', () => settingsPanel.classList.remove('hidden'));
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
        if (e.target.checked) {
            regionDisplay.textContent = t(currentLang, 'regionDetecting');
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    try {
                        const res = await fetch(`${GEOCODE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=uk`);
                        const data = await res.json();
                        let region = data.principalSubdivision || data.city;
                        if (region === 'Київ') region = 'м. Київ';
                        else if (region === 'Севастополь') region = 'м. Севастополь';

                        regionDisplay.textContent = translateRegionName(currentLang, region);
                        currentMyRegion = region;
                        // Save immediately — otherwise background.js keeps using the
                        // old myRegion until someone clicks "Save" again.
                        chrome.storage.local.set({ myRegion: region, enableGeo: true }, () => {
                            chrome.runtime.sendMessage({ action: 'forceUpdate' });
                            setTimeout(loadData, 500);
                        });
                    } catch (err) {
                        regionDisplay.textContent = t(currentLang, 'regionDetectError');
                        e.target.checked = false;
                    }
                }, (error) => {
                    regionDisplay.textContent = t(currentLang, 'regionAccessDenied');
                    e.target.checked = false;
                });
            } else {
                regionDisplay.textContent = t(currentLang, 'regionNotSupported');
                e.target.checked = false;
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
function populateRegionsDatalist() {
    chrome.storage.local.get(['allRegionNames'], (result) => {
        const names = result.allRegionNames || [];
        const datalist = document.getElementById('regions-datalist');
        datalist.innerHTML = '';
        names.slice().sort((a, b) => a.localeCompare(b, LOCALE_TAGS[currentLang])).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            datalist.appendChild(option);
        });
    });
}

function renderCustomRegions(listElement) {
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
function persistCustomRegions() {
    chrome.storage.local.set({ customRegions: customRegionsArr }, () => {
        chrome.runtime.sendMessage({ action: 'forceUpdate' });
        setTimeout(loadData, 500);
    });
}

// ── Countdown timer in error block ──────────────────────────────────────────
let _countdownInterval = null;

function showErrorWithCountdown(lang, el, errorText, retryAt) {
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

function loadData() {

    chrome.storage.local.get(['lastData', 'lastUpdate', 'apiError', 'apiErrorParams', 'dataStale', 'retryAt', 'myRegion', 'customRegions', 'hideOthers'], (result) => {
        const loader = document.getElementById('loader');
        const errorMsg = document.getElementById('error-message');
        const list = document.getElementById('regions-list');

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
            renderData(result.lastData, result.lastUpdate, result.myRegion, result.customRegions || [], result.hideOthers, result.dataStale);
        } else {
            setTimeout(loadData, 1000);
        }
    });
}

function renderData(states, lastUpdate, myRegion, customRegions, hideOthers, dataStale) {
    const list = document.getElementById('regions-list');
    list.classList.remove('hidden');
    list.innerHTML = '';

    const updateDate = new Date(lastUpdate);
    document.getElementById('last-update').textContent =
        updateDate.toLocaleTimeString(LOCALE_TAGS[currentLang]) + (dataStale ? ` ${t(currentLang, 'staleNotice')}` : '');

    let activeCount = 0;

    // Convert to array and filter out non-States unless it's a monitored custom region
    let regionsToDisplay = [];
    let processedNames = new Set();

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

    regionsToDisplay.forEach((item) => { item.displayName = translateRegionName(currentLang, item.name); });

    regionsToDisplay.sort((a, b) => {
        if (a.isMonitored && !b.isMonitored) return -1;
        if (!a.isMonitored && b.isMonitored) return 1;

        if (a.data.alertnow && !b.data.alertnow) return -1;
        if (!a.data.alertnow && b.data.alertnow) return 1;

        return a.displayName.localeCompare(b.displayName, LOCALE_TAGS[currentLang]);
    });

    regionsToDisplay.forEach((itemInfo) => {
        const {displayName, data, isMonitored} = itemInfo;

        if (data.alertnow && data.type === 'State') activeCount++;

        const item = document.createElement('li');
        item.className = `region-item ${data.alertnow ? 'active' : ''}`;

        let alertLines = '';
        let firstIconKey = DEFAULT_ALERT_ICON_KEY;

        if (data.alertnow && data.alerts) {
            data.alerts.forEach((alert, idx) => {
                // API field is `alertType`, not `type`
                const alertType = alert.alertType || alert.type;

                const typeIconKey = ALERT_TYPE_ICONS[alertType] || DEFAULT_ALERT_ICON_KEY;
                const typeName = t(currentLang, `alertType_${alertType}`) === `alertType_${alertType}`
                    ? (alertType || t(currentLang, 'alertType_default'))
                    : t(currentLang, `alertType_${alertType}`);
                if (idx === 0) firstIconKey = typeIconKey;

                const addLine = (levelStr, text) => {
                    // The icon always matches the alert TYPE (as on map.ukrainealarm.com,
                    // which has a single glyph for air raid alerts) — level conveys color.
                    const color = ALERT_LEVEL_COLORS[levelStr] || ALERT_TYPE_COLORS[alertType] || ALERT_LEVEL_COLORS.default;
                    alertLines += `<div class="alert-line" style="color:${color};"><span class="alert-line-icon">${ICONS[typeIconKey]}</span>${text}</div>`;
                };

                // If the alert was rolled up from a district/community into its
                // oblast (server-side aggregation), show exactly where it's from,
                // same as the official map's own detail view.
                const withSource = (text) => alert.sourceRegionName ? `${text} — ${alert.sourceRegionName}` : text;

                if (alert.activeAlertLevels && alert.activeAlertLevels.length > 0) {
                    alert.activeAlertLevels.forEach(levelInfo => {
                        const reasonText = levelInfo.reason ? translateAlertReason(currentLang, levelInfo.reason) : typeName;
                        addLine(levelInfo.alertLevel, withSource(reasonText));
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
            const timePart = changedDate.toLocaleTimeString(LOCALE_TAGS[currentLang], { hour: '2-digit', minute: '2-digit' });
            metaStr = `${timePart} · ${formatElapsed(currentLang, changedDate)} ${t(currentLang, 'ago')}`;
        }

        item.innerHTML = `
            <div class="region-icon ${data.alertnow ? `region-icon--${iconLevelClass}` : 'region-icon--safe'}">${data.alertnow ? ICONS[iconKey] : ''}</div>
            <div class="region-info">
                <div class="region-name">${isMonitored ? '⭐ ' : ''}${displayName}</div>
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

        document.getElementById('active-count').textContent = displayCount;

        const radar = document.querySelector('.radar');
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
