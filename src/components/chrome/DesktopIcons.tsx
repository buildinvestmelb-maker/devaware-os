import { useState } from 'react';
import { APP_REGISTRY, type AppId } from '../../registry/apps';
import { useWindowStore } from '../../store/useWindowStore';
import { AppIcon } from '../icons/AppIcon';

export function DesktopIcons() {
  const pinnedApps = useWindowStore((s) => s.pinnedApps);
  const openApp = useWindowStore((s) => s.openApp);
  const openAppLibrary = useWindowStore((s) => s.openAppLibrary);
  const [selectedId, setSelectedId] = useState<AppId | null>(null);

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

  return (
    <nav
      aria-label="Desktop Shortcuts"
      className="pointer-events-none absolute top-4 left-4 bottom-16 z-[2] flex flex-col flex-wrap content-start gap-2"
    >
      {desktopItems.map((appId) => {
        const app = APP_REGISTRY[appId];
        const isSelected = selectedId === appId;

        return (
          <button
            key={appId}
            id={`desktop-icon-${appId}`}
            data-testid={`desktop-icon-${appId}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(appId);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setSelectedId(appId);
              handleLaunch(appId);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleLaunch(appId);
              }
            }}
            title={`${app.name} — Double-click to open`}
            className={`pointer-events-auto group flex w-[92px] cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all duration-120 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3daee9] ${
              isSelected
                ? 'border-[#3daee9]/55 bg-[#3daee9]/18 backdrop-blur-md'
                : 'border-transparent bg-transparent hover:border-slate-300/15 hover:bg-slate-900/45 hover:backdrop-blur-sm'
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
