import { Clock, ExternalLink, Layers, ShieldCheck } from 'lucide-react';
import { APP_REGISTRY, type AppId } from '../../registry/apps';
import { useWindowStore } from '../../store/useWindowStore';
import { AppIcon } from '../icons/AppIcon';

interface SpecCardAppProps {
  appId: AppId;
}

export function SpecCardApp({ appId }: SpecCardAppProps) {
  const def = APP_REGISTRY[appId];
  const activeProject = useWindowStore((s) => s.activeProject);

  const schemaSlice =
    appId === 'formgen-au'
      ? activeProject.massing
      : appId === 'enviro-sim-au'
        ? activeProject.environment
        : activeProject;

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-[#12161d] p-5 text-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-400/15 pb-4">
        <div className="flex items-center gap-3">
          <AppIcon appId={appId} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">{def.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                <Clock size={11} />
                Coming Soon Spec
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">{def.category}</p>
          </div>
        </div>

        {def.repoUrl && (
          <a
            href={def.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-400/20 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-[#3daee9]/40 hover:text-white"
          >
            <ExternalLink size={13} />
            Source Repo
          </a>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-300">
        {def.description}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-400/15 bg-[#161c25] p-3.5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-100">
            <Layers size={14} className="text-[#3daee9]" />
            Planned Capabilities
          </div>
          <ul className="space-y-1.5">
            {def.capabilities.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs text-slate-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3daee9]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-400/15 bg-[#161c25] p-3.5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-100">
            <ShieldCheck size={14} className="text-emerald-400" />
            Host Bridge Contract
          </div>
          <p className="text-xs text-slate-400">
            Single-instance WebGL policy enforced by{' '}
            <code className="font-mono-tech text-[#7dd3fc]">devaware-os</code>.
            Active site context ({activeProject.location.state} •{' '}
            {activeProject.location.mgaEpsg}):
          </p>
          <pre className="font-mono-tech mt-2.5 overflow-auto rounded-lg border border-slate-400/10 bg-[#0c1016] p-2.5 text-[11px] text-slate-300">
            {JSON.stringify(schemaSlice ?? {}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
