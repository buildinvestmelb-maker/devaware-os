import { beforeEach, describe, expect, it } from 'vitest';
import {
  CASCADE_OFFSET_PX,
  WORKSPACE_SCHEMA_VERSION,
  WORKSPACE_STORAGE_KEY,
  useWindowStore,
} from './useWindowStore';

describe('useWindowStore singleInstance, cascading, persistence & renderActive', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWindowStore.getState().resetWorkspace();
    useWindowStore.getState().unlockWorkspace();
  });

  it('enforces singleInstance for heavy 3D apps (cutsheet-au, formgen-au, enviro-sim-au) and forwards new payload', () => {
    const store = useWindowStore.getState();

    for (const appId of [
      'cutsheet-au',
      'formgen-au',
      'enviro-sim-au',
    ] as const) {
      const firstId = store.openApp(appId, { payload: { run: 1 } });
      const firstZ = useWindowStore
        .getState()
        .windows.find((w) => w.windowId === firstId)!.zIndex;

      // Minimize first to also verify re-opening restores it
      useWindowStore.getState().minimizeWindow(firstId);
      const secondId = useWindowStore
        .getState()
        .openApp(appId, { payload: { run: 2 } });

      expect(secondId).toBe(firstId);
      const matching = useWindowStore
        .getState()
        .windows.filter((w) => w.appId === appId);
      expect(matching).toHaveLength(1);
      expect(matching[0].minimized).toBe(false);
      expect(matching[0].zIndex).toBeGreaterThan(firstZ);
      expect(matching[0].payload).toEqual({ run: 2 });
    }
  });

  it('cascades multi-instance windows by +28px when launching additional instances', () => {
    const firstId = useWindowStore.getState().openApp('feaso-os');
    const secondId = useWindowStore.getState().openApp('feaso-os');

    expect(secondId).not.toBe(firstId);
    const [w1, w2] = useWindowStore.getState().windows;
    expect(w2.x - w1.x).toBe(CASCADE_OFFSET_PX);
    expect(w2.y - w1.y).toBe(CASCADE_OFFSET_PX);
  });

  it('persists pinned icons, timezone, and layout under schemaVersion: 1 and resets cleanly', () => {
    useWindowStore.getState().setTimezone('Australia/Perth');
    useWindowStore.getState().togglePinApp('formgen-au');
    useWindowStore.getState().openApp('cutsheet-au');

    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw!);
    expect(persisted.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION);
    expect(persisted.timezone).toBe('Australia/Perth');
    expect(persisted.pinnedApps).toContain('formgen-au');
    expect(persisted.windows).toHaveLength(1);

    useWindowStore.getState().resetWorkspace();
    expect(useWindowStore.getState().timezone).toBe('auto');
    expect(useWindowStore.getState().windows).toHaveLength(0);
    expect(window.localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
  });

  it('tracks renderActive state transitions across focus, blur, and minimize', () => {
    const cutId = useWindowStore.getState().openApp('cutsheet-au');
    expect(
      useWindowStore.getState().windows.find((w) => w.windowId === cutId)
        ?.renderActive,
    ).toBe(true);

    // Blurring all windows pauses render loop
    useWindowStore.getState().blurAllWindows();
    expect(
      useWindowStore.getState().windows.find((w) => w.windowId === cutId)
        ?.renderActive,
    ).toBe(false);

    // Focusing restores render loop
    useWindowStore.getState().focusWindow(cutId);
    expect(
      useWindowStore.getState().windows.find((w) => w.windowId === cutId)
        ?.renderActive,
    ).toBe(true);

    // Minimizing pauses render loop
    useWindowStore.getState().minimizeWindow(cutId);
    expect(
      useWindowStore.getState().windows.find((w) => w.windowId === cutId)
        ?.renderActive,
    ).toBe(false);
  });
});
