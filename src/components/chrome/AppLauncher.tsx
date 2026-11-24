import {
  LayoutGrid,
  Lock,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { APP_LIST, type AppId } from '../../registry/apps';
import { useWindowStore } from '../../store/useWindowStore';
import { AppIcon } from '../icons/AppIcon';

export function AppLauncher() {
  const isLauncherOpen = useWindowStore((s) => s.isLauncherOpen);
  const activeProject = useWindowStore((s) => s.activeProject);
  const openApp = useWindowStore((s) => s.openApp);
  const openAppLibrary = useWindowStore((s) => s.openAppLibrary);
  const resetWorkspace = useWindowStore((s) => s.resetWorkspace);
  const lockWorkspace = useWindowStore((s) => s.lockWorkspace);
  const setLauncherOpen = useWindowStore((s) => s.setLauncherOpen);

  const [query, setQuery] = useState('');

  if (!isLauncherOpen) return null;

  const trimmed = query.trim().toLowerCase();
  const filteredApps = APP_LIST.filter((app) => {
    if (!trimmed) return true;
    return (
      app.name.toLowerCase().includes(trimmed) ||
      app.category.toLowerCase().includes(trimmed) ||
      app.description.toLowerCase().includes(trimmed)
    );
  });

  const handleOpen = (appId: AppId, comingSoon: boolean) => {
    setQuery('');
    if (comingSoon) {
      openAppLibrary(appId);
      return;
    }
    openApp(appId);
  };

  return (
    <div
      id="app-launcher-menu"
      data-testid="app-launcher-menu"
      onClick={(e) => e.stopPropagation()}
      className="plasma-glass animate-plasma-in fixed bottom-14 left-2.5 z-50 flex w-[360px] max-w-[calc(100vw-20px)] flex-col overflow-hidden rounded-xl shadow-2xl"
    >
      {/* Header & Search */}
      <div className="border-b border-slate-400/15 p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-100">
              devaware-os
            </div>
            <div className="text-[11px] text-slate-400">
              Australia-Wide Property Dev Suite
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setLauncherOpen(false);
              openAppLibrary();
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-400/20 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-200 transition-colors hover:border-[#3daee9]/40 hover:bg-[#3daee9]/15"
          >
            <LayoutGrid size={12} className="text-[#3daee9]" />
            App Library
          </button>
        </div>

        <label className="relative block">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter apps, civil tools, system..."
            className="w-full rounded-lg border border-slate-400/20 bg-slate-950/65 py-1.5 pr-3 pl-8 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#3daee9] focus:outline-none"
          />
        </label>
      </div>

      {/* App List */}
      <div className="max-h-72 space-y-1 overflow-y-auto p-2">
        {filteredApps.map((app) => {
          const isSoon = app.status === 'coming-soon';
          return (
            <button
              key={app.id}
              data-testid={`launcher-app-${app.id}`}
              type="button"
              onClick={() => handleOpen(app.id, isSoon)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.07]"
            >
              <AppIcon appId={app.id} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium text-slate-100">
                    {app.name}
                  </span>
                  {isSoon && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                      Soon
                    </span>
                  )}
                </div>
                <div className="truncate text-[11px] text-slate-400">
                  {app.category}
                </div>
              </div>
              {app.singleInstance && app.isIndustryApp && (
                <span className="font-mono-tech text-[10px] text-slate-500">
                  1× 3D
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Site Context Strip */}
      <div className="border-t border-slate-400/12 bg-slate-950/45 px-3 py-2">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 truncate text-slate-300">
            <Sparkles size={12} className="shrink-0 text-[#3daee9]" />
            <span className="truncate">{activeProject.name}</span>
          </span>
          <span className="font-mono-tech shrink-0 text-[10px] text-[#7dd3fc]">
            {activeProject.location.state} • {activeProject.location.mgaEpsg}
          </span>
        </div>
      </div>

      {/* Footer Actions: Reset Workspace & Lock */}
      <div className="flex items-center justify-between border-t border-slate-400/15 bg-slate-950/65 px-3 py-2">
        <button
          id="reset-workspace-btn"
          data-testid="reset-workspace-btn"
          type="button"
          onClick={() => resetWorkspace()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-400/20 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-amber-400/40 hover:bg-amber-500/12 hover:text-amber-200"
        >
          <RotateCcw size={13} />
          Reset Workspace
        </button>

        <button
          type="button"
          onClick={() => lockWorkspace()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Lock size={13} />
          Lock
        </button>
      </div>
    </div>
  );
}
