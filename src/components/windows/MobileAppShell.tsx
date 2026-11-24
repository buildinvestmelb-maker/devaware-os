import {
  Compass,
  FolderKanban,
  LayoutGrid,
  Lock,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { APP_REGISTRY, type AppId } from '../../registry/apps';
import { useWindowStore } from '../../store/useWindowStore';
import { AppIcon } from '../icons/AppIcon';
import { WindowContent } from './WindowContent';

const MOBILE_QUICK_APPS: AppId[] = [
  'file-explorer',
  'cutsheet-au',
  'feaso-os',
  'project-inspector',
];

export function MobileAppShell() {
  const windows = useWindowStore((s) => s.windows);
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const activeProject = useWindowStore((s) => s.activeProject);
  const openApp = useWindowStore((s) => s.openApp);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const openAppLibrary = useWindowStore((s) => s.openAppLibrary);
  const lockWorkspace = useWindowStore((s) => s.lockWorkspace);
  const resetWorkspace = useWindowStore((s) => s.resetWorkspace);

  const activeWindow =
    windows.find((w) => w.windowId === activeWindowId) ?? windows[0] ?? null;

  return (
    <div
      id="mobile-tabbed-shell"
      data-testid="mobile-tabbed-shell"
      className="au-topo-wallpaper flex h-full w-full flex-col overflow-hidden"
    >
      {/* Mobile Top Header */}
      <header className="plasma-panel flex h-12 shrink-0 items-center justify-between gap-2 border-t-0 border-b border-slate-400/15 px-3">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-[#3daee9]" />
          <span className="text-xs font-semibold text-white">devaware-os</span>
          <span className="font-mono-tech rounded border border-slate-400/20 bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-[#7dd3fc]">
            {activeProject.location.state} • {activeProject.location.mgaEpsg}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="mobile-open-projects"
            onClick={() => openApp('file-explorer')}
            aria-label="Open Projects (AU)"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <FolderKanban size={15} className="text-[#3daee9]" />
          </button>
          <button
            type="button"
            data-testid="mobile-open-library"
            onClick={() => openAppLibrary()}
            aria-label="Open App Library"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => lockWorkspace()}
            aria-label="Lock Workspace"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <Lock size={15} />
          </button>
        </div>
      </header>

      {/* Mobile Full-Screen Tabbed Switcher Bar */}
      <nav
        aria-label="Mobile App Tabs"
        data-testid="mobile-tab-bar"
        className="flex h-11 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-slate-400/15 bg-[#12161e]/92 px-2.5 backdrop-blur-md"
      >
        {windows.map((win) => {
          const isCurrent = activeWindow?.windowId === win.windowId;
          return (
            <div
              key={win.windowId}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border pl-2 pr-1 text-xs transition-colors ${
                isCurrent
                  ? 'border-[#3daee9]/55 bg-[#3daee9]/18 font-semibold text-white'
                  : 'border-slate-400/15 bg-white/[0.04] text-slate-300'
              }`}
            >
              <button
                type="button"
                data-testid={`mobile-tab-${win.appId}`}
                onClick={() => focusWindow(win.windowId)}
                className="flex cursor-pointer items-center gap-1.5"
              >
                <AppIcon appId={win.appId} size="xs" />
                <span className="max-w-[78px] truncate">
                  {APP_REGISTRY[win.appId].shortName}
                </span>
              </button>
              <button
                type="button"
                onClick={() => closeWindow(win.windowId)}
                aria-label={`Close ${win.title}`}
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          data-testid="mobile-add-app-btn"
          onClick={() => openAppLibrary()}
          className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-dashed border-slate-400/25 px-2.5 text-xs text-slate-300 hover:border-[#3daee9]/50 hover:text-white"
        >
          <Plus size={12} />
          Apps
        </button>
      </nav>

      {/* Main Content Area: Full-Screen Active App OR Mobile Home Launcher */}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        {windows.length === 0 ? (
          <div className="flex h-full flex-col justify-between overflow-y-auto p-4">
            <div>
              <div className="plasma-glass rounded-xl p-4">
                <div className="text-[11px] font-medium tracking-wider text-[#7dd3fc] uppercase">
                  Active Site Context
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {activeProject.name}
                </div>
                <div className="font-mono-tech mt-0.5 text-xs text-slate-400">
                  {activeProject.location.state} • MGA2020 Zone{' '}
                  {activeProject.location.mgaZone} (
                  {activeProject.location.mgaEpsg})
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {MOBILE_QUICK_APPS.map((appId) => {
                  const def = APP_REGISTRY[appId];
                  return (
                    <button
                      key={appId}
                      type="button"
                      data-testid={`mobile-launch-${appId}`}
                      onClick={() => openApp(appId)}
                      className="plasma-glass flex cursor-pointer flex-col items-start gap-2 rounded-xl p-3.5 text-left transition-colors active:bg-[#3daee9]/15"
                    >
                      <AppIcon appId={appId} size="md" />
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {def.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {def.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-400/15 pt-3 text-xs text-slate-400">
              <span>Mobile Tabbed Mode (&lt;768px)</span>
              <button
                type="button"
                onClick={() => resetWorkspace()}
                className="inline-flex cursor-pointer items-center gap-1 text-slate-300 hover:text-white"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            </div>
          </div>
        ) : (
          windows.map((win) => {
            const isCurrent = activeWindow?.windowId === win.windowId;
            return (
              <div
                key={win.windowId}
                data-testid={`mobile-panel-${win.appId}`}
                className={`absolute inset-0 ${
                  isCurrent ? 'z-10 block' : 'z-0 hidden'
                }`}
              >
                <WindowContent win={win} isActive={isCurrent} />
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
