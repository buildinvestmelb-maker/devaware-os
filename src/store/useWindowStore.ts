import { create } from 'zustand';
import {
  mergeSiteProject,
  type DeepPartial,
  type SiteProject,
  type ToastLevel,
} from '../bridge/types';
import { DEFAULT_PROJECT, SAMPLE_DEALS } from '../data/sampleDeals';
import {
  APP_REGISTRY,
  DEFAULT_PINNED_APPS,
  isRegisteredAppId,
  type AppId,
} from '../registry/apps';

export type AustralianTimezone =
  | 'auto'
  | 'Australia/Sydney'
  | 'Australia/Adelaide'
  | 'Australia/Perth';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInstance extends WindowBounds {
  windowId: string;
  appId: AppId;
  title: string;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  snapState: 'none' | 'left' | 'right';
  restoreBounds?: WindowBounds;
  payload?: Record<string, unknown>;
  /** Tracks whether this window's render loop should currently be active. */
  renderActive: boolean;
}

export interface ToastNotification {
  id: string;
  level: ToastLevel;
  title: string;
  message?: string;
  createdAt: string;
  read: boolean;
}

export type BusLogDirection = 'inbound' | 'outbound' | 'rejected' | 'system';

export interface BusLogEntry {
  id: string;
  timestamp: string;
  direction: BusLogDirection;
  messageType: string;
  origin: string;
  appId?: string;
  windowId?: string;
  reason?: string;
  summary?: string;
}

export interface OpenAppOptions {
  payload?: Record<string, unknown>;
  bounds?: Partial<WindowBounds>;
  snapState?: 'none' | 'left' | 'right';
  reuseExisting?: boolean;
  focus?: boolean;
}

export const WORKSPACE_STORAGE_KEY = 'devaware-os:workspace:v1';
export const WORKSPACE_SCHEMA_VERSION = 1;
export const PANEL_HEIGHT_PX = 48;
export const CASCADE_OFFSET_PX = 28;

interface PersistedWindowLayout {
  windowId: string;
  appId: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  snapState: 'none' | 'left' | 'right';
}

export interface IconPosition {
  x: number;
  y: number;
}

interface PersistedWorkspaceV1 {
  schemaVersion: 1;
  pinnedApps: AppId[];
  timezone: AustralianTimezone;
  windows: PersistedWindowLayout[];
  activeWindowId: string | null;
  activeProjectId?: string;
  iconPositions?: Partial<Record<AppId, IconPosition>>;
}

const VALID_TIMEZONES: ReadonlySet<AustralianTimezone> = new Set([
  'auto',
  'Australia/Sydney',
  'Australia/Adelaide',
  'Australia/Perth',
]);

function cloneProject(project: SiteProject): SiteProject {
  return JSON.parse(JSON.stringify(project)) as SiteProject;
}

function getInitialViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1440, height: 900 - PANEL_HEIGHT_PX };
  }
  return {
    width: window.innerWidth,
    height: Math.max(360, window.innerHeight - PANEL_HEIGHT_PX),
  };
}

function shouldAutoUnlockFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('unlocked') === '1';
  } catch {
    return false;
  }
}

function loadPersistedWorkspace(): Partial<PersistedWorkspaceV1> | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceV1>;
    if (parsed.schemaVersion !== WORKSPACE_SCHEMA_VERSION) return null;

    const pinnedApps = Array.isArray(parsed.pinnedApps)
      ? parsed.pinnedApps.filter(
          (id): id is AppId => typeof id === 'string' && isRegisteredAppId(id),
        )
      : undefined;

    const timezone =
      typeof parsed.timezone === 'string' &&
      VALID_TIMEZONES.has(parsed.timezone as AustralianTimezone)
        ? (parsed.timezone as AustralianTimezone)
        : undefined;

    const windows = Array.isArray(parsed.windows)
      ? parsed.windows.filter(
          (w): w is PersistedWindowLayout =>
            Boolean(w) &&
            typeof w.windowId === 'string' &&
            typeof w.appId === 'string' &&
            isRegisteredAppId(w.appId) &&
            typeof w.x === 'number' &&
            typeof w.y === 'number' &&
            typeof w.width === 'number' &&
            typeof w.height === 'number',
        )
      : undefined;

    const iconPositions: Partial<Record<AppId, IconPosition>> = {};
    if (parsed.iconPositions && typeof parsed.iconPositions === 'object') {
      for (const [key, val] of Object.entries(parsed.iconPositions)) {
        if (
          isRegisteredAppId(key) &&
          val &&
          typeof val.x === 'number' &&
          typeof val.y === 'number'
        ) {
          iconPositions[key] = { x: val.x, y: val.y };
        }
      }
    }

    return {
      schemaVersion: 1,
      pinnedApps,
      timezone,
      windows,
      activeWindowId:
        typeof parsed.activeWindowId === 'string' ? parsed.activeWindowId : null,
      activeProjectId:
        typeof parsed.activeProjectId === 'string'
          ? parsed.activeProjectId
          : undefined,
      iconPositions,
    };
  } catch {
    return null;
  }
}

function savePersistedWorkspace(state: {
  pinnedApps: AppId[];
  timezone: AustralianTimezone;
  windows: WindowInstance[];
  activeWindowId: string | null;
  activeProject: SiteProject;
  iconPositions?: Partial<Record<AppId, IconPosition>>;
}): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const payload: PersistedWorkspaceV1 = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: state.windows.map((w) => ({
        windowId: w.windowId,
        appId: w.appId,
        x: w.x,
        y: w.y,
        width: w.width,
        height: w.height,
        zIndex: w.zIndex,
        minimized: w.minimized,
        maximized: w.maximized,
        snapState: w.snapState,
      })),
      activeWindowId: state.activeWindowId,
      activeProjectId: state.activeProject.projectId,
      iconPositions: state.iconPositions,
    };
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or storage restriction errors
  }
}

function recomputeRenderStates(
  windows: WindowInstance[],
  activeWindowId: string | null,
  isLocked: boolean,
): WindowInstance[] {
  return windows.map((w) => ({
    ...w,
    renderActive: !isLocked && !w.minimized && w.windowId === activeWindowId,
  }));
}

function findTopVisibleWindowId(
  windows: WindowInstance[],
  excludeWindowId?: string,
): string | null {
  let best: WindowInstance | null = null;
  for (const w of windows) {
    if (w.minimized || w.windowId === excludeWindowId) continue;
    if (!best || w.zIndex > best.zIndex) {
      best = w;
    }
  }
  return best ? best.windowId : null;
}

function computeCascadedBounds(
  appId: AppId,
  existingCount: number,
  viewport: { width: number; height: number },
  override?: Partial<WindowBounds>,
): WindowBounds {
  const def = APP_REGISTRY[appId];
  const width = Math.min(
    override?.width ?? def.defaultSize.width,
    Math.max(def.minSize.width, viewport.width - 24),
  );
  const height = Math.min(
    override?.height ?? def.defaultSize.height,
    Math.max(def.minSize.height, viewport.height - 24),
  );

  const step = existingCount % 7;
  const maxX = Math.max(12, viewport.width - width - 12);
  const maxY = Math.max(12, viewport.height - height - 12);

  const defaultX = Math.min(maxX, 112 + step * CASCADE_OFFSET_PX);
  const defaultY = Math.min(maxY, 28 + step * CASCADE_OFFSET_PX);

  return {
    x: override?.x ?? defaultX,
    y: override?.y ?? defaultY,
    width,
    height,
  };
}

let instanceCounter = 1;
function makeWindowId(appId: AppId): string {
  instanceCounter += 1;
  return `${appId}-${Date.now().toString(36)}-${instanceCounter}`;
}

function makeShortId(prefix: string): string {
  instanceCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${instanceCounter}`;
}

export interface WindowStoreState {
  windows: WindowInstance[];
  nextZIndex: number;
  activeWindowId: string | null;
  isDraggingOrResizing: boolean;
  activeProject: SiteProject;
  hasLoadedDeal: boolean;
  lastProjectSyncSource: string | null;
  pinnedApps: AppId[];
  iconPositions: Partial<Record<AppId, IconPosition>>;
  timezone: AustralianTimezone;
  toasts: ToastNotification[];
  notifications: ToastNotification[];
  busLogs: BusLogEntry[];
  isLocked: boolean;
  isLauncherOpen: boolean;
  isAppLibraryOpen: boolean;
  isNotificationCenterOpen: boolean;
  appLibrarySelectedAppId: AppId | null;
  viewport: { width: number; height: number };

  // Actions
  setViewport: (width: number, height: number) => void;
  unlockWorkspace: () => void;
  lockWorkspace: () => void;
  setLauncherOpen: (open: boolean) => void;
  toggleLauncher: () => void;
  openAppLibrary: (selectedAppId?: AppId | null) => void;
  closeAppLibrary: () => void;
  toggleNotificationCenter: () => void;
  closeTransientMenus: () => void;

  openApp: (appId: AppId, options?: OpenAppOptions) => string;
  focusWindow: (windowId: string) => void;
  blurAllWindows: () => void;
  minimizeWindow: (windowId: string) => void;
  toggleMaximizeWindow: (windowId: string) => void;
  snapWindow: (windowId: string, side: 'left' | 'right') => void;
  closeWindow: (windowId: string) => void;
  updateWindowBounds: (windowId: string, bounds: Partial<WindowBounds>) => void;
  setDraggingOrResizing: (active: boolean) => void;
  setIconPosition: (appId: AppId, pos: IconPosition) => void;

  setActiveProject: (project: SiteProject, sourceAppId?: string) => void;
  patchActiveProject: (
    patch: DeepPartial<SiteProject>,
    sourceAppId?: string,
  ) => SiteProject;
  loadDealAndLaunchSuite: (project: SiteProject) => {
    cutsheetWindowId: string;
    feasoWindowId: string;
  };

  togglePinApp: (appId: AppId) => void;
  setTimezone: (tz: AustralianTimezone) => void;
  pushToast: (input: {
    level?: ToastLevel;
    title: string;
    message?: string;
  }) => string;
  dismissToast: (id: string) => void;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
  addBusLog: (entry: Omit<BusLogEntry, 'id' | 'timestamp'>) => void;
  clearBusLogs: () => void;
  resetWorkspace: () => void;
}

function buildInitialState() {
  const persisted = loadPersistedWorkspace();
  const isLocked = !shouldAutoUnlockFromUrl();
  const viewport = getInitialViewport();

  const initialProject = (() => {
    if (persisted?.activeProjectId) {
      const match = SAMPLE_DEALS.find(
        (d) => d.project.projectId === persisted.activeProjectId,
      );
      if (match) return cloneProject(match.project);
    }
    return cloneProject(DEFAULT_PROJECT);
  })();

  const restoredWindows: WindowInstance[] = (persisted?.windows ?? []).map(
    (w) => {
      const def = APP_REGISTRY[w.appId];
      return {
        ...w,
        title: def.name,
        renderActive: false,
      };
    },
  );

  const highestZ = restoredWindows.reduce(
    (max, w) => Math.max(max, w.zIndex),
    10,
  );
  const activeWindowId =
    persisted?.activeWindowId &&
    restoredWindows.some(
      (w) => w.windowId === persisted.activeWindowId && !w.minimized,
    )
      ? persisted.activeWindowId
      : findTopVisibleWindowId(restoredWindows);

  return {
    windows: recomputeRenderStates(restoredWindows, activeWindowId, isLocked),
    nextZIndex: highestZ + 1,
    activeWindowId,
    isDraggingOrResizing: false,
    activeProject: initialProject,
    hasLoadedDeal: false,
    lastProjectSyncSource: 'init',
    pinnedApps:
      persisted?.pinnedApps && persisted.pinnedApps.length > 0
        ? persisted.pinnedApps
        : [...DEFAULT_PINNED_APPS],
    iconPositions: persisted?.iconPositions ?? {},
    timezone: persisted?.timezone ?? ('auto' as AustralianTimezone),
    toasts: [] as ToastNotification[],
    notifications: [] as ToastNotification[],
    busLogs: [] as BusLogEntry[],
    isLocked,
    isLauncherOpen: false,
    isAppLibraryOpen: false,
    isNotificationCenterOpen: false,
    appLibrarySelectedAppId: null as AppId | null,
    viewport,
  };
}

export const useWindowStore = create<WindowStoreState>((set, get) => ({
  ...buildInitialState(),

  setViewport: (width, height) => {
    set({
      viewport: {
        width: Math.max(320, width),
        height: Math.max(320, height - PANEL_HEIGHT_PX),
      },
    });
  },

  unlockWorkspace: () => {
    set((state) => ({
      isLocked: false,
      windows: recomputeRenderStates(state.windows, state.activeWindowId, false),
    }));
  },

  lockWorkspace: () => {
    set((state) => ({
      isLocked: true,
      isLauncherOpen: false,
      isNotificationCenterOpen: false,
      windows: recomputeRenderStates(state.windows, state.activeWindowId, true),
    }));
  },

  setLauncherOpen: (open) => {
    set({
      isLauncherOpen: open,
      isNotificationCenterOpen: open ? false : get().isNotificationCenterOpen,
    });
  },

  toggleLauncher: () => {
    set((state) => ({
      isLauncherOpen: !state.isLauncherOpen,
      isNotificationCenterOpen: false,
    }));
  },

  openAppLibrary: (selectedAppId = null) => {
    set({
      isAppLibraryOpen: true,
      appLibrarySelectedAppId: selectedAppId,
      isLauncherOpen: false,
      isNotificationCenterOpen: false,
    });
  },

  closeAppLibrary: () => {
    set({
      isAppLibraryOpen: false,
      appLibrarySelectedAppId: null,
    });
  },

  toggleNotificationCenter: () => {
    set((state) => {
      const opening = !state.isNotificationCenterOpen;
      return {
        isNotificationCenterOpen: opening,
        isLauncherOpen: false,
        notifications: opening
          ? state.notifications.map((n) => ({ ...n, read: true }))
          : state.notifications,
      };
    });
  },

  closeTransientMenus: () => {
    set({
      isLauncherOpen: false,
      isNotificationCenterOpen: false,
    });
  },

  openApp: (appId, options = {}) => {
    const def = APP_REGISTRY[appId];
    const state = get();
    const shouldReuse = def.singleInstance || Boolean(options.reuseExisting);
    const shouldFocus = options.focus !== false;

    const existing = shouldReuse
      ? state.windows.find((w) => w.appId === appId)
      : undefined;

    if (existing) {
      const nextZ = shouldFocus ? state.nextZIndex + 1 : existing.zIndex;
      const nextActiveId = shouldFocus
        ? existing.windowId
        : state.activeWindowId;

      const updatedWindows = state.windows.map((w) => {
        if (w.windowId !== existing.windowId) return w;
        return {
          ...w,
          minimized: false,
          zIndex: nextZ,
          x: options.bounds?.x ?? w.x,
          y: options.bounds?.y ?? w.y,
          width: options.bounds?.width ?? w.width,
          height: options.bounds?.height ?? w.height,
          snapState: options.snapState ?? w.snapState,
          maximized: options.bounds ? false : w.maximized,
          payload: options.payload ?? w.payload,
        };
      });

      const finalWindows = recomputeRenderStates(
        updatedWindows,
        nextActiveId,
        state.isLocked,
      );

      set({
        windows: finalWindows,
        nextZIndex: shouldFocus ? nextZ : state.nextZIndex,
        activeWindowId: nextActiveId,
        isLauncherOpen: false,
        isNotificationCenterOpen: false,
      });

      savePersistedWorkspace({
        pinnedApps: state.pinnedApps,
        timezone: state.timezone,
        windows: finalWindows,
        activeWindowId: nextActiveId,
        activeProject: state.activeProject,
      });

      return existing.windowId;
    }

    const windowId = makeWindowId(appId);
    const bounds = computeCascadedBounds(
      appId,
      state.windows.length,
      state.viewport,
      options.bounds,
    );
    const nextZ = state.nextZIndex + 1;
    const nextActiveId = shouldFocus ? windowId : state.activeWindowId;

    const newWin: WindowInstance = {
      windowId,
      appId,
      title: def.name,
      ...bounds,
      zIndex: nextZ,
      minimized: false,
      maximized: false,
      snapState: options.snapState ?? 'none',
      payload: options.payload,
      renderActive: false,
    };

    const finalWindows = recomputeRenderStates(
      [...state.windows, newWin],
      nextActiveId,
      state.isLocked,
    );

    set({
      windows: finalWindows,
      nextZIndex: nextZ,
      activeWindowId: nextActiveId,
      isLauncherOpen: false,
      isNotificationCenterOpen: false,
    });

    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: finalWindows,
      activeWindowId: nextActiveId,
      activeProject: state.activeProject,
      iconPositions: state.iconPositions,
    });

    return windowId;
  },

  focusWindow: (windowId) => {
    const state = get();
    const target = state.windows.find((w) => w.windowId === windowId);
    if (!target) return;

    const nextZ = state.nextZIndex + 1;
    const updated = state.windows.map((w) =>
      w.windowId === windowId
        ? { ...w, minimized: false, zIndex: nextZ }
        : w,
    );
    const finalWindows = recomputeRenderStates(
      updated,
      windowId,
      state.isLocked,
    );

    set({
      windows: finalWindows,
      nextZIndex: nextZ,
      activeWindowId: windowId,
      isLauncherOpen: false,
      isNotificationCenterOpen: false,
    });

    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: finalWindows,
      activeWindowId: windowId,
      activeProject: state.activeProject,
      iconPositions: state.iconPositions,
    });
  },

  blurAllWindows: () => {
    const state = get();
    if (
      state.activeWindowId === null &&
      !state.isLauncherOpen &&
      !state.isNotificationCenterOpen
    ) {
      return;
    }
    const finalWindows = recomputeRenderStates(
      state.windows,
      null,
      state.isLocked,
    );
    set({
      windows: finalWindows,
      activeWindowId: null,
      isLauncherOpen: false,
      isNotificationCenterOpen: false,
    });
  },

  minimizeWindow: (windowId) => {
    const state = get();
    const updated = state.windows.map((w) =>
      w.windowId === windowId ? { ...w, minimized: true } : w,
    );
    const nextActiveId =
      state.activeWindowId === windowId
        ? findTopVisibleWindowId(updated, windowId)
        : state.activeWindowId;

    const finalWindows = recomputeRenderStates(
      updated,
      nextActiveId,
      state.isLocked,
    );

    set({
      windows: finalWindows,
      activeWindowId: nextActiveId,
    });

    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: finalWindows,
      activeWindowId: nextActiveId,
      activeProject: state.activeProject,
      iconPositions: state.iconPositions,
    });
  },

  toggleMaximizeWindow: (windowId) => {
    const state = get();
    const target = state.windows.find((w) => w.windowId === windowId);
    if (!target) return;

    const nextZ = state.nextZIndex + 1;
    const updated = state.windows.map((w) => {
      if (w.windowId !== windowId) return w;
      if (w.maximized) {
        const restored = w.restoreBounds ?? computeCascadedBounds(w.appId, 0, state.viewport);
        return {
          ...w,
          ...restored,
          maximized: false,
          snapState: 'none' as const,
          restoreBounds: undefined,
          zIndex: nextZ,
        };
      }
      return {
        ...w,
        restoreBounds:
          w.restoreBounds ?? {
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height,
          },
        x: 0,
        y: 0,
        width: state.viewport.width,
        height: state.viewport.height,
        maximized: true,
        snapState: 'none' as const,
        minimized: false,
        zIndex: nextZ,
      };
    });

    const finalWindows = recomputeRenderStates(
      updated,
      windowId,
      state.isLocked,
    );

    set({
      windows: finalWindows,
      nextZIndex: nextZ,
      activeWindowId: windowId,
    });

    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: finalWindows,
      activeWindowId: windowId,
      activeProject: state.activeProject,
      iconPositions: state.iconPositions,
    });
  },

  snapWindow: (windowId, side) => {
    const state = get();
    const target = state.windows.find((w) => w.windowId === windowId);
    if (!target) return;

    const gap = 8;
    const halfWidth = Math.max(
      340,
      Math.floor((state.viewport.width - gap * 3) / 2),
    );
    const snapHeight = Math.max(320, state.viewport.height - gap * 2);
    const snapX = side === 'left' ? gap : halfWidth + gap * 2;
    const nextZ = state.nextZIndex + 1;

    const updated = state.windows.map((w) => {
      if (w.windowId !== windowId) return w;
      return {
        ...w,
        restoreBounds:
          w.snapState === 'none' && !w.maximized
            ? { x: w.x, y: w.y, width: w.width, height: w.height }
            : w.restoreBounds,
        x: snapX,
        y: gap,
        width: halfWidth,
        height: snapHeight,
        snapState: side,
        maximized: false,
        minimized: false,
        zIndex: nextZ,
      };
    });

    const finalWindows = recomputeRenderStates(
      updated,
      windowId,
      state.isLocked,
    );

    set({
      windows: finalWindows,
      nextZIndex: nextZ,
      activeWindowId: windowId,
    });

    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: finalWindows,
      activeWindowId: windowId,
      activeProject: state.activeProject,
      iconPositions: state.iconPositions,
    });
  },

  closeWindow: (windowId) => {
    const state = get();
    const remaining = state.windows.filter((w) => w.windowId !== windowId);
    const nextActiveId =
      state.activeWindowId === windowId
        ? findTopVisibleWindowId(remaining)
        : state.activeWindowId;

    const finalWindows = recomputeRenderStates(
      remaining,
      nextActiveId,
      state.isLocked,
    );

    set({
      windows: finalWindows,
      activeWindowId: nextActiveId,
    });

    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: finalWindows,
      activeWindowId: nextActiveId,
      activeProject: state.activeProject,
      iconPositions: state.iconPositions,
    });
  },

  updateWindowBounds: (windowId, bounds) => {
    const state = get();
    const updated = state.windows.map((w) => {
      if (w.windowId !== windowId) return w;
      return {
        ...w,
        x: bounds.x ?? w.x,
        y: Math.max(0, bounds.y ?? w.y),
        width: bounds.width ?? w.width,
        height: bounds.height ?? w.height,
        maximized: false,
        snapState: 'none' as const,
      };
    });

    set({ windows: updated });
    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: updated,
      activeWindowId: state.activeWindowId,
      activeProject: state.activeProject,
      iconPositions: state.iconPositions,
    });
  },

  setDraggingOrResizing: (active) => {
    if (get().isDraggingOrResizing === active) return;
    set({ isDraggingOrResizing: active });
  },

  setIconPosition: (appId, pos) => {
    const state = get();
    const iconPositions = {
      ...state.iconPositions,
      [appId]: {
        x: Math.max(8, Math.round(pos.x)),
        y: Math.max(8, Math.round(pos.y)),
      },
    };
    set({ iconPositions });
    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      activeProject: state.activeProject,
      iconPositions,
    });
  },

  setActiveProject: (project, sourceAppId = 'devaware-os') => {
    const cloned = cloneProject({
      ...project,
      updatedAt: new Date().toISOString(),
    });
    const state = get();
    set({
      activeProject: cloned,
      hasLoadedDeal: true,
      lastProjectSyncSource: sourceAppId,
    });
    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      activeProject: cloned,
      iconPositions: state.iconPositions,
    });
  },

  patchActiveProject: (patch, sourceAppId = 'devaware-os') => {
    const state = get();
    const merged = mergeSiteProject(state.activeProject, patch);
    set({
      activeProject: merged,
      hasLoadedDeal: true,
      lastProjectSyncSource: sourceAppId,
    });
    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone: state.timezone,
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      activeProject: merged,
      iconPositions: state.iconPositions,
    });
    return merged;
  },

  loadDealAndLaunchSuite: (project) => {
    get().setActiveProject(project, 'file-explorer');
    const { viewport } = get();
    const gap = 8;
    const halfWidth = Math.max(360, Math.floor((viewport.width - gap * 3) / 2));
    const height = Math.max(380, viewport.height - gap * 2);

    const feasoWindowId = get().openApp('feaso-os', {
      reuseExisting: true,
      snapState: 'right',
      focus: false,
      bounds: {
        x: halfWidth + gap * 2,
        y: gap,
        width: halfWidth,
        height,
      },
      payload: { dealId: project.projectId, explicitDealLoad: true },
    });

    const cutsheetWindowId = get().openApp('cutsheet-au', {
      reuseExisting: true,
      snapState: 'left',
      focus: true,
      bounds: {
        x: gap,
        y: gap,
        width: halfWidth,
        height,
      },
      payload: { dealId: project.projectId, explicitDealLoad: true },
    });

    get().pushToast({
      level: 'info',
      title: `Loaded ${project.name}`,
      message: `${project.location.state} • MGA2020 Zone ${project.location.mgaZone} (${project.location.mgaEpsg})`,
    });

    return { cutsheetWindowId, feasoWindowId };
  },

  togglePinApp: (appId) => {
    const state = get();
    const exists = state.pinnedApps.includes(appId);
    const pinnedApps = exists
      ? state.pinnedApps.filter((id) => id !== appId)
      : [...state.pinnedApps, appId];

    set({ pinnedApps });
    savePersistedWorkspace({
      pinnedApps,
      timezone: state.timezone,
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      activeProject: state.activeProject,
      iconPositions: state.iconPositions,
    });
  },

  setTimezone: (timezone) => {
    const state = get();
    set({ timezone });
    savePersistedWorkspace({
      pinnedApps: state.pinnedApps,
      timezone,
      windows: state.windows,
      activeWindowId: state.activeWindowId,
      activeProject: state.activeProject,
      iconPositions: state.iconPositions,
    });
  },

  pushToast: ({ level = 'info', title, message }) => {
    const id = makeShortId('toast');
    const toast: ToastNotification = {
      id,
      level,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };

    set((state) => ({
      toasts: [...state.toasts.slice(-3), toast],
      notifications: [toast, ...state.notifications].slice(0, 40),
    }));

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  markNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [], toasts: [] });
  },

  addBusLog: (entry) => {
    const log: BusLogEntry = {
      ...entry,
      id: makeShortId('bus'),
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      busLogs: [log, ...state.busLogs].slice(0, 120),
    }));
  },

  clearBusLogs: () => {
    set({ busLogs: [] });
  },

  resetWorkspace: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      } catch {
        // Ignore storage removal errors
      }
    }
    const freshProject = cloneProject(DEFAULT_PROJECT);
    set({
      windows: [],
      nextZIndex: 11,
      activeWindowId: null,
      isDraggingOrResizing: false,
      activeProject: freshProject,
      hasLoadedDeal: false,
      lastProjectSyncSource: 'reset',
      pinnedApps: [...DEFAULT_PINNED_APPS],
      iconPositions: {},
      timezone: 'auto',
      toasts: [],
      isLauncherOpen: false,
      isAppLibraryOpen: false,
      isNotificationCenterOpen: false,
      appLibrarySelectedAppId: null,
    });
    get().pushToast({
      level: 'success',
      title: 'Workspace Reset',
      message: 'Restored default icons, timezone, and window layout.',
    });
  },
}));
