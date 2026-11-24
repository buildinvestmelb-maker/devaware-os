import {
  getRegisteredAppOrigins,
  isRegisteredAppId,
  type AppId,
} from '../registry/apps';
import {
  useWindowStore,
  type BusLogEntry,
  type WindowStoreState,
} from '../store/useWindowStore';
import {
  isChildToHostMessage,
  type DeepPartial,
  type HostToChildMessage,
  type SiteProject,
} from './types';

export interface OriginAllowlistConfig {
  hostOrigin: string;
  registeredOrigins?: string[];
  isDev?: boolean;
  allowedOriginRegex?: string;
}

const LOCALHOST_DEV_REGEX = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

/**
 * Evaluates whether a postMessage event origin is permitted by the strict
 * @devaware/os-bridge security allowlist.
 */
export function isAllowedBridgeOrigin(
  origin: string,
  config: OriginAllowlistConfig,
): { allowed: boolean; reason: string } {
  if (!origin || origin === 'null') {
    return { allowed: false, reason: 'Empty or opaque (null) origin rejected' };
  }

  if (origin === config.hostOrigin) {
    return { allowed: true, reason: 'Matched host origin' };
  }

  const registered = config.registeredOrigins ?? [];
  if (registered.includes(origin)) {
    return { allowed: true, reason: 'Matched registered app origin' };
  }

  if (config.isDev && LOCALHOST_DEV_REGEX.test(origin)) {
    return { allowed: true, reason: 'Matched localhost dev origin' };
  }

  if (config.allowedOriginRegex && config.allowedOriginRegex.trim().length > 0) {
    try {
      const pattern = new RegExp(config.allowedOriginRegex.trim());
      if (pattern.test(origin)) {
        return {
          allowed: true,
          reason: 'Matched VITE_ALLOWED_ORIGIN_REGEX preview pattern',
        };
      }
    } catch {
      return {
        allowed: false,
        reason: 'Configured VITE_ALLOWED_ORIGIN_REGEX is invalid',
      };
    }
  }

  return {
    allowed: false,
    reason: `Origin "${origin}" is not in the devaware-os allowlist`,
  };
}

interface RegisteredIframeEntry {
  windowId: string;
  appId: AppId;
  iframe: HTMLIFrameElement;
  targetOrigin: string;
  ready: boolean;
  lastRenderActive: boolean | null;
}

export interface OsMessageRouter {
  start: () => () => void;
  registerIframe: (
    windowId: string,
    appId: AppId,
    iframe: HTMLIFrameElement,
    srcUrl: string,
  ) => void;
  unregisterIframe: (windowId: string) => void;
  handleMessageEvent: (event: MessageEvent) => void;
  syncRenderStates: (reason?: 'focus' | 'blur' | 'minimize' | 'restore') => void;
  broadcastProjectSync: (
    project: SiteProject,
    options?: { excludeWindowId?: string; sourceAppId?: string },
  ) => void;
  flushPendingPatches: () => void;
  dispose: () => void;
}

function resolveTargetOrigin(srcUrl: string, hostOrigin: string): string {
  try {
    return new URL(srcUrl, hostOrigin).origin;
  } catch {
    return hostOrigin;
  }
}

export interface CreateRouterOptions {
  debounceMs?: number;
  getStore?: () => WindowStoreState;
  subscribeStore?: (
    listener: (state: WindowStoreState, prevState: WindowStoreState) => void,
  ) => () => void;
  originConfig?: Partial<OriginAllowlistConfig>;
}

function getDefaultOriginConfig(): OriginAllowlistConfig {
  const hostOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const isDev = Boolean(
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV,
  );
  const allowedOriginRegex =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_ALLOWED_ORIGIN_REGEX === 'string'
      ? import.meta.env.VITE_ALLOWED_ORIGIN_REGEX
      : undefined;

  return {
    hostOrigin,
    registeredOrigins: getRegisteredAppOrigins(),
    isDev,
    allowedOriginRegex,
  };
}

const EXTERNAL_APP_ID_ALIASES: Record<string, AppId> = {
  'feasibility-calc': 'feaso-os',
  'feaso-calc': 'feaso-os',
  cutsheet: 'cutsheet-au',
};

function resolveBridgeAppId(rawId: string | undefined): AppId | null {
  if (!rawId) return null;
  if (isRegisteredAppId(rawId)) return rawId;
  return EXTERNAL_APP_ID_ALIASES[rawId] ?? null;
}

function buildCutSheetSitePayload(
  project: SiteProject,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...extra,
    address: project.location.address,
    lga: project.location.lga,
    state: project.location.state,
    lat: project.location.lat,
    lng: project.location.lng,
    mgaZone: project.location.mgaZone,
    mgaEpsg: project.location.mgaEpsg,
    polygonGeoJson: project.geometry.boundaryGeoJson,
    theme: 'dark',
  };
}

function extractEarthworksPatchFromExternalPayload(
  payload: Record<string, unknown> | undefined,
): DeepPartial<SiteProject> | null {
  if (!payload) return null;
  const hasCutSheetMetrics =
    typeof payload.cutM3 === 'number' ||
    typeof payload.fillM3 === 'number' ||
    typeof payload.estimatedEarthworksAud === 'number' ||
    typeof payload.retainingWallCostAud === 'number';

  if (!hasCutSheetMetrics) return null;

  const cutVolumeM3 =
    typeof payload.cutM3 === 'number' ? payload.cutM3 : undefined;
  const fillVolumeM3 =
    typeof payload.fillM3 === 'number' ? payload.fillM3 : undefined;
  const netBalanceM3 =
    typeof payload.netSpoilM3 === 'number'
      ? payload.netSpoilM3
      : cutVolumeM3 !== undefined && fillVolumeM3 !== undefined
        ? cutVolumeM3 - fillVolumeM3
        : undefined;
  const retainingWallCostAud =
    typeof payload.retainingWallCostAud === 'number'
      ? payload.retainingWallCostAud
      : undefined;
  const totalSiteworksAud =
    typeof payload.estimatedEarthworksAud === 'number'
      ? payload.estimatedEarthworksAud
      : undefined;
  // CutSheet's estimatedEarthworksAud includes retaining walls; separate bulk earthworks cleanly
  const bulkEarthworksCostAud =
    totalSiteworksAud !== undefined
      ? Math.max(0, totalSiteworksAud - (retainingWallCostAud ?? 0))
      : undefined;

  const patch: DeepPartial<SiteProject> = {
    earthworks: {
      cutVolumeM3,
      fillVolumeM3,
      netBalanceM3,
      importExportVolumeM3:
        netBalanceM3 !== undefined ? Math.abs(netBalanceM3) : undefined,
      bulkEarthworksCostAud,
      retainingWallCostAud,
      updatedByApp: 'cutsheet-au',
    },
  };

  if (typeof payload.siteName === 'string' && payload.siteName.trim()) {
    patch.name = payload.siteName.trim();
  }
  if (typeof payload.lga === 'string' && payload.lga.trim()) {
    patch.location = { lga: payload.lga.trim() };
  }
  if (
    typeof payload.siteAreaHa === 'number' ||
    typeof payload.ndaHa === 'number' ||
    typeof payload.parcelSpi === 'string'
  ) {
    patch.geometry = {
      grossAreaSqm:
        typeof payload.siteAreaHa === 'number'
          ? Math.round(payload.siteAreaHa * 10000)
          : undefined,
      netDevelopableAreaSqm:
        typeof payload.ndaHa === 'number'
          ? Math.round(payload.ndaHa * 10000)
          : undefined,
      parcelId:
        typeof payload.parcelSpi === 'string' ? payload.parcelSpi : undefined,
    };
  }

  return patch;
}

export function createOsMessageRouter(
  options: CreateRouterOptions = {},
): OsMessageRouter {
  const debounceMs = options.debounceMs ?? 200;
  const getStore = options.getStore ?? (() => useWindowStore.getState());
  const subscribeStore =
    options.subscribeStore ??
    ((listener) => useWindowStore.subscribe(listener));

  const iframes = new Map<string, RegisteredIframeEntry>();
  let patchTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingPatch: DeepPartial<SiteProject> | null = null;
  let pendingPatchSenderWindowId: string | undefined;
  let pendingPatchSourceAppId: string | undefined;
  let unsubscribeStore: (() => void) | null = null;
  let started = false;

  const getOriginConfig = (): OriginAllowlistConfig => ({
    ...getDefaultOriginConfig(),
    ...options.originConfig,
  });

  const logBus = (entry: Omit<BusLogEntry, 'id' | 'timestamp'>) => {
    getStore().addBusLog(entry);
  };

  const postToEntry = (
    entry: RegisteredIframeEntry,
    message: HostToChildMessage,
    summary?: string,
  ) => {
    const targetWindow = entry.iframe.contentWindow;
    if (!targetWindow) return;
    try {
      targetWindow.postMessage(message, entry.targetOrigin);
      logBus({
        direction: 'outbound',
        messageType: message.type,
        origin: entry.targetOrigin,
        appId: entry.appId,
        windowId: entry.windowId,
        summary,
      });
    } catch (err) {
      logBus({
        direction: 'system',
        messageType: message.type,
        origin: entry.targetOrigin,
        appId: entry.appId,
        windowId: entry.windowId,
        reason: err instanceof Error ? err.message : 'postMessage failed',
      });
    }
  };

  const findEntryBySource = (
    source: MessageEventSource | null,
  ): RegisteredIframeEntry | undefined => {
    if (!source) return undefined;
    for (const entry of iframes.values()) {
      if (entry.iframe.contentWindow === source) {
        return entry;
      }
    }
    return undefined;
  };

  const broadcastProjectSync = (
    project: SiteProject,
    broadcastOptions: { excludeWindowId?: string; sourceAppId?: string } = {},
  ) => {
    const message: HostToChildMessage = {
      type: 'OS_PROJECT_SYNC',
      project,
      sourceAppId: broadcastOptions.sourceAppId,
      updatedAt: project.updatedAt,
    };

    for (const entry of iframes.values()) {
      if (
        broadcastOptions.excludeWindowId &&
        entry.windowId === broadcastOptions.excludeWindowId
      ) {
        continue;
      }
      postToEntry(
        entry,
        message,
        `${project.name} (${project.location.state} / ${project.location.mgaEpsg})`,
      );
      // Also push OS_PAYLOAD to external CutSheet AU instances when host switches sites
      if (
        entry.appId === 'cutsheet-au' &&
        broadcastOptions.sourceAppId === 'file-explorer'
      ) {
        postToEntry(
          entry,
          {
            type: 'OS_PAYLOAD',
            payload: buildCutSheetSitePayload(project),
          },
          `Fly-to ${project.name} (${project.location.state})`,
        );
      }
    }
  };

  const syncRenderStates = (
    reason: 'focus' | 'blur' | 'minimize' | 'restore' = 'focus',
  ) => {
    const state = getStore();
    for (const entry of iframes.values()) {
      const win = state.windows.find((w) => w.windowId === entry.windowId);
      if (!win) continue;
      const shouldBeActive =
        !state.isLocked &&
        !win.minimized &&
        state.activeWindowId === entry.windowId;

      if (entry.lastRenderActive === shouldBeActive) continue;
      entry.lastRenderActive = shouldBeActive;

      const resolvedReason = win.minimized
        ? 'minimize'
        : shouldBeActive
          ? reason === 'minimize'
            ? 'restore'
            : reason
          : 'blur';

      postToEntry(
        entry,
        {
          type: 'OS_RENDER_STATE',
          active: shouldBeActive,
          reason: resolvedReason,
        },
        `active=${String(shouldBeActive)} (${resolvedReason})`,
      );
    }
  };

  const flushPendingPatches = () => {
    if (patchTimer) {
      clearTimeout(patchTimer);
      patchTimer = null;
    }
    if (!pendingPatch) return;

    const patchToApply = pendingPatch;
    const senderWindowId = pendingPatchSenderWindowId;
    const sourceAppId = pendingPatchSourceAppId ?? 'embedded-app';

    pendingPatch = null;
    pendingPatchSenderWindowId = undefined;
    pendingPatchSourceAppId = undefined;

    const updatedProject = getStore().patchActiveProject(
      patchToApply,
      sourceAppId,
    );

    broadcastProjectSync(updatedProject, {
      excludeWindowId: senderWindowId,
      sourceAppId,
    });
  };

  const mergePendingPatch = (
    existing: DeepPartial<SiteProject> | null,
    incoming: DeepPartial<SiteProject>,
  ): DeepPartial<SiteProject> => {
    if (!existing) return incoming;
    return {
      ...existing,
      ...incoming,
      location:
        existing.location || incoming.location
          ? { ...existing.location, ...incoming.location }
          : undefined,
      geometry:
        existing.geometry || incoming.geometry
          ? { ...existing.geometry, ...incoming.geometry }
          : undefined,
      earthworks:
        existing.earthworks || incoming.earthworks
          ? { ...existing.earthworks, ...incoming.earthworks }
          : undefined,
      massing:
        existing.massing || incoming.massing
          ? { ...existing.massing, ...incoming.massing }
          : undefined,
      environment:
        existing.environment || incoming.environment
          ? { ...existing.environment, ...incoming.environment }
          : undefined,
      feasibility:
        existing.feasibility || incoming.feasibility
          ? { ...existing.feasibility, ...incoming.feasibility }
          : undefined,
    };
  };

  const handleMessageEvent = (event: MessageEvent) => {
    // Ignore unrelated browser/extension messages that aren't @devaware/os-bridge packets
    if (!isChildToHostMessage(event.data)) {
      return;
    }

    const message = event.data;
    const originCheck = isAllowedBridgeOrigin(event.origin, getOriginConfig());

    if (!originCheck.allowed) {
      logBus({
        direction: 'rejected',
        messageType: message.type,
        origin: event.origin || '(empty)',
        reason: originCheck.reason,
        summary: `Blocked ${message.type} from untrusted origin`,
      });
      return;
    }

    const senderEntry = findEntryBySource(event.source);
    const state = getStore();

    logBus({
      direction: 'inbound',
      messageType: message.type,
      origin: event.origin,
      appId:
        senderEntry?.appId ??
        ('sourceAppId' in message ? message.sourceAppId : undefined) ??
        ('appId' in message ? message.appId : undefined),
      windowId: senderEntry?.windowId,
      summary:
        message.type === 'NOTIFY'
          ? message.title
          : message.type === 'OPEN_APP'
            ? `Target: ${message.appId ?? message.targetAppId ?? 'unknown'}`
            : message.type === 'PROJECT_PATCH'
              ? `Keys: ${Object.keys(message.patch).join(', ')}`
              : undefined,
    });

    switch (message.type) {
      case 'APP_READY': {
        if (!senderEntry) return;
        senderEntry.ready = true;
        const win = state.windows.find(
          (w) => w.windowId === senderEntry.windowId,
        );
        const active =
          !state.isLocked &&
          Boolean(win) &&
          !win!.minimized &&
          state.activeWindowId === senderEntry.windowId;

        senderEntry.lastRenderActive = active;
        const initPayload =
          senderEntry.appId === 'cutsheet-au'
            ? buildCutSheetSitePayload(state.activeProject, win?.payload)
            : win?.payload;

        postToEntry(
          senderEntry,
          {
            type: 'OS_INIT',
            theme: 'dark',
            project: state.activeProject,
            active,
            appId: senderEntry.appId,
            windowId: senderEntry.windowId,
            payload: initPayload,
          },
          `active=${String(active)} • ${state.activeProject.name}`,
        );
        break;
      }

      case 'APP_FOCUS': {
        if (!senderEntry) return;
        state.focusWindow(senderEntry.windowId);
        syncRenderStates('focus');
        break;
      }

      case 'OPEN_APP': {
        const rawTarget = message.appId ?? message.targetAppId;
        const resolvedTargetId = resolveBridgeAppId(rawTarget);
        if (!resolvedTargetId) {
          logBus({
            direction: 'rejected',
            messageType: 'OPEN_APP',
            origin: event.origin,
            reason: `Unregistered appId "${rawTarget ?? ''}"`,
          });
          return;
        }

        // If CutSheet AU dispatched live earthworks metrics via OPEN_APP -> feasibility-calc,
        // apply them directly into activeProject so Feaso OS & Inspector update immediately.
        const externalPatch = extractEarthworksPatchFromExternalPayload(
          message.payload,
        );
        if (externalPatch) {
          const updated = state.patchActiveProject(
            externalPatch,
            senderEntry?.appId ?? message.sourceAppId ?? 'cutsheet-au',
          );
          broadcastProjectSync(updated, {
            excludeWindowId: senderEntry?.windowId,
            sourceAppId: senderEntry?.appId ?? 'cutsheet-au',
          });
          state.pushToast({
            level: 'success',
            title: 'Earthworks synced from CutSheet AU',
            message: `${updated.name} updated in Feaso OS`,
          });
        }

        const targetWindowId = state.openApp(resolvedTargetId, {
          reuseExisting: resolvedTargetId === 'feaso-os' && Boolean(externalPatch),
          payload: message.payload,
        });
        const targetEntry = iframes.get(targetWindowId);
        if (targetEntry && targetEntry.ready && message.payload) {
          const updatedState = getStore();
          postToEntry(
            targetEntry,
            {
              type: 'OS_PROJECT_SYNC',
              project: updatedState.activeProject,
              sourceAppId: senderEntry?.appId ?? 'devaware-os',
              updatedAt: updatedState.activeProject.updatedAt,
            },
            'Synced OPEN_APP earthworks payload to existing instance',
          );
        }
        syncRenderStates('focus');
        break;
      }

      case 'PROJECT_PATCH': {
        pendingPatch = mergePendingPatch(pendingPatch, message.patch);
        pendingPatchSenderWindowId = senderEntry?.windowId;
        pendingPatchSourceAppId =
          message.sourceAppId ?? senderEntry?.appId ?? 'embedded-app';

        if (patchTimer) {
          clearTimeout(patchTimer);
        }
        patchTimer = setTimeout(() => {
          flushPendingPatches();
        }, debounceMs);
        break;
      }

      case 'NOTIFY': {
        state.pushToast({
          level: message.level ?? 'info',
          title: message.title,
          message: message.message,
        });
        break;
      }
    }
  };

  const registerIframe = (
    windowId: string,
    appId: AppId,
    iframe: HTMLIFrameElement,
    srcUrl: string,
  ) => {
    const targetOrigin = resolveTargetOrigin(
      srcUrl,
      getOriginConfig().hostOrigin,
    );
    iframes.set(windowId, {
      windowId,
      appId,
      iframe,
      targetOrigin,
      ready: false,
      lastRenderActive: null,
    });
  };

  const unregisterIframe = (windowId: string) => {
    iframes.delete(windowId);
  };

  const start = () => {
    if (started) return () => dispose();
    started = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessageEvent);
    }

    unsubscribeStore = subscribeStore((state, prevState) => {
      const renderRelevantChanged =
        state.activeWindowId !== prevState.activeWindowId ||
        state.isLocked !== prevState.isLocked ||
        state.windows !== prevState.windows;

      if (renderRelevantChanged) {
        syncRenderStates();
      }

      // Broadcast host-initiated project changes (e.g., loading a .deal file in File Explorer)
      const projectChanged =
        state.activeProject !== prevState.activeProject &&
        (state.lastProjectSyncSource === 'file-explorer' ||
          state.lastProjectSyncSource === 'devaware-os' ||
          state.lastProjectSyncSource === 'reset');

      if (projectChanged) {
        broadcastProjectSync(state.activeProject, {
          sourceAppId: state.lastProjectSyncSource ?? 'devaware-os',
        });
      }
    });

    return () => dispose();
  };

  const dispose = () => {
    if (!started) return;
    started = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessageEvent);
    }
    if (unsubscribeStore) {
      unsubscribeStore();
      unsubscribeStore = null;
    }
    if (patchTimer) {
      clearTimeout(patchTimer);
      patchTimer = null;
    }
    iframes.clear();
  };

  return {
    start,
    registerIframe,
    unregisterIframe,
    handleMessageEvent,
    syncRenderStates,
    broadcastProjectSync,
    flushPendingPatches,
    dispose,
  };
}

export const osMessageRouter = createOsMessageRouter();
