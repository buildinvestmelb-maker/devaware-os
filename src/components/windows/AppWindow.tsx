import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Minus,
  PanelLeft,
  PanelRight,
  X,
} from 'lucide-react';
import { Rnd } from 'react-rnd';
import { APP_REGISTRY } from '../../registry/apps';
import {
  useWindowStore,
  type WindowInstance,
} from '../../store/useWindowStore';
import { AppIcon } from '../icons/AppIcon';
import { WindowContent } from './WindowContent';

interface AppWindowProps {
  win: WindowInstance;
}

export function AppWindow({ win }: AppWindowProps) {
  const def = APP_REGISTRY[win.appId];
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const viewport = useWindowStore((s) => s.viewport);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximizeWindow = useWindowStore((s) => s.toggleMaximizeWindow);
  const snapWindow = useWindowStore((s) => s.snapWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const updateWindowBounds = useWindowStore((s) => s.updateWindowBounds);
  const setDraggingOrResizing = useWindowStore((s) => s.setDraggingOrResizing);

  const isActive = !win.minimized && activeWindowId === win.windowId;

  const computedPos = win.maximized ? { x: 0, y: 0 } : { x: win.x, y: win.y };
  const computedSize = win.maximized
    ? { width: viewport.width, height: viewport.height }
    : { width: win.width, height: win.height };

  return (
    <Rnd
      size={computedSize}
      position={computedPos}
      minWidth={def.minSize.width}
      minHeight={def.minSize.height}
      bounds="parent"
      dragHandleClassName="window-drag-handle"
      cancel=".window-no-drag"
      disableDragging={win.maximized || win.minimized}
      enableResizing={!win.maximized && !win.minimized}
      style={{
        zIndex: win.minimized ? -1 : win.zIndex,
        visibility: win.minimized ? 'hidden' : 'visible',
        opacity: win.minimized ? 0 : 1,
        pointerEvents: win.minimized ? 'none' : 'auto',
      }}
      onDragStart={() => {
        focusWindow(win.windowId);
        setDraggingOrResizing(true);
      }}
      onDragStop={(_e, data) => {
        setDraggingOrResizing(false);
        updateWindowBounds(win.windowId, { x: data.x, y: data.y });
      }}
      onResizeStart={() => {
        focusWindow(win.windowId);
        setDraggingOrResizing(true);
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        setDraggingOrResizing(false);
        updateWindowBounds(win.windowId, {
          width: parseInt(ref.style.width, 10) || win.width,
          height: parseInt(ref.style.height, 10) || win.height,
          x: position.x,
          y: position.y,
        });
      }}
    >
      <section
        id={`window-${win.windowId}`}
        data-testid={`app-window-${win.appId}`}
        data-window-id={win.windowId}
        data-active={isActive ? 'true' : 'false'}
        data-minimized={win.minimized ? 'true' : 'false'}
        data-z-index={win.zIndex}
        aria-label={win.title}
        aria-hidden={win.minimized}
        onMouseDown={() => {
          if (!isActive) {
            focusWindow(win.windowId);
          }
        }}
        className={`flex h-full w-full flex-col overflow-hidden transition-[border-color,box-shadow] duration-150 ${
          win.maximized ? 'rounded-none' : 'rounded-xl'
        } ${
          isActive
            ? 'plasma-window-shadow border border-[#3daee9]/50 bg-[#151a22]'
            : 'plasma-window-shadow-inactive border border-slate-400/18 bg-[#12161d]'
        }`}
      >
        {/* KDE Plasma Breeze Dark Title Bar */}
        <header
          onDoubleClick={() => toggleMaximizeWindow(win.windowId)}
          className={`window-drag-handle flex h-10 shrink-0 cursor-grab items-center justify-between gap-2 border-b px-3 select-none active:cursor-grabbing ${
            isActive
              ? 'border-slate-400/15 bg-[#1b222d] text-slate-100'
              : 'border-slate-400/10 bg-[#141921] text-slate-400'
          }`}
        >
          {/* Left: Icon + Title + Category */}
          <div className="flex min-w-0 items-center gap-2">
            <AppIcon appId={win.appId} size="xs" />
            <span className="truncate text-xs font-semibold tracking-tight">
              {win.title}
            </span>
            <span className="hidden rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">
              {def.category}
            </span>
          </div>

          {/* Right: Source Repo + Snap Left / Right + Min / Max / Close */}
          <div className="window-no-drag flex shrink-0 items-center gap-1">
            {def.repoUrl && (
              <a
                href={def.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Source Repo (${def.name})`}
                aria-label={`Open ${def.name} Source Repository`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-[#7dd3fc]"
              >
                <ExternalLink size={12} />
              </a>
            )}

            <div className="mx-0.5 h-3.5 w-px bg-slate-500/20" />

            <button
              type="button"
              data-testid={`window-snap-left-${win.appId}`}
              onClick={() => snapWindow(win.windowId, 'left')}
              title="Snap Left"
              aria-label={`Snap ${win.title} Left`}
              className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors ${
                win.snapState === 'left'
                  ? 'bg-[#3daee9]/20 text-[#7dd3fc]'
                  : 'text-slate-400 hover:bg-white/[0.08] hover:text-slate-100'
              }`}
            >
              <PanelLeft size={13} />
            </button>

            <button
              type="button"
              data-testid={`window-snap-right-${win.appId}`}
              onClick={() => snapWindow(win.windowId, 'right')}
              title="Snap Right"
              aria-label={`Snap ${win.title} Right`}
              className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors ${
                win.snapState === 'right'
                  ? 'bg-[#3daee9]/20 text-[#7dd3fc]'
                  : 'text-slate-400 hover:bg-white/[0.08] hover:text-slate-100'
              }`}
            >
              <PanelRight size={13} />
            </button>

            <div className="mx-0.5 h-3.5 w-px bg-slate-500/20" />

            <button
              type="button"
              data-testid={`window-minimize-${win.appId}`}
              onClick={() => minimizeWindow(win.windowId)}
              title="Minimize"
              aria-label={`Minimize ${win.title}`}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <Minus size={13} />
            </button>

            <button
              type="button"
              data-testid={`window-maximize-${win.appId}`}
              onClick={() => toggleMaximizeWindow(win.windowId)}
              title={win.maximized ? 'Restore' : 'Maximize'}
              aria-label={
                win.maximized
                  ? `Restore ${win.title}`
                  : `Maximize ${win.title}`
              }
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              {win.maximized ? (
                <Minimize2 size={12} />
              ) : (
                <Maximize2 size={12} />
              )}
            </button>

            <button
              type="button"
              data-testid={`window-close-${win.appId}`}
              onClick={() => closeWindow(win.windowId)}
              title="Close"
              aria-label={`Close ${win.title}`}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-500/80 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        </header>

        {/* Window Body */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <WindowContent win={win} isActive={isActive} />
        </div>
      </section>
    </Rnd>
  );
}
