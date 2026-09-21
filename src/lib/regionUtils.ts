// Shared logic for "am I watching this region" — used by both background.ts
// (service worker) and popup.ts.
export function isRegionMonitored(regionName: string, myRegion: string | null | undefined, customRegions: string[] | undefined): boolean {
  const isAuto = !!myRegion && (regionName.includes(myRegion) || myRegion.includes(regionName));
  const isCustom = (customRegions || []).some((cr) => regionName.toLowerCase().includes(cr.toLowerCase()));
  return isAuto || isCustom;
}
