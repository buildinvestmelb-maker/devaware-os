import type { FeatureCollection, GeoJsonObject } from 'geojson';

export type AustralianState =
  | 'NSW'
  | 'VIC'
  | 'QLD'
  | 'WA'
  | 'SA'
  | 'TAS'
  | 'ACT'
  | 'NT';

export type ParcelIdScheme = 'lot-dp' | 'spi' | 'lot-plan' | 'ct' | 'gnaf';

export interface Mga2020Zone {
  mgaZone: number;
  mgaEpsg: string;
}

/**
 * Computes the Australian Map Grid of Australia 2020 (GDA2020 / MGA2020) zone
 * and corresponding EPSG code (Zones 49–56 / EPSG:7849–EPSG:7856) from WGS84/GDA2020 longitude.
 */
export function getMga2020FromLng(lng: number): Mga2020Zone {
  const rawZone = Math.floor((lng + 180) / 6) + 1;
  const mgaZone = Math.min(56, Math.max(49, rawZone));
  return {
    mgaZone,
    mgaEpsg: `EPSG:${7800 + mgaZone}`,
  };
}

export interface SiteLocation {
  address?: string;
  lga?: string;
  state: AustralianState;
  lat: number;
  lng: number;
  mgaZone: number;
  mgaEpsg: string;
}

export interface SiteGeometry {
  parcelId?: string;
  parcelIdScheme?: ParcelIdScheme;
  boundaryGeoJson?: FeatureCollection | GeoJsonObject;
  exclusionMasksGeoJson?: FeatureCollection | GeoJsonObject;
  grossAreaSqm?: number;
  netDevelopableAreaSqm?: number;
}

export interface SiteEarthworks {
  cutVolumeM3?: number;
  fillVolumeM3?: number;
  netBalanceM3?: number;
  importExportVolumeM3?: number;
  bulkEarthworksCostAud?: number;
  retainingWallLengthM?: number;
  retainingWallCostAud?: number;
  civilAllowanceAud?: number;
  finishedFloorLevelAHD?: number;
  updatedByApp?: string;
}

export interface SiteMassing {
  lotYield?: number;
  dwellingYield?: number;
  grossFloorAreaSqm?: number;
  netSaleableAreaSqm?: number;
  siteCoveragePct?: number;
  maxHeightM?: number;
  fsr?: number;
  storeys?: number;
  zoningCode?: string;
}

export interface SiteEnvironment {
  bushfireAttackLevel?:
    | 'BAL-LOW'
    | 'BAL-12.5'
    | 'BAL-19'
    | 'BAL-29'
    | 'BAL-40'
    | 'BAL-FZ';
  floodOverlay?: boolean;
  biodiversityOffsetHa?: number;
  solarExposureHrs?: number;
  windRegion?: 'A' | 'B' | 'C' | 'D';
  climateZone?: string;
}

export interface SiteFeasibility {
  grossRealisationAud?: number;
  totalDevelopmentCostAud?: number;
  constructionCostPerSqmAud?: number;
  statutoryContributionsAud?: number;
  stampDutyRatePct?: number;
  targetMarginPct?: number;
  residualLandValueAud?: number;
  rlvPerSqmAud?: number;
  profitOnCostPct?: number;
  gstScheme?: 'margin-scheme' | 'full-gst';
}

export interface SiteProject {
  projectId: string;
  name: string;
  updatedAt: string;
  location: SiteLocation;
  geometry: SiteGeometry;
  earthworks?: SiteEarthworks;
  massing?: SiteMassing;
  environment?: SiteEnvironment;
  feasibility?: SiteFeasibility;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Array<unknown>
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export type ChildToHostMessage =
  | {
      type: 'APP_READY';
      appId?: string;
      version?: string;
    }
  | {
      type: 'APP_FOCUS';
      appId?: string;
    }
  | {
      type: 'OPEN_APP';
      appId?: string;
      targetAppId?: string;
      sourceAppId?: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'PROJECT_PATCH';
      patch: DeepPartial<SiteProject>;
      sourceAppId?: string;
    }
  | {
      type: 'NOTIFY';
      level?: ToastLevel;
      title: string;
      message?: string;
    };

export type HostToChildMessage =
  | {
      type: 'OS_INIT';
      theme: 'dark';
      project: SiteProject;
      active: boolean;
      appId: string;
      windowId: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'OS_PAYLOAD';
      payload: Record<string, unknown>;
    }
  | {
      type: 'OS_PROJECT_SYNC';
      project: SiteProject;
      sourceAppId?: string;
      updatedAt: string;
    }
  | {
      type: 'OS_RENDER_STATE';
      active: boolean;
      reason?: 'focus' | 'blur' | 'minimize' | 'restore' | 'init';
    };

export const CHILD_TO_HOST_MESSAGE_TYPES = [
  'APP_READY',
  'APP_FOCUS',
  'OPEN_APP',
  'PROJECT_PATCH',
  'NOTIFY',
] as const;

export function isChildToHostMessage(data: unknown): data is ChildToHostMessage {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  if (typeof candidate.type !== 'string') return false;

  switch (candidate.type) {
    case 'APP_READY':
    case 'APP_FOCUS':
      return true;
    case 'OPEN_APP':
      return (
        (typeof candidate.appId === 'string' && candidate.appId.length > 0) ||
        (typeof candidate.targetAppId === 'string' &&
          candidate.targetAppId.length > 0)
      );
    case 'PROJECT_PATCH':
      return Boolean(candidate.patch && typeof candidate.patch === 'object');
    case 'NOTIFY':
      return typeof candidate.title === 'string' && candidate.title.length > 0;
    default:
      return false;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function deepMergeRecord<T extends Record<string, unknown>>(
  base: T,
  patch: Record<string, unknown>,
): T {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    // Treat GeoJSON payloads as atomic replacements rather than merging coordinates
    if (key === 'boundaryGeoJson' || key === 'exclusionMasksGeoJson') {
      result[key] = value;
      continue;
    }
    const existing = result[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = deepMergeRecord(existing, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/**
 * Deep-merges a partial project patch into the active SiteProject.
 * Automatically recomputes MGA2020 zone/EPSG if location.lng changes.
 */
export function mergeSiteProject(
  base: SiteProject,
  patch: DeepPartial<SiteProject>,
  nowIso: string = new Date().toISOString(),
): SiteProject {
  const merged = deepMergeRecord(
    base as unknown as Record<string, unknown>,
    patch as unknown as Record<string, unknown>,
  ) as unknown as SiteProject;

  if (
    patch.location &&
    typeof patch.location.lng === 'number' &&
    patch.location.mgaZone === undefined &&
    patch.location.mgaEpsg === undefined
  ) {
    const mga = getMga2020FromLng(patch.location.lng);
    merged.location = {
      ...merged.location,
      mgaZone: mga.mgaZone,
      mgaEpsg: mga.mgaEpsg,
    };
  }

  return {
    ...merged,
    updatedAt: patch.updatedAt ?? nowIso,
  };
}
