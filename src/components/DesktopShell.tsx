import { useEffect, useState } from 'react';
import { osMessageRouter } from '../bridge/osMessageRouter';
import {
  PANEL_HEIGHT_PX,
  useWindowStore,
} from '../store/useWindowStore';
import { AppLauncher } from './chrome/AppLauncher';
import { AppLibraryModal } from './chrome/AppLibraryModal';
import { BottomPanel } from './chrome/BottomPanel';
import { DesktopIcons } from './chrome/DesktopIcons';
import { LockScreen } from './chrome/LockScreen';
import { ToastStack } from './chrome/ToastStack';
import { AppWindow } from './windows/AppWindow';
import { MobileAppShell } from './windows/MobileAppShell';

const MOBILE_BREAKPOINT_PX = 768;

export function DesktopShell() {
  const isLocked = useWindowStore((s) => s.isLocked);
  const windows = useWindowStore((s) => s.windows);
  const setViewport = useWindowStore((s) => s.setViewport);
  const blurAllWindows = useWindowStore((s) => s.blurAllWindows);
  const setDraggingOrResizing = useWindowStore((s) => s.setDraggingOrResizing);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < MOBILE_BREAKPOINT_PX
      : false,
  );

  // Boot the hardened @devaware/os-bridge router once for the desktop lifecycle
  useEffect(() => {
    const stopRouter = osMessageRouter.start();
    return () => stopRouter();
  }, []);

  // Track viewport size for snapping, maximize, and <768px mobile fallback
  useEffect(() => {
    const syncViewport = () => {
      setViewport(window.innerWidth, window.innerHeight);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, [setViewport]);

  // Defensive release of drag shield if pointer leaves window during drag/resize
  useEffect(() => {
    const clearDrag = () => setDraggingOrResizing(false);
    window.addEventListener('pointerup', clearDrag);
    window.addEventListener('blur', clearDrag);
    return () => {
      window.removeEventListener('pointerup', clearDrag);
      window.removeEventListener('blur', clearDrag);
    };
  }, [setDraggingOrResizing]);

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <div
      id="devaware-desktop"
      data-testid="desktop-workspace"
      className="relative h-full w-full overflow-hidden"
    >
      {isMobile ? (
        <MobileAppShell />
      ) : (
        <div
          id="desktop-stage"
          data-testid="desktop-stage"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              blurAllWindows();
            }
          }}
          style={{ height: `calc(100vh - ${PANEL_HEIGHT_PX}px)` }}
          className="au-topo-wallpaper relative w-full overflow-hidden"
        >
          {/* Subtle top-right architectural datum watermark */}
          <div className="pointer-events-none absolute top-4 right-5 z-[1] hidden text-right select-none sm:block">
            <div className="text-[11px] font-semibold tracking-wider text-slate-300/65 uppercase">
              devaware-os
            </div>
            <div className="font-mono-tech text-[10px] text-slate-400/55">
              GDA2020 • MGA Zones 49–56 • Metric AUD
            </div>
          </div>

          <DesktopIcons />

          {/* Floating Windows Canvas */}
          {windows.map((win) => (
            <AppWindow key={win.windowId} win={win} />
          ))}
        </div>
      )}

      {!isMobile && <AppLauncher />}
      {!isMobile && <BottomPanel />}
      <AppLibraryModal />
      <ToastStack />
    </div>
  );
}
