export type AppId =
  | 'cutsheet-au'
  | 'feaso-os'
  | 'formgen-au'
  | 'enviro-sim-au'
  | 'file-explorer'
  | 'project-inspector';

export type AppRuntime = 'iframe' | 'builtin' | 'spec';

export type AppCategory =
  | 'Terrain & Civil'
  | 'Feasibility'
  | 'Massing & Yield'
  | 'Environment & Risk'
  | 'System';

export type AppStatus = 'live' | 'coming-soon';

export interface AppDefinition {
  id: AppId;
  name: string;
  shortName: string;
  description: string;
  category: AppCategory;
  runtime: AppRuntime;
  status: AppStatus;
  singleInstance: boolean;
  defaultSize: {
    width: number;
    height: number;
  };
  minSize: {
    width: number;
    height: number;
  };
  /** Iframe source URL for live micro-apps. */
  url?: string;
  /** Public GitHub repository for source transparency. */
  repoUrl?: string;
  /** Whether this app appears in the 4-app industry catalog in the App Library. */
  isIndustryApp: boolean;
  /** Default pinned state on desktop / launcher. */
  defaultPinned: boolean;
  /** Icon key resolved by the desktop shell UI. */
  icon:
    | 'mountain'
    | 'calculator'
    | 'blocks'
    | 'wind'
    | 'folder'
    | 'terminal';
  /** High-level capabilities shown on spec cards and App Library. */
  capabilities: string[];
  /** Spec-card release roadmap notes for coming-soon apps. */
  roadmapNote?: string;
}

const cutsheetEnvUrl =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  typeof import.meta.env.VITE_CUTSHEET_URL === 'string' &&
  import.meta.env.VITE_CUTSHEET_URL.trim().length > 0
    ? import.meta.env.VITE_CUTSHEET_URL.trim()
    : '/mock-apps/cutsheet.html';

const feasoEnvUrl =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  typeof import.meta.env.VITE_FEASO_URL === 'string' &&
  import.meta.env.VITE_FEASO_URL.trim().length > 0
    ? import.meta.env.VITE_FEASO_URL.trim()
    : '/mock-apps/feaso.html';

export const APP_REGISTRY: Record<AppId, AppDefinition> = {
  'cutsheet-au': {
    id: 'cutsheet-au',
    name: 'CutSheet AU',
    shortName: 'CutSheet',
    description:
      'GDA2020 / MGA2020 bulk earthworks, cut-and-fill balancing, retaining allowance, and terrain grading workbench.',
    category: 'Terrain & Civil',
    runtime: 'iframe',
    status: 'live',
    singleInstance: true,
    defaultSize: { width: 980, height: 640 },
    minSize: { width: 460, height: 360 },
    url: cutsheetEnvUrl,
    repoUrl: 'https://github.com/devaware-au/cutsheet-au',
    isIndustryApp: true,
    defaultPinned: true,
    icon: 'mountain',
    capabilities: [
      'Auto MGA2020 Zones 49–56 (EPSG:7849–7856)',
      'Cut / Fill volume & net import-export balance (m³)',
      'Direct PROJECT_PATCH sync into Feaso OS',
      'WebGL render-loop pause on background blur',
    ],
  },
  'feaso-os': {
    id: 'feaso-os',
    name: 'Feaso OS',
    shortName: 'Feaso OS',
    description:
      'Australia-wide metric AUD feasibility and Residual Land Value engine with state statutory transfer duty & levy contexts.',
    category: 'Feasibility',
    runtime: 'iframe',
    status: 'live',
    singleInstance: false,
    defaultSize: { width: 820, height: 580 },
    minSize: { width: 420, height: 340 },
    url: feasoEnvUrl,
    repoUrl: 'https://github.com/devaware-au/feaso-os',
    isIndustryApp: true,
    defaultPinned: true,
    icon: 'calculator',
    capabilities: [
      'State-aware statutory labels (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)',
      'Live Residual Land Value (AUD) reactive to civil patches',
      'Margin scheme & target profit-on-cost sensitivity',
      'Metric $/m² land & construction benchmarking',
    ],
  },
  'formgen-au': {
    id: 'formgen-au',
    name: 'FormGen AU',
    shortName: 'FormGen',
    description:
      'Parametric Australian lot subdivision, apartment envelope generator, FSR & setback compliance massing engine.',
    category: 'Massing & Yield',
    runtime: 'spec',
    status: 'coming-soon',
    singleInstance: true,
    defaultSize: { width: 920, height: 620 },
    minSize: { width: 480, height: 360 },
    repoUrl: 'https://github.com/devaware-au/formgen-au',
    isIndustryApp: true,
    defaultPinned: false,
    icon: 'blocks',
    capabilities: [
      'State LEP / Planning Scheme envelope presets',
      'Automated lot yield & Net Saleable Area (m²) schedules',
      'GFA / FSR / solar access envelope testing',
      'Single-instance WebGL viewport with OS_RENDER_STATE',
    ],
    roadmapNote:
      'Contract-locked against SiteProject.massing. Next open-source module on the devaware-au roadmap.',
  },
  'enviro-sim-au': {
    id: 'enviro-sim-au',
    name: 'EnviroSim AU',
    shortName: 'EnviroSim',
    description:
      'AS 3959 Bushfire Attack Level (BAL), overland flood constraint, biodiversity offset (ha), and solar microclimate simulator.',
    category: 'Environment & Risk',
    runtime: 'spec',
    status: 'coming-soon',
    singleInstance: true,
    defaultSize: { width: 920, height: 620 },
    minSize: { width: 480, height: 360 },
    repoUrl: 'https://github.com/devaware-au/enviro-sim-au',
    isIndustryApp: true,
    defaultPinned: false,
    icon: 'wind',
    capabilities: [
      'AS 3959 BAL setback & vegetation slope screening',
      '1% AEP flood overlay & exclusion mask export',
      'AS/NZS 1170.2 Wind Regions A–D & NatHERS climate zones',
      'Single-instance WebGL solver with OS_RENDER_STATE',
    ],
    roadmapNote:
      'Contract-locked against SiteProject.environment & exclusionMasksGeoJson.',
  },
  'file-explorer': {
    id: 'file-explorer',
    name: 'Projects (AU)',
    shortName: 'Projects (AU)',
    description:
      'National Australian state & territory repository for .deal site workspaces with GDA2020 MGA zone resolution.',
    category: 'System',
    runtime: 'builtin',
    status: 'live',
    singleInstance: true,
    defaultSize: { width: 860, height: 540 },
    minSize: { width: 520, height: 360 },
    repoUrl: 'https://github.com/devaware-au/devaware-os',
    isIndustryApp: false,
    defaultPinned: true,
    icon: 'folder',
    capabilities: [
      'Browse NSW, VIC, QLD, WA, SA, TAS, ACT & NT deal folders',
      'Double-click .deal files to tile CutSheet AU + Feaso OS',
      'Auto-computes GDA2020 MGA zone from site coordinates',
    ],
  },
  'project-inspector': {
    id: 'project-inspector',
    name: 'Project Inspector',
    shortName: 'Inspector',
    description:
      'Live JSON inspector for the active SiteProject store and real-time @devaware/os-bridge postMessage bus monitor.',
    category: 'System',
    runtime: 'builtin',
    status: 'live',
    singleInstance: true,
    defaultSize: { width: 780, height: 540 },
    minSize: { width: 460, height: 340 },
    repoUrl: 'https://github.com/devaware-au/devaware-os',
    isIndustryApp: false,
    defaultPinned: true,
    icon: 'terminal',
    capabilities: [
      'Live SiteProject JSON inspection & quick copy',
      'Real-time message bus trace (inbound, outbound, rejected origins)',
      'Origin allowlist diagnostics for embedded app developers',
    ],
  },
};

export const APP_LIST: AppDefinition[] = Object.values(APP_REGISTRY);

export const INDUSTRY_APPS: AppDefinition[] = APP_LIST.filter(
  (app) => app.isIndustryApp,
);

export const SYSTEM_APPS: AppDefinition[] = APP_LIST.filter(
  (app) => !app.isIndustryApp,
);

export const DEFAULT_PINNED_APPS: AppId[] = APP_LIST.filter(
  (app) => app.defaultPinned,
).map((app) => app.id);

export function isRegisteredAppId(id: string): id is AppId {
  return Object.prototype.hasOwnProperty.call(APP_REGISTRY, id);
}

/**
 * Extracts explicit external origins registered for live iframe apps
 * (excluding relative same-origin paths like /mock-apps/...).
 */
export function getRegisteredAppOrigins(): string[] {
  const origins = new Set<string>();
  for (const app of APP_LIST) {
    if (!app.url) continue;
    try {
      if (app.url.startsWith('http://') || app.url.startsWith('https://')) {
        origins.add(new URL(app.url).origin);
      }
    } catch {
      // Ignore malformed env URL
    }
  }
  return Array.from(origins);
}
