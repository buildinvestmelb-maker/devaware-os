import { describe, expect, it } from 'vitest';
import {
  extractLiveAppOrigins,
  isAllowedBridgeOrigin,
} from '../bridge/osMessageRouter';
import { createAppRegistry, getRegisteredAppOrigins } from './apps';

describe('createAppRegistry flagship environment variable wiring', () => {
  it('falls back cleanly when Vercel env vars are unset', () => {
    const registry = createAppRegistry({});

    expect(registry['cutsheet-au'].status).toBe('live');
    expect(registry['cutsheet-au'].runtime).toBe('iframe');
    expect(registry['cutsheet-au'].entryUrl).toBe('/mock-apps/cutsheet.html');

    expect(registry['feaso-os'].status).toBe('live');
    expect(registry['feaso-os'].runtime).toBe('iframe');
    expect(registry['feaso-os'].entryUrl).toBe('/mock-apps/feaso.html');

    expect(registry['formgen-au'].status).toBe('coming-soon');
    expect(registry['formgen-au'].runtime).toBe('spec');
    expect(registry['formgen-au'].entryUrl).toBeUndefined();

    expect(registry['enviro-sim-au'].status).toBe('coming-soon');
    expect(registry['enviro-sim-au'].runtime).toBe('spec');
    expect(registry['enviro-sim-au'].entryUrl).toBeUndefined();
  });

  it('activates all 4 flagship apps as live iframes when VITE_*_URL env vars are configured', () => {
    const registry = createAppRegistry({
      VITE_CUTSHEET_URL: 'https://cutsheet-au-pro.vercel.app/app?mode=os',
      VITE_FEASO_URL: 'https://feaso-os.vercel.app/workbench',
      VITE_FORMGEN_URL: 'https://formgen-au.vercel.app/studio',
      VITE_ENVIRO_URL: 'https://enviro-sim-au.vercel.app/sim',
    });

    for (const id of [
      'cutsheet-au',
      'feaso-os',
      'formgen-au',
      'enviro-sim-au',
    ] as const) {
      expect(registry[id].status).toBe('live');
      expect(registry[id].runtime).toBe('iframe');
      expect(registry[id].entryUrl).toBeTruthy();
      expect(registry[id].url).toBe(registry[id].entryUrl);
    }

    expect(registry['formgen-au'].roadmapNote).toBeUndefined();
    expect(registry['enviro-sim-au'].roadmapNote).toBeUndefined();
  });

  it('extracts and allowlists exact new URL(entryUrl).origin for every live registered app', () => {
    const registry = createAppRegistry({
      VITE_CUTSHEET_URL: 'https://cutsheet-au-pro.vercel.app/terrain?embed=1',
      VITE_FEASO_URL: 'https://feaso-os.vercel.app/deal/nsw',
      VITE_FORMGEN_URL: 'https://formgen-au.vercel.app:8443/massing',
      VITE_ENVIRO_URL: 'https://enviro-sim-au.vercel.app/bal',
    });
    const apps = Object.values(registry);

    const routerOrigins = extractLiveAppOrigins(
      apps,
      'https://devaware-os.vercel.app',
    );
    const registryOrigins = getRegisteredAppOrigins(
      apps,
      'https://devaware-os.vercel.app',
    );

    const expected = [
      'https://cutsheet-au-pro.vercel.app',
      'https://feaso-os.vercel.app',
      'https://formgen-au.vercel.app:8443',
      'https://enviro-sim-au.vercel.app',
    ];

    expect(routerOrigins).toEqual(expected);
    expect(registryOrigins).toEqual(expected);

    for (const origin of expected) {
      expect(
        isAllowedBridgeOrigin(origin, {
          hostOrigin: 'https://devaware-os.vercel.app',
          registeredOrigins: routerOrigins,
          isDev: false,
        }).allowed,
      ).toBe(true);
    }

    expect(
      isAllowedBridgeOrigin('https://unregistered-app.vercel.app', {
        hostOrigin: 'https://devaware-os.vercel.app',
        registeredOrigins: routerOrigins,
        isDev: false,
      }).allowed,
    ).toBe(false);
  });

  it('excludes coming-soon apps and malformed URLs from the origin allowlist', () => {
    const registry = createAppRegistry({
      VITE_CUTSHEET_URL: 'https://sifibettingv1.vercel.app',
      VITE_FEASO_URL: '',
      VITE_FORMGEN_URL: '   ',
      VITE_ENVIRO_URL: 'javascript:alert(1)',
    });

    const origins = extractLiveAppOrigins(
      Object.values(registry),
      'https://devaware-os.vercel.app',
    );

    expect(origins).toContain('https://sifibettingv1.vercel.app');
    expect(origins).toContain('https://devaware-os.vercel.app');
    expect(origins).toHaveLength(2);
  });
});
