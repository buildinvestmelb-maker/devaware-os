import { ArrowRight, Compass, Globe2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWindowStore } from '../../store/useWindowStore';
import { formatAustralianClock } from '../../utils/auClock';

export function LockScreen() {
  const unlockWorkspace = useWindowStore((s) => s.unlockWorkspace);
  const timezone = useWindowStore((s) => s.timezone);
  const activeProject = useWindowStore((s) => s.activeProject);

  const [now, setNow] = useState(() => new Date());
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEnter = () => {
    if (entering) return;
    setEntering(true);
    setTimeout(() => {
      unlockWorkspace();
    }, 180);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'BUTTON') return;
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const clock = formatAustralianClock(now, timezone);

  return (
    <main
      id="lock-screen"
      data-testid="lock-screen"
      className={`au-topo-wallpaper fixed inset-0 z-50 flex flex-col justify-between px-6 py-8 transition-opacity duration-200 select-none ${
        entering ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Top minimal Plasma session bar */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between text-xs text-slate-300/85">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-400/25 bg-[#151b23]/80 text-[#3daee9]">
            <Compass size={14} strokeWidth={2} />
          </span>
          <span className="font-semibold tracking-tight text-slate-100">
            devaware-os
          </span>
          <span className="hidden text-slate-500 sm:inline">/</span>
          <span className="hidden font-mono-tech text-[11px] text-slate-400 sm:inline">
            Plasma 6 Web Session
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono-tech text-[11px] text-slate-300/90">
          <Globe2 size={13} className="text-[#3daee9]" />
          <span>{clock.tzAbbr}</span>
          {clock.resolvedTimeZone !== clock.tzAbbr && (
            <>
              <span className="hidden text-slate-500 sm:inline">•</span>
              <span className="hidden text-slate-400 sm:inline">
                {clock.resolvedTimeZone}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Center clock, status pill, and single Enter Workspace action */}
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-3 flex items-baseline gap-3">
          <time
            dateTime={now.toISOString()}
            data-testid="lock-screen-clock"
            className="tabular-nums text-6xl font-semibold tracking-tight text-slate-50 drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)] sm:text-7xl md:text-8xl"
          >
            {clock.time}
          </time>
          <span
            data-testid="lock-screen-tz"
            className="font-mono-tech rounded border border-slate-400/20 bg-[#141a22]/75 px-2 py-0.5 text-xs font-medium text-[#7dd3fc]"
          >
            {clock.tzAbbr}
          </span>
        </div>

        <p
          data-testid="lock-screen-date"
          className="mb-7 text-base font-medium tracking-wide text-slate-200/90 sm:text-lg"
        >
          {clock.dateLong}
        </p>

        <h1 className="sr-only">devaware-os Australian Property Development Desktop</h1>

        <div
          data-testid="lock-screen-status-pill"
          className="plasma-glass mb-9 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-slate-200 shadow-lg sm:text-[13px]"
        >
          Australia-Wide Open-Source Dev Suite • Metric / GDA2020
        </div>

        <button
          id="enter-workspace-btn"
          data-testid="enter-workspace-btn"
          type="button"
          onClick={handleEnter}
          className="group inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#3daee9]/55 bg-[#182938]/90 px-7 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_-10px_rgba(0,0,0,0.75)] backdrop-blur-md transition-all duration-150 hover:border-[#3daee9] hover:bg-[#1e3a52] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3daee9] active:scale-[0.98]"
        >
          <span>Enter Workspace</span>
          <ArrowRight
            size={16}
            className="text-[#7dd3fc] transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </button>

        <p className="mt-4 text-xs text-slate-400/85">
          Press <kbd className="font-mono-tech rounded border border-slate-500/35 bg-slate-900/70 px-1.5 py-0.5 text-[11px] text-slate-300">Enter</kbd> or click to resume workspace
        </p>
      </section>

      {/* Bottom datum & active site indicator */}
      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="font-mono-tech flex items-center gap-2">
          <span>GDA2020 / MGA Zones 49–56</span>
          <span className="text-slate-600">|</span>
          <span>EPSG:7849–7856</span>
        </div>
        <div className="font-mono-tech text-slate-300/80">
          Active Context: {activeProject.name} ({activeProject.location.state} •{' '}
          {activeProject.location.mgaEpsg})
        </div>
      </footer>
    </main>
  );
}
