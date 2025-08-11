import { useMemo } from 'react';
import { PausedItem as CloudPausedItem } from '@/stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '@/stores/pausedItemsStore';

interface PillItemProps {
  item: CloudPausedItem | LocalPausedItem;
  onClick?: () => void;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const PillItem = ({ item, onClick }: PillItemProps) => {
  const progress = useMemo(() => {
    const total = item.checkInDate.getTime() - item.pausedAt.getTime();
    const elapsed = Date.now() - item.pausedAt.getTime();
    if (total <= 0) return 100;
    return clamp(Math.round((elapsed / total) * 100), 0, 100);
  }, [item.checkInDate, item.pausedAt]);

  const label = useMemo(() => {
    const base = item.itemName || item.link || 'Paused item';
    const hasStore = 'storeName' in item && (item as any).storeName && (item as any).storeName.trim().length > 0;
    return hasStore ? `${(item as any).storeName}_${base}` : base;
  }, [item.itemName, item.link, (item as any)?.storeName]);

  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-full border border-primary/30 bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15"
    >
      {/* progress */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary/10"
        style={{ width: `${progress}%` }}
        aria-hidden
      />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className="truncate font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{item.checkInTime}</span>
      </div>
    </button>
  );
};

export default PillItem;
