import {
  Bell,
  Compass,
  FolderKanban,
  LayoutGrid,
  Lock,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWindowStore } from '../../store/useWindowStore';
import {
  formatAustralianClock,
  TIMEZONE_OPTIONS,
} from '../../utils/auClock';
import { AppIcon } from '../icons/AppIcon';

export function BottomPanel() {
  const windows = useWindowStore((s) => s.windows);
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const activeProject = useWindowStore((s) => s.activeProject);
  const hasLoadedDeal = useWindowStore((s) => s.hasLoadedDeal);
  const timezone = useWindowStore((s) => s.timezone);
  const setTimezone = useWindowStore((s) => s.setTimezone);
  const notifications = useWindowStore((s) => s.notifications);
  const clearNotifications = useWindowStore((s) => s.clearNotifications);
  const isLauncherOpen = useWindowStore((s) => s.isLauncherOpen);
  const isNotificationCenterOpen = useWindowStore(
    (s) => s.isNotificationCenterOpen,
  );

  const toggleLauncher = useWindowStore((s) => s.toggleLauncher);
  const openAppLibrary = useWindowStore((s) => s.openAppLibrary);
  const openApp = useWindowStore((s) => s.openApp);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleNotificationCenter = useWindowStore(
    (s) => s.toggleNotificationCenter,
  );
  const lockWorkspace = useWindowStore((s) => s.lockWorkspace);

  const [now, setNow] = useState(() => new Date());
  const [clockMenuOpen, setClockMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clock = formatAustralianClock(now, timezone);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTaskPillClick = (windowId: string, minimized: boolean) => {
    setClockMenuOpen(false);
    if (!minimized && activeWindowId === windowId) {
      minimizeWindow(windowId);
    } else {
      focusWindow(windowId);
    }
  };

  return (
    <footer
      id="plasma-bottom-panel"
      data-testid="bottom-panel"
      onClick={(e) => e.stopPropagation()}
      className="plasma-panel fixed inset-x-0 bottom-0 z-40 flex h-12 items-center justify-between gap-2 px-2.5 select-none"
    >
      {/* Left: App Launcher + Quick Shortcuts */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          id="app-launcher-btn"
          data-testid="app-launcher-btn"
          type="button"
          onClick={() => {
            setClockMenuOpen(false);
            toggleLauncher();
          }}
          aria-expanded={isLauncherOpen}
          aria-label="Open Application Launcher"
          className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
            isLauncherOpen
              ? 'border-[#3daee9]/65 bg-[#3daee9]/20 text-white'
              : 'border-transparent bg-white/[0.04] text-slate-200 hover:border-slate-400/20 hover:bg-white/[0.08]'
          }`}
        >
          <Compass size={16} className="text-[#3daee9]" />
          <span className="hidden sm:inline">devaware</span>
        </button>

        <button
          id="panel-projects-btn"
          data-testid="panel-projects-btn"
          type="button"
          onClick={() => {
            setClockMenuOpen(false);
            openApp('file-explorer');
          }}
          title="Open Projects (AU)"
          aria-label="Open Projects (AU) File Explorer"
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-2 text-xs text-slate-300 transition-colors hover:border-slate-400/15 hover:bg-white/[0.07] hover:text-white"
        >
          <FolderKanban size={15} className="text-[#3daee9]" />
          <span className="hidden lg:inline">Projects</span>
        </button>

        <button
          id="panel-app-library-btn"
          data-testid="panel-app-library-btn"
          type="button"
          onClick={() => {
            setClockMenuOpen(false);
            openAppLibrary();
          }}
          title="Open AU App Library"
          aria-label="Open App Library"
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-2 text-xs text-slate-300 transition-colors hover:border-slate-400/15 hover:bg-white/[0.07] hover:text-white"
        >
          <LayoutGrid size={15} className="text-slate-300" />
          <span className="hidden lg:inline">Library</span>
        </button>

        <div className="mx-1 hidden h-5 w-px bg-slate-500/20 xl:block" />

        <div
          data-testid="panel-active-site"
          className="font-mono-tech hidden items-center gap-1.5 rounded-md border border-slate-500/20 bg-slate-900/55 px-2 py-1 text-[11px] text-slate-300 xl:flex"
          title={
            hasLoadedDeal
              ? `Active SiteProject: ${activeProject.name}`
              : 'Australia-Wide Workspace (GDA2020)'
          }
        >
          <span className="font-semibold text-[#7dd3fc]">
            {hasLoadedDeal ? activeProject.location.state : 'AU'}
          </span>
          <span className="text-slate-500">•</span>
          <span>
            {hasLoadedDeal ? activeProject.location.mgaEpsg : 'GDA2020'}
          </span>
        </div>
      </div>

      {/* Center: Open Window Pills */}
      <div
        role="tablist"
        aria-label="Open Windows"
        className="flex min-w-0 flex-1 items-center justify-start gap-1.5 overflow-x-auto px-1"
      >
        {windows.length === 0 ? (
          <span className="hidden text-xs text-slate-500 md:inline">
            Open Projects (AU) or pick a suite from the launcher
          </span>
        ) : (
          windows.map((win) => {
            const isActive = !win.minimized && activeWindowId === win.windowId;
            return (
              <button
                key={win.windowId}
                id={`task-pill-${win.windowId}`}
                data-testid={`task-pill-${win.appId}`}
                data-window-id={win.windowId}
                data-active={isActive ? 'true' : 'false'}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTaskPillClick(win.windowId, win.minimized)}
                className={`relative flex h-8 max-w-[196px] shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'border-[#3daee9]/45 bg-[#3daee9]/16 text-white'
                    : win.minimized
                      ? 'border-transparent bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                      : 'border-slate-400/15 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-x-2 top-0 h-[2px] rounded-full bg-[#3daee9]" />
                )}
                <AppIcon appId={win.appId} size="xs" />
                <span className="truncate">{win.title}</span>
                {win.minimized && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Right: System Tray — Clock + TZ Switcher, Notifications, Lock */}
      <div className="relative flex shrink-0 items-center gap-1">
        {/* Timezone Switcher Popover */}
        {clockMenuOpen && (
          <div
            data-testid="timezone-popover"
            className="plasma-glass animate-plasma-in absolute right-14 bottom-14 w-64 rounded-xl p-2 shadow-2xl"
          >
            <div className="border-b border-slate-400/15 px-2.5 py-2">
              <div className="font-mono-tech text-lg font-semibold text-white">
                {clock.timeWithSeconds}{' '}
                <span className="text-xs font-medium text-[#7dd3fc]">
                  {clock.tzAbbr}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">{clock.dateLong}</div>
            </div>
            <div className="mt-1.5 space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Australian Timezone
              </div>
              {TIMEZONE_OPTIONS.map((opt) => {
                const selected = timezone === opt.value;
                return (
                  <button
                    key={opt.value}
                    data-testid={`tz-option-${opt.value}`}
                    type="button"
                    onClick={() => {
                      setTimezone(opt.value);
                      setClockMenuOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      selected
                        ? 'bg-[#3daee9]/20 font-medium text-white'
                        : 'text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="font-mono-tech text-[10px] text-slate-400">
                      {opt.city}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Notification Center Popover */}
        {isNotificationCenterOpen && (
          <div
            data-testid="notification-center"
            className="plasma-glass animate-plasma-in absolute right-2 bottom-14 w-80 rounded-xl p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between border-b border-slate-400/15 pb-2">
              <span className="text-xs font-semibold text-slate-100">
                Notifications
              </span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No workspace notifications yet.
              </p>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border border-slate-400/12 bg-slate-900/60 px-2.5 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-100">
                        {n.title}
                      </span>
                      <span className="font-mono-tech text-[10px] text-slate-500">
                        {new Date(n.createdAt).toLocaleTimeString('en-AU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {n.message && (
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {n.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clock button */}
        <button
          id="panel-clock-btn"
          data-testid="panel-clock-btn"
          type="button"
          onClick={() => setClockMenuOpen((prev) => !prev)}
          title="Switch Australian Timezone"
          className="flex h-9 cursor-pointer flex-col items-end justify-center rounded-lg px-2.5 text-right transition-colors hover:bg-white/[0.07]"
        >
          <span className="font-mono-tech text-xs leading-tight font-semibold text-slate-100">
            {clock.time}{' '}
            <span className="text-[10px] font-medium text-[#7dd3fc]">
              {clock.tzAbbr}
            </span>
          </span>
          <span className="text-[10px] leading-tight text-slate-400">
            {clock.dateShort}
          </span>
        </button>

        {/* Notification Bell */}
        <button
          id="panel-bell-btn"
          data-testid="panel-bell-btn"
          type="button"
          onClick={() => {
            setClockMenuOpen(false);
            toggleNotificationCenter();
          }}
          aria-label="Toggle Notifications"
          className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#3daee9] px-1 text-[9px] font-bold text-slate-950">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Lock Workspace button */}
        <button
          id="panel-lock-btn"
          data-testid="panel-lock-btn"
          type="button"
          onClick={() => {
            setClockMenuOpen(false);
            lockWorkspace();
          }}
          title="Lock Workspace"
          aria-label="Lock Workspace"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Lock size={15} />
        </button>
      </div>
    </footer>
  );
}
