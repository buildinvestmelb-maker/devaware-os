import {
  Blocks,
  Calculator,
  FolderKanban,
  Mountain,
  Terminal,
  Wind,
} from 'lucide-react';
import { APP_REGISTRY, type AppId } from '../../registry/apps';

interface AppIconProps {
  appId: AppId;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<AppIconProps['size']>, { box: string; icon: number }> = {
  xs: { box: 'w-5 h-5 rounded-md', icon: 12 },
  sm: { box: 'w-7 h-7 rounded-lg', icon: 15 },
  md: { box: 'w-10 h-10 rounded-xl', icon: 20 },
  lg: { box: 'w-12 h-12 rounded-xl', icon: 23 },
};

const ICON_THEMES: Record<AppId, string> = {
  'cutsheet-au':
    'bg-gradient-to-br from-[#1f4e5f] to-[#132f3b] text-[#64d2ff] border border-[#64d2ff]/25',
  'feaso-os':
    'bg-gradient-to-br from-[#1c4b3c] to-[#112e26] text-[#4ade9e] border border-[#4ade9e]/25',
  'formgen-au':
    'bg-gradient-to-br from-[#3f3a24] to-[#262216] text-[#eab354] border border-[#eab354]/25',
  'enviro-sim-au':
    'bg-gradient-to-br from-[#1e3d4f] to-[#122633] text-[#5ec8d8] border border-[#5ec8d8]/25',
  'file-explorer':
    'bg-gradient-to-br from-[#1d4566] to-[#122a40] text-[#3daee9] border border-[#3daee9]/30',
  'project-inspector':
    'bg-gradient-to-br from-[#2a3340] to-[#191f28] text-[#cbd5e1] border border-slate-400/25',
};

export function AppIcon({ appId, size = 'md' }: AppIconProps) {
  const def = APP_REGISTRY[appId];
  const dims = SIZE_CLASSES[size];

  const IconComponent = (() => {
    switch (def.icon) {
      case 'mountain':
        return Mountain;
      case 'calculator':
        return Calculator;
      case 'blocks':
        return Blocks;
      case 'wind':
        return Wind;
      case 'folder':
        return FolderKanban;
      case 'terminal':
        return Terminal;
    }
  })();

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center shadow-sm ${dims.box} ${ICON_THEMES[appId]}`}
      aria-hidden="true"
    >
      <IconComponent size={dims.icon} strokeWidth={1.85} />
    </span>
  );
}
