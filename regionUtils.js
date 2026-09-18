// Shared logic for "am I watching this region" — used by both background.js
// (service worker) and popup.js.
function isRegionMonitored(regionName, myRegion, customRegions) {
  const isAuto = myRegion && (regionName.includes(myRegion) || myRegion.includes(regionName));
  const isCustom = (customRegions || []).some(cr => regionName.toLowerCase().includes(cr.toLowerCase()));
  return isAuto || isCustom;
}
