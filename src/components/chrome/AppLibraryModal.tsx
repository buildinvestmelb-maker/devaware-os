import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Pin,
  PinOff,
  Play,
  X,
} from 'lucide-react';
import { INDUSTRY_APPS, type AppId } from '../../registry/apps';
import { useWindowStore } from '../../store/useWindowStore';
import { AppIcon } from '../icons/AppIcon';

export function AppLibraryModal() {
  const isOpen = useWindowStore((s) => s.isAppLibraryOpen);
  const selectedAppId = useWindowStore((s) => s.appLibrarySelectedAppId);
  const pinnedApps = useWindowStore((s) => s.pinnedApps);
  const closeAppLibrary = useWindowStore((s) => s.closeAppLibrary);
  const togglePinApp = useWindowStore((s) => s.togglePinApp);
  const openApp = useWindowStore((s) => s.openApp);

  if (!isOpen) return null;

  const handleLaunch = (appId: AppId) => {
    closeAppLibrary();
    openApp(appId);
  };

  return (
    <div
      id="app-library-modal"
      data-testid="app-library-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-library-title"
      onClick={closeAppLibrary}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="plasma-glass animate-plasma-in flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-400/15 px-5 py-4">
          <div>
            <h2
              id="app-library-title"
              className="text-base font-semibold text-slate-100"
            >
              Australia-Wide Property Dev App Library
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Open-source GDA2020 & metric AUD micro-apps connected over{' '}
              <code className="font-mono-tech text-[#7dd3fc]">
                @devaware/os-bridge
              </code>
            </p>
          </div>
          <button
            type="button"
            onClick={closeAppLibrary}
            aria-label="Close App Library"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* 4 Industry Repo Cards */}
        <div className="grid grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-2">
          {INDUSTRY_APPS.map((app) => {
            const isPinned = pinnedApps.includes(app.id);
            const isLive = app.status === 'live';
            const isHighlighted = selectedAppId === app.id;

            return (
              <article
                key={app.id}
                data-testid={`library-card-${app.id}`}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  isHighlighted
                    ? 'border-[#3daee9]/60 bg-[#182634]/85'
                    : 'border-slate-400/15 bg-[#141a22]/85 hover:border-slate-400/28'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AppIcon appId={app.id} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-100">
                            {app.name}
                          </h3>
                          {app.singleInstance && (
                            <span className="font-mono-tech rounded border border-slate-500/25 bg-slate-800/70 px-1.5 py-0.5 text-[10px] text-slate-300">
                              Single-Instance 3D
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {app.category}
                        </p>
                      </div>
                    </div>

                    {isLive ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                        <CheckCircle2 size={11} />
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                        <Clock size={11} />
                        Coming Soon
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-300">
                    {app.description}
                  </p>

                  <ul className="mt-3 space-y-1">
                    {app.capabilities.map((cap) => (
                      <li
                        key={cap}
                        className="flex items-start gap-2 text-[11px] text-slate-400"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#3daee9]" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>

                  {app.roadmapNote && (
                    <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-2.5 py-2 text-[11px] text-amber-200/90">
                      {app.roadmapNote}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-400/12 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid={`library-pin-${app.id}`}
                      onClick={() => togglePinApp(app.id)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        isPinned
                          ? 'border-[#3daee9]/40 bg-[#3daee9]/15 text-[#7dd3fc] hover:bg-[#3daee9]/22'
                          : 'border-slate-400/20 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                      {isPinned ? 'Unpin' : 'Pin'}
                    </button>

                    {app.repoUrl && (
                      <a
                        href={app.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-400/20 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400/35 hover:text-white"
                      >
                        <ExternalLink size={12} />
                        Source Repo
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    data-testid={`library-launch-${app.id}`}
                    onClick={() => handleLaunch(app.id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isLive
                        ? 'bg-[#3daee9] text-slate-950 hover:bg-[#5bc0f2]'
                        : 'border border-slate-400/25 bg-white/[0.06] text-slate-200 hover:bg-white/[0.11]'
                    }`}
                  >
                    <Play size={12} />
                    {isLive ? 'Launch App' : 'Inspect Spec'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
