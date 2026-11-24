import { useRef, useState } from 'react';
import { APP_REGISTRY, type AppId } from '../../registry/apps';
import { useWindowStore } from '../../store/useWindowStore';
import { AppIcon } from '../icons/AppIcon';

const ICON_WIDTH = 92;
const ICON_HEIGHT = 86;
const GRID_GAP_Y = 96;
const GRID_GAP_X = 104;
const DRAG_THRESHOLD_PX = 5;

function getDefaultIconPosition(
  index: number,
  viewportHeight: number,
): { x: number; y: number } {
  const usableHeight = Math.max(240, viewportHeight - 32);
  const rowsPerCol = Math.max(1, Math.floor(usableHeight / GRID_GAP_Y));
  const col = Math.floor(index / rowsPerCol);
  const row = index % rowsPerCol;
  return {
    x: 16 + col * GRID_GAP_X,
    y: 16 + row * GRID_GAP_Y,
  };
}

export function DesktopIcons() {
  const pinnedApps = useWindowStore((s) => s.pinnedApps);
  const iconPositions = useWindowStore((s) => s.iconPositions);
  const viewport = useWindowStore((s) => s.viewport);
  const openApp = useWindowStore((s) => s.openApp);
  const openAppLibrary = useWindowStore((s) => s.openAppLibrary);
  const setIconPosition = useWindowStore((s) => s.setIconPosition);

  const [selectedId, setSelectedId] = useState<AppId | null>(null);
  const [dragState, setDragState] = useState<{
    appId: AppId;
    x: number;
    y: number;
  } | null>(null);

  const suppressClickRef = useRef<AppId | null>(null);

  // Ensure the national Projects (AU) folder shortcut is always first on the desktop
  const desktopItems: AppId[] = [
    'file-explorer',
    ...pinnedApps.filter((id) => id !== 'file-explorer'),
  ];

  const handleLaunch = (appId: AppId) => {
    const def = APP_REGISTRY[appId];
    if (def.status === 'coming-soon') {
      openAppLibrary(appId);
      return;
    }
    openApp(appId);
  };

  const getPosition = (appId: AppId, index: number) => {
    if (dragState && dragState.appId === appId) {
      return { x: dragState.x, y: dragState.y };
    }
    const saved = iconPositions[appId];
    if (saved) {
      return {
        x: Math.min(Math.max(8, saved.x), Math.max(8, viewport.width - ICON_WIDTH - 8)),
        y: Math.min(Math.max(8, saved.y), Math.max(8, viewport.height - ICON_HEIGHT - 8)),
      };
    }
    return getDefaultIconPosition(index, viewport.height);
  };

  const handlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    appId: AppId,
    index: number,
  ) => {
    if (e.button !== 0) return;
    setSelectedId(appId);

    const startX = e.clientX;
    const startY = e.clientY;
    const orig = getPosition(appId, index);
    let moved = false;

    const maxX = Math.max(8, viewport.width - ICON_WIDTH - 8);
    const maxY = Math.max(8, viewport.height - ICON_HEIGHT - 8);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
        return;
      }
      moved = true;
      const nextX = Math.min(maxX, Math.max(8, orig.x + dx));
      const nextY = Math.min(maxY, Math.max(8, orig.y + dy));
      setDragState({ appId, x: nextX, y: nextY });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (moved) {
        const dx = upEvent.clientX - startX;
        const dy = upEvent.clientY - startY;
        const finalX = Math.min(maxX, Math.max(8, orig.x + dx));
        const finalY = Math.min(maxY, Math.max(8, orig.y + dy));
        setIconPosition(appId, { x: finalX, y: finalY });
        setDragState(null);
        suppressClickRef.current = appId;
        setTimeout(() => {
          if (suppressClickRef.current === appId) {
            suppressClickRef.current = null;
          }
        }, 250);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <nav
      aria-label="Desktop Shortcuts"
      className="pointer-events-none absolute inset-0 z-[2]"
    >
      {desktopItems.map((appId, index) => {
        const app = APP_REGISTRY[appId];
        const isSelected = selectedId === appId;
        const isDragging = dragState?.appId === appId;
        const pos = getPosition(appId, index);

        return (
          <button
            key={appId}
            id={`desktop-icon-${appId}`}
            data-testid={`desktop-icon-${appId}`}
            type="button"
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${ICON_WIDTH}px`,
            }}
            onPointerDown={(e) => handlePointerDown(e, appId, index)}
            onClick={() => {
              if (suppressClickRef.current === appId) return;
              setSelectedId(appId);
            }}
            onDoubleClick={() => {
              if (suppressClickRef.current === appId) return;
              setSelectedId(appId);
              handleLaunch(appId);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleLaunch(appId);
              }
            }}
            title={`${app.name} — Drag to move, double-click to open`}
            className={`pointer-events-auto group flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3daee9] ${
              isDragging
                ? 'z-20 cursor-grabbing border-[#3daee9]/70 bg-[#1a2c3d]/85 shadow-xl backdrop-blur-md'
                : isSelected
                  ? 'cursor-grab border-[#3daee9]/55 bg-[#3daee9]/18 backdrop-blur-md'
                  : 'cursor-grab border-transparent bg-transparent transition-colors duration-120 hover:border-slate-300/15 hover:bg-slate-900/45 hover:backdrop-blur-sm'
            }`}
          >
            <div className="transition-transform duration-120 group-hover:scale-[1.04]">
              <AppIcon appId={appId} size="lg" />
            </div>
            <span className="line-clamp-2 text-[11px] leading-tight font-medium text-slate-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {app.id === 'file-explorer' ? 'Projects (AU)' : app.shortName}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
