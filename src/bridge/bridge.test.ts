import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROJECT } from '../data/sampleDeals';
import { useWindowStore } from '../store/useWindowStore';
import {
  createOsMessageRouter,
  isAllowedBridgeOrigin,
} from './osMessageRouter';
import { getMga2020FromLng, mergeSiteProject } from './types';

function createMockIframe() {
  const posted: Array<{ message: unknown; targetOrigin: string }> = [];
  const contentWindow = {
    postMessage: vi.fn((message: unknown, targetOrigin: string) => {
      posted.push({ message, targetOrigin });
    }),
  } as unknown as Window;

  const iframe = {
    contentWindow,
  } as unknown as HTMLIFrameElement;

  return { iframe, contentWindow, posted };
}

describe('getMga2020FromLng (Australian GDA2020 / MGA2020 Zones)', () => {
  it('computes Perth (WA) as Zone 50 / EPSG:7850', () => {
    expect(getMga2020FromLng(115.8605)).toEqual({
      mgaZone: 50,
      mgaEpsg: 'EPSG:7850',
    });
  });

  it('computes Adelaide (SA) as Zone 54 / EPSG:7854', () => {
    expect(getMga2020FromLng(138.6007)).toEqual({
      mgaZone: 54,
      mgaEpsg: 'EPSG:7854',
    });
  });

  it('computes Melbourne (VIC) as Zone 55 / EPSG:7855', () => {
    expect(getMga2020FromLng(144.9631)).toEqual({
      mgaZone: 55,
      mgaEpsg: 'EPSG:7855',
    });
  });

  it('computes Sydney (NSW) and Brisbane (QLD) as Zone 56 / EPSG:7856', () => {
    expect(getMga2020FromLng(151.2093)).toEqual({
      mgaZone: 56,
      mgaEpsg: 'EPSG:7856',
    });
    expect(getMga2020FromLng(153.0251)).toEqual({
      mgaZone: 56,
      mgaEpsg: 'EPSG:7856',
    });
  });

  it('computes Darwin (NT) as Zone 52 and clamps Western/Eastern extremes to Zones 49–56', () => {
    expect(getMga2020FromLng(130.8456)).toEqual({
      mgaZone: 52,
      mgaEpsg: 'EPSG:7852',
    });
    expect(getMga2020FromLng(112.0)).toEqual({
      mgaZone: 49,
      mgaEpsg: 'EPSG:7849',
    });
    expect(getMga2020FromLng(160.0)).toEqual({
      mgaZone: 56,
      mgaEpsg: 'EPSG:7856',
    });
  });
});

describe('mergeSiteProject deep-merge', () => {
  it('deep-merges nested earthworks without clobbering sibling fields', () => {
    const merged = mergeSiteProject(
      DEFAULT_PROJECT,
      {
        earthworks: {
          cutVolumeM3: 32000,
          bulkEarthworksCostAud: 2150000,
        },
      },
      '2026-11-24T00:00:00.000Z',
    );

    expect(merged.earthworks?.cutVolumeM3).toBe(32000);
    expect(merged.earthworks?.bulkEarthworksCostAud).toBe(2150000);
    expect(merged.earthworks?.fillVolumeM3).toBe(
      DEFAULT_PROJECT.earthworks?.fillVolumeM3,
    );
    expect(merged.location).toEqual(DEFAULT_PROJECT.location);
    expect(merged.updatedAt).toBe('2026-11-24T00:00:00.000Z');
  });

  it('recomputes MGA2020 zone automatically when location.lng is patched', () => {
    const merged = mergeSiteProject(DEFAULT_PROJECT, {
      location: {
        state: 'WA',
        lat: -31.9505,
        lng: 115.8605,
      },
    });

    expect(merged.location.state).toBe('WA');
    expect(merged.location.mgaZone).toBe(50);
    expect(merged.location.mgaEpsg).toBe('EPSG:7850');
  });
});

describe('isAllowedBridgeOrigin strict allowlist', () => {
  const baseConfig = {
    hostOrigin: 'https://devaware-os.vercel.app',
    registeredOrigins: ['https://cutsheet.devaware.com.au'],
    isDev: false,
    allowedOriginRegex: '^https://devaware-[a-z0-9-]+\\.vercel\\.app$',
  };

  it('permits host origin, registered production origins, and configured preview regex', () => {
    expect(
      isAllowedBridgeOrigin('https://devaware-os.vercel.app', baseConfig)
        .allowed,
    ).toBe(true);
    expect(
      isAllowedBridgeOrigin('https://cutsheet.devaware.com.au', baseConfig)
        .allowed,
    ).toBe(true);
    expect(
      isAllowedBridgeOrigin(
        'https://devaware-pr-42.vercel.app',
        baseConfig,
      ).allowed,
    ).toBe(true);
  });

  it('permits http://localhost:* only when isDev is true', () => {
    expect(
      isAllowedBridgeOrigin('http://localhost:5173', baseConfig).allowed,
    ).toBe(false);
    expect(
      isAllowedBridgeOrigin('http://localhost:5173', {
        ...baseConfig,
        isDev: true,
      }).allowed,
    ).toBe(true);
  });

  it('rejects untrusted, empty, and null origins', () => {
    expect(
      isAllowedBridgeOrigin('https://evil.example.com', baseConfig).allowed,
    ).toBe(false);
    expect(isAllowedBridgeOrigin('null', baseConfig).allowed).toBe(false);
    expect(isAllowedBridgeOrigin('', baseConfig).allowed).toBe(false);
  });
});

describe('createOsMessageRouter handshake, origin rejection, debounce & OS_RENDER_STATE', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useWindowStore.getState().resetWorkspace();
    useWindowStore.getState().unlockWorkspace();
    useWindowStore.getState().clearBusLogs();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('logs rejected postMessage origins into busLogs and ignores the message', () => {
    const router = createOsMessageRouter({
      originConfig: {
        hostOrigin: 'https://devaware-os.vercel.app',
        isDev: false,
      },
    });
    const stop = router.start();

    router.handleMessageEvent(
      new MessageEvent('message', {
        origin: 'https://untrusted.attacker.test',
        data: {
          type: 'NOTIFY',
          title: 'Spoofed alert',
        },
      }),
    );

    const logs = useWindowStore.getState().busLogs;
    expect(logs.some((l) => l.direction === 'rejected')).toBe(true);
    expect(logs[0].origin).toBe('https://untrusted.attacker.test');
    expect(
      useWindowStore
        .getState()
        .toasts.some((t) => t.title === 'Spoofed alert'),
    ).toBe(false);

    stop();
  });

  it('handles APP_READY -> OS_INIT, debounced PROJECT_PATCH -> OS_PROJECT_SYNC, and OS_RENDER_STATE transitions', () => {
    const hostOrigin = 'https://devaware-os.vercel.app';
    const router = createOsMessageRouter({
      debounceMs: 200,
      originConfig: { hostOrigin, isDev: false },
    });
    const stop = router.start();

    const feasoWinId = useWindowStore
      .getState()
      .openApp('feaso-os', { focus: false });
    const cutsheetWinId = useWindowStore
      .getState()
      .openApp('cutsheet-au', { focus: true });

    const cutMock = createMockIframe();
    const feasoMock = createMockIframe();

    router.registerIframe(
      cutsheetWinId,
      'cutsheet-au',
      cutMock.iframe,
      '/mock-apps/cutsheet.html',
    );
    router.registerIframe(
      feasoWinId,
      'feaso-os',
      feasoMock.iframe,
      '/mock-apps/feaso.html',
    );

    // APP_READY -> OS_INIT
    router.handleMessageEvent(
      new MessageEvent('message', {
        origin: hostOrigin,
        source: cutMock.contentWindow,
        data: { type: 'APP_READY', appId: 'cutsheet-au' },
      }),
    );

    expect(cutMock.posted).toHaveLength(1);
    expect(cutMock.posted[0].message).toMatchObject({
      type: 'OS_INIT',
      theme: 'dark',
      active: true,
      appId: 'cutsheet-au',
    });

    // PROJECT_PATCH debounced by 200ms and broadcast to OTHER open iframes
    router.handleMessageEvent(
      new MessageEvent('message', {
        origin: hostOrigin,
        source: cutMock.contentWindow,
        data: {
          type: 'PROJECT_PATCH',
          sourceAppId: 'cutsheet-au',
          patch: {
            earthworks: {
              cutVolumeM3: 41000,
              bulkEarthworksCostAud: 2490000,
            },
          },
        },
      }),
    );

    // Not flushed before 200ms
    vi.advanceTimersByTime(150);
    expect(feasoMock.posted).toHaveLength(0);

    // Flushed at 200ms -> Feaso receives OS_PROJECT_SYNC, sender does not echo
    vi.advanceTimersByTime(60);
    expect(feasoMock.posted).toHaveLength(1);
    expect(feasoMock.posted[0].message).toMatchObject({
      type: 'OS_PROJECT_SYNC',
      sourceAppId: 'cutsheet-au',
    });
    expect(
      useWindowStore.getState().activeProject.earthworks?.bulkEarthworksCostAud,
    ).toBe(2490000);

    // Focusing Feaso transitions CutSheet to OS_RENDER_STATE active=false and Feaso to active=true
    useWindowStore.getState().focusWindow(feasoWinId);

    const cutRenderMessages = cutMock.posted
      .map((p) => p.message as { type: string; active?: boolean })
      .filter((m) => m.type === 'OS_RENDER_STATE');
    expect(cutRenderMessages.at(-1)?.active).toBe(false);

    const feasoRenderMessages = feasoMock.posted
      .map((p) => p.message as { type: string; active?: boolean })
      .filter((m) => m.type === 'OS_RENDER_STATE');
    expect(feasoRenderMessages.at(-1)?.active).toBe(true);

    // Minimizing Feaso transitions Feaso to OS_RENDER_STATE active=false and restores CutSheet to active=true
    useWindowStore.getState().minimizeWindow(feasoWinId);

    const feasoAfterMin = feasoMock.posted
      .map((p) => p.message as { type: string; active?: boolean })
      .filter((m) => m.type === 'OS_RENDER_STATE');
    expect(feasoAfterMin.at(-1)?.active).toBe(false);

    const cutAfterMin = cutMock.posted
      .map((p) => p.message as { type: string; active?: boolean })
      .filter((m) => m.type === 'OS_RENDER_STATE');
    expect(cutAfterMin.at(-1)?.active).toBe(true);

    stop();
  });

  it('bridges live CutSheet AU OS_INIT polygonGeoJson payload and OPEN_APP targetAppId=feasibility-calc earthworks sync', () => {
    const cutOrigin = 'https://sifibettingv1.vercel.app';
    const router = createOsMessageRouter({
      originConfig: {
        hostOrigin: 'https://devaware-os.vercel.app',
        registeredOrigins: [cutOrigin],
        isDev: false,
      },
    });
    const stop = router.start();

    const cutWinId = useWindowStore.getState().openApp('cutsheet-au');
    const feasoWinId = useWindowStore
      .getState()
      .openApp('feaso-os', { focus: false });

    const cutMock = createMockIframe();
    const feasoMock = createMockIframe();

    router.registerIframe(cutWinId, 'cutsheet-au', cutMock.iframe, cutOrigin);
    router.registerIframe(
      feasoWinId,
      'feaso-os',
      feasoMock.iframe,
      '/mock-apps/feaso.html',
    );

    // 1. Live CutSheet AU sends APP_READY -> receives OS_INIT with polygonGeoJson + lat/lng
    router.handleMessageEvent(
      new MessageEvent('message', {
        origin: cutOrigin,
        source: cutMock.contentWindow,
        data: { type: 'APP_READY', appId: 'cutsheet-au' },
      }),
    );

    const initMsg = cutMock.posted[0].message as {
      type: string;
      payload?: Record<string, unknown>;
    };
    expect(initMsg.type).toBe('OS_INIT');
    expect(initMsg.payload?.polygonGeoJson).toBeDefined();
    expect(typeof initMsg.payload?.lat).toBe('number');
    expect(typeof initMsg.payload?.lng).toBe('number');

    // 2. Live CutSheet AU dispatches OPEN_APP targetAppId='feasibility-calc'
    router.handleMessageEvent(
      new MessageEvent('message', {
        origin: cutOrigin,
        source: cutMock.contentWindow,
        data: {
          type: 'OPEN_APP',
          targetAppId: 'feasibility-calc',
          payload: {
            siteAreaHa: 5.2,
            ndaHa: 3.9,
            cutM3: 29500,
            fillM3: 18200,
            netSpoilM3: 11300,
            estimatedEarthworksAud: 2180000,
            retainingWallCostAud: 420000,
            siteName: 'Austral Live Parcel',
            lga: 'Liverpool City Council',
          },
        },
      }),
    );

    const updated = useWindowStore.getState().activeProject;
    expect(updated.name).toBe('Austral Live Parcel');
    expect(updated.earthworks?.cutVolumeM3).toBe(29500);
    expect(updated.earthworks?.retainingWallCostAud).toBe(420000);
    expect(updated.earthworks?.bulkEarthworksCostAud).toBe(1760000);
    expect(updated.geometry.grossAreaSqm).toBe(52000);
    expect(
      feasoMock.posted.some(
        (p) => (p.message as { type: string }).type === 'OS_PROJECT_SYNC',
      ),
    ).toBe(true);

    stop();
  });
});
