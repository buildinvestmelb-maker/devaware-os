import { useCallback, useEffect, useRef } from 'react';
import { osMessageRouter } from '../../bridge/osMessageRouter';
import { APP_REGISTRY } from '../../registry/apps';
import {
  useWindowStore,
  type WindowInstance,
} from '../../store/useWindowStore';
import { FileExplorerApp } from '../apps/FileExplorerApp';
import { ProjectInspectorApp } from '../apps/ProjectInspectorApp';
import { SpecCardApp } from '../apps/SpecCardApp';

interface WindowContentProps {
  win: WindowInstance;
  isActive: boolean;
}

export function WindowContent({ win, isActive }: WindowContentProps) {
  const def = APP_REGISTRY[win.appId];
  const isDraggingOrResizing = useWindowStore((s) => s.isDraggingOrResizing);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const registeredRef = useRef(false);

  const iframeRefCallback = useCallback(
    (node: HTMLIFrameElement | null) => {
      if (node && def.url) {
        osMessageRouter.registerIframe(win.windowId, win.appId, node, def.url);
        registeredRef.current = true;
      } else if (!node && registeredRef.current) {
        osMessageRouter.unregisterIframe(win.windowId);
        registeredRef.current = false;
      }
    },
    [win.windowId, win.appId, def.url],
  );

  useEffect(() => {
    return () => {
      if (registeredRef.current) {
        osMessageRouter.unregisterIframe(win.windowId);
        registeredRef.current = false;
      }
    };
  }, [win.windowId]);

  if (def.runtime === 'builtin') {
    if (win.appId === 'file-explorer') {
      return <FileExplorerApp />;
    }
    if (win.appId === 'project-inspector') {
      return <ProjectInspectorApp />;
    }
  }

  if (def.runtime === 'spec' || !def.url) {
    return <SpecCardApp appId={win.appId} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0e1217]">
      <iframe
        ref={iframeRefCallback}
        src={def.url}
        title={def.name}
        data-testid={`app-iframe-${win.appId}`}
        data-window-id={win.windowId}
        style={{
          pointerEvents: isDraggingOrResizing ? 'none' : 'auto',
        }}
        className={`h-full w-full border-0 bg-[#0e1217] ${
          isDraggingOrResizing ? 'pointer-events-none select-none' : ''
        }`}
        allow="clipboard-read; clipboard-write; geolocation"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
      />

      {/* Mandatory Iframe Drag Shield during any window drag or resize */}
      {isDraggingOrResizing && (
        <div
          data-testid={`iframe-drag-shield-${win.appId}`}
          aria-hidden="true"
          className="absolute inset-0 z-30 cursor-grabbing bg-transparent"
        />
      )}

      {/* Mandatory Unfocused Click-Catcher: single click raises inactive iframe window */}
      {!isActive && !isDraggingOrResizing && (
        <div
          role="button"
          tabIndex={-1}
          aria-label={`Focus ${win.title}`}
          data-testid={`unfocused-click-catcher-${win.appId}`}
          onMouseDown={(e) => {
            e.stopPropagation();
            focusWindow(win.windowId);
          }}
          onClick={(e) => {
            e.stopPropagation();
            focusWindow(win.windowId);
          }}
          className="absolute inset-0 z-20 cursor-pointer bg-slate-950/[0.06] transition-colors hover:bg-transparent"
        />
      )}
    </div>
  );
}
