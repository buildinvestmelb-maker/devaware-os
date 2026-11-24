import {
  Activity,
  Check,
  Code2,
  Copy,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
  useWindowStore,
  type BusLogDirection,
} from '../../store/useWindowStore';

type InspectorTab = 'project' | 'bus';
type BusFilter = 'all' | BusLogDirection;

const AUD_FORMATTER = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

export function ProjectInspectorApp() {
  const activeProject = useWindowStore((s) => s.activeProject);
  const busLogs = useWindowStore((s) => s.busLogs);
  const clearBusLogs = useWindowStore((s) => s.clearBusLogs);

  const [tab, setTab] = useState<InspectorTab>('project');
  const [busFilter, setBusFilter] = useState<BusFilter>('all');
  const [copied, setCopied] = useState(false);

  const rejectedCount = busLogs.filter((l) => l.direction === 'rejected').length;
  const visibleLogs =
    busFilter === 'all'
      ? busLogs
      : busLogs.filter((l) => l.direction === busFilter);

  const formattedJson = JSON.stringify(activeProject, null, 2);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable in restricted context
    }
  };

  return (
    <div
      data-testid="project-inspector-app"
      className="flex h-full w-full flex-col bg-[#11151b] text-slate-200"
    >
      {/* Metric Context Summary Strip */}
      <div className="grid grid-cols-2 gap-2 border-b border-slate-400/15 bg-[#161c24] px-3 py-2.5 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-400/12 bg-slate-950/50 px-2.5 py-1.5">
          <div className="text-[10px] tracking-wider text-slate-400 uppercase">
            Jurisdiction
          </div>
          <div className="font-mono-tech text-xs font-semibold text-white">
            {activeProject.location.state} • {activeProject.location.mgaEpsg}
          </div>
        </div>
        <div className="rounded-lg border border-slate-400/12 bg-slate-950/50 px-2.5 py-1.5">
          <div className="text-[10px] tracking-wider text-slate-400 uppercase">
            Gross Area
          </div>
          <div className="font-mono-tech text-xs font-semibold text-white">
            {(activeProject.geometry.grossAreaSqm ?? 0).toLocaleString('en-AU')}{' '}
            m²
          </div>
        </div>
        <div className="rounded-lg border border-slate-400/12 bg-slate-950/50 px-2.5 py-1.5">
          <div className="text-[10px] tracking-wider text-slate-400 uppercase">
            Bulk Earthworks
          </div>
          <div className="font-mono-tech text-xs font-semibold text-[#7dd3fc]">
            {AUD_FORMATTER.format(
              activeProject.earthworks?.bulkEarthworksCostAud ?? 0,
            )}
          </div>
        </div>
        <div className="rounded-lg border border-slate-400/12 bg-slate-950/50 px-2.5 py-1.5">
          <div className="text-[10px] tracking-wider text-slate-400 uppercase">
            Rejected Origins
          </div>
          <div
            data-testid="inspector-rejected-count"
            className={`font-mono-tech text-xs font-semibold ${
              rejectedCount > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {rejectedCount} blocked
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-400/15 bg-[#141921] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="inspector-tab-project"
            onClick={() => setTab('project')}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'project'
                ? 'bg-[#3daee9]/20 text-white'
                : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
            }`}
          >
            <Code2 size={13} className="text-[#3daee9]" />
            Active SiteProject JSON
          </button>

          <button
            type="button"
            data-testid="inspector-tab-bus"
            onClick={() => setTab('bus')}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'bus'
                ? 'bg-[#3daee9]/20 text-white'
                : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
            }`}
          >
            <Activity size={13} className="text-[#3daee9]" />
            Message Bus Log
            <span className="font-mono-tech rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
              {busLogs.length}
            </span>
            {rejectedCount > 0 && (
              <span className="font-mono-tech rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">
                {rejectedCount} rejected
              </span>
            )}
          </button>
        </div>

        {tab === 'project' ? (
          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-400/20 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300 hover:bg-white/[0.08] hover:text-white"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy JSON
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            {(['all', 'inbound', 'outbound', 'rejected'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setBusFilter(f)}
                className={`cursor-pointer rounded px-2 py-0.5 text-[11px] capitalize transition-colors ${
                  busFilter === f
                    ? 'bg-slate-700 font-medium text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
            <button
              type="button"
              onClick={clearBusLogs}
              aria-label="Clear Message Bus Log"
              className="ml-1 inline-flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-[11px] text-slate-400 hover:bg-white/[0.06] hover:text-white"
            >
              <Trash2 size={11} />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {tab === 'project' ? (
          <pre
            data-testid="inspector-json-view"
            className="font-mono-tech rounded-lg border border-slate-400/12 bg-[#0b0f14] p-3.5 text-[11px] leading-relaxed text-slate-200"
          >
            {formattedJson}
          </pre>
        ) : visibleLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No bridge messages recorded yet for this filter.
          </div>
        ) : (
          <div data-testid="inspector-bus-log" className="space-y-1.5">
            {visibleLogs.map((log) => {
              const isRejected = log.direction === 'rejected';
              const badgeColor = isRejected
                ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                : log.direction === 'inbound'
                  ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                  : log.direction === 'outbound'
                    ? 'border-[#3daee9]/35 bg-[#3daee9]/15 text-[#7dd3fc]'
                    : 'border-slate-500/30 bg-slate-800 text-slate-300';

              return (
                <div
                  key={log.id}
                  data-testid={
                    isRejected ? 'bus-log-rejected-row' : 'bus-log-row'
                  }
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    isRejected
                      ? 'border-rose-500/40 bg-rose-950/35'
                      : 'border-slate-400/12 bg-[#151b23]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-mono-tech inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badgeColor}`}
                      >
                        {isRejected && <ShieldAlert size={11} />}
                        {log.direction}
                      </span>
                      <span className="font-mono-tech font-semibold text-white">
                        {log.messageType}
                      </span>
                      {log.appId && (
                        <span className="font-mono-tech text-[11px] text-slate-400">
                          [{log.appId}]
                        </span>
                      )}
                    </div>
                    <span className="font-mono-tech text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString('en-AU', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="font-mono-tech mt-1 text-[11px] text-slate-400">
                    origin: <span className="text-slate-200">{log.origin}</span>
                  </div>

                  {log.summary && (
                    <div className="mt-1 text-[11px] text-slate-300">
                      {log.summary}
                    </div>
                  )}

                  {log.reason && (
                    <div className="mt-1 text-[11px] font-medium text-rose-300">
                      Reason: {log.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
