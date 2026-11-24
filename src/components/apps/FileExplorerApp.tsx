import {
  FileCode2,
  Folder,
  FolderOpen,
  Globe,
  MapPin,
  Play,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AustralianState } from '../../bridge/types';
import {
  AUSTRALIAN_STATES,
  SAMPLE_DEALS,
  type DealFileEntry,
} from '../../data/sampleDeals';
import { useWindowStore } from '../../store/useWindowStore';

type FolderFilter = 'ALL' | AustralianState;

export function FileExplorerApp() {
  const activeProject = useWindowStore((s) => s.activeProject);
  const loadDealAndLaunchSuite = useWindowStore(
    (s) => s.loadDealAndLaunchSuite,
  );

  const [selectedFolder, setSelectedFolder] = useState<FolderFilter>('ALL');
  const [selectedDealId, setSelectedDealId] = useState<string>(
    SAMPLE_DEALS[0].id,
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SAMPLE_DEALS.filter((deal) => {
      if (selectedFolder !== 'ALL' && deal.state !== selectedFolder) {
        return false;
      }
      if (!q) return true;
      return (
        deal.path.toLowerCase().includes(q) ||
        deal.project.name.toLowerCase().includes(q) ||
        (deal.project.location.lga ?? '').toLowerCase().includes(q) ||
        deal.state.toLowerCase().includes(q)
      );
    });
  }, [selectedFolder, searchQuery]);

  const selectedDeal: DealFileEntry | undefined =
    filteredDeals.find((d) => d.id === selectedDealId) ?? filteredDeals[0];

  const handleOpenDeal = (deal: DealFileEntry) => {
    setSelectedDealId(deal.id);
    loadDealAndLaunchSuite(deal.project);
  };

  return (
    <div
      data-testid="file-explorer-app"
      className="flex h-full w-full flex-col bg-[#12161d] text-slate-200 select-none"
    >
      {/* Top Dolphin-style path & search bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-400/15 bg-[#161c24] px-3 py-2">
        <div className="font-mono-tech flex items-center gap-1.5 text-xs text-slate-300">
          <Globe size={13} className="text-[#3daee9]" />
          <span className="text-slate-400">au://deals/</span>
          <span className="font-semibold text-white">
            {selectedFolder === 'ALL' ? 'All-States' : `${selectedFolder}/`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter .deal files..."
              className="w-44 rounded-md border border-slate-400/20 bg-slate-950/70 py-1 pr-2.5 pl-7 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#3daee9] focus:outline-none sm:w-56"
            />
          </label>
        </div>
      </div>

      {/* Main Split: National State Folders + Deal Listing */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar: States & Territories */}
        <aside
          aria-label="Australian States and Territories"
          className="w-40 shrink-0 overflow-y-auto border-r border-slate-400/12 bg-[#141921] p-2 sm:w-48"
        >
          <div className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            National Folders
          </div>

          <button
            type="button"
            data-testid="folder-ALL"
            onClick={() => setSelectedFolder('ALL')}
            className={`mb-1 flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
              selectedFolder === 'ALL'
                ? 'bg-[#3daee9]/18 font-semibold text-white'
                : 'text-slate-300 hover:bg-white/[0.06]'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {selectedFolder === 'ALL' ? (
                <FolderOpen size={14} className="text-[#3daee9]" />
              ) : (
                <Folder size={14} className="text-slate-400" />
              )}
              All Australia
            </span>
            <span className="font-mono-tech text-[10px] text-slate-400">
              {SAMPLE_DEALS.length}
            </span>
          </button>

          <div className="space-y-0.5">
            {AUSTRALIAN_STATES.map((st) => {
              const count = SAMPLE_DEALS.filter((d) => d.state === st.code).length;
              const isSelected = selectedFolder === st.code;
              return (
                <button
                  key={st.code}
                  type="button"
                  data-testid={`folder-${st.code}`}
                  onClick={() => setSelectedFolder(st.code)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#3daee9]/18 font-semibold text-white'
                      : 'text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 truncate">
                    {isSelected ? (
                      <FolderOpen size={14} className="shrink-0 text-[#3daee9]" />
                    ) : (
                      <Folder size={14} className="shrink-0 text-slate-400" />
                    )}
                    <span className="font-mono-tech">{st.code}/</span>
                    <span className="hidden truncate text-[10px] text-slate-400 sm:inline">
                      {st.capital}
                    </span>
                  </span>
                  <span className="font-mono-tech text-[10px] text-slate-500">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right File List */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-400/10 bg-[#131820] px-3 py-1.5 text-[11px] text-slate-400">
            <span>Double-click any .deal file to launch CutSheet AU + Feaso OS side-by-side</span>
            <span className="font-mono-tech text-[10px] text-slate-500">
              {filteredDeals.length} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5">
            {filteredDeals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No matching Australian .deal files found.
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredDeals.map((deal) => {
                  const isSelected = selectedDeal?.id === deal.id;
                  const isLoaded =
                    activeProject.projectId === deal.project.projectId;
                  const grossHa = (
                    (deal.project.geometry.grossAreaSqm ?? 0) / 10000
                  ).toFixed(2);

                  return (
                    <div
                      key={deal.id}
                      role="button"
                      tabIndex={0}
                      data-testid={`deal-row-${deal.id}`}
                      data-deal-path={deal.path}
                      onClick={() => setSelectedDealId(deal.id)}
                      onDoubleClick={() => handleOpenDeal(deal)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleOpenDeal(deal);
                        }
                      }}
                      className={`group flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3daee9] ${
                        isSelected
                          ? 'border-[#3daee9]/55 bg-[#1b2c3b]/80'
                          : 'border-slate-400/12 bg-[#161c25]/70 hover:border-slate-400/25 hover:bg-[#1a222d]'
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#3daee9]/25 bg-[#132635] text-[#7dd3fc]">
                          <FileCode2 size={16} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-tech text-xs font-semibold text-white">
                              {deal.path}
                            </span>
                            {isLoaded && (
                              <span className="rounded border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-slate-300">
                            {deal.project.name} — {deal.project.location.lga}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                            <span className="font-mono-tech text-[#7dd3fc]">
                              Zone {deal.project.location.mgaZone} (
                              {deal.project.location.mgaEpsg})
                            </span>
                            <span>{grossHa} ha</span>
                            <span>{deal.project.geometry.parcelId}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeal(deal);
                        }}
                        title={`Load ${deal.path} into CutSheet AU + Feaso OS`}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-[#3daee9]/40 bg-[#3daee9]/15 px-2.5 py-1.5 text-[11px] font-semibold text-[#7dd3fc] transition-colors hover:bg-[#3daee9] hover:text-slate-950"
                      >
                        <Play size={11} />
                        Open
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom status bar */}
      {selectedDeal && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-400/12 bg-[#161c24] px-3 py-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <MapPin size={12} className="shrink-0 text-[#3daee9]" />
            <span className="truncate text-slate-300">
              {selectedDeal.project.location.address}
            </span>
          </div>
          <div className="font-mono-tech flex shrink-0 items-center gap-3 text-[10px] text-slate-400">
            <span>
              {selectedDeal.project.location.lat.toFixed(4)},{' '}
              {selectedDeal.project.location.lng.toFixed(4)}
            </span>
            <span className="text-[#7dd3fc]">
              {selectedDeal.project.location.mgaEpsg}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
