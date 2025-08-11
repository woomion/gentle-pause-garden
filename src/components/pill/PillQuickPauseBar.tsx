import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { usePausedItems } from '@/hooks/usePausedItems';
import { parseProductUrl } from '@/utils/urlParser';
import { extractStoreName } from '@/utils/pausedItemsUtils';

// Quick add bar for Pill Mode only. Keeps UI minimal and fast.
const DURATION_PRESETS: { key: string; label: string }[] = [
  { key: '24 hours', label: '1 day' },
  { key: '3 days', label: '3 days' },
  { key: '1 week', label: '1 week' },
  { key: '1 month', label: '1 month' },
];

const isProbablyUrl = (text: string) => /^(https?:\/\/|www\.)/i.test(text.trim());

const PillQuickPauseBar = () => {
  const { addItem } = usePausedItems();
  const { toast } = useToast();
  const [value, setValue] = useState('');
  const [duration, setDuration] = useState<string>('1 week');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const raw = value.trim();
    if (!raw || submitting) return;
    setSubmitting(true);

    try {
      let itemName = raw;
      let storeName = 'Unknown Store';
      let link: string | undefined;
      let price: string | undefined;
      let imageUrl: string | undefined;

      if (isProbablyUrl(raw)) {
        const url = raw.startsWith('http') ? raw : `https://${raw}`;
        link = url;
        try {
          const parsed = await parseProductUrl(url);
          if (parsed?.itemName) itemName = parsed.itemName;
          if (parsed?.storeName) storeName = parsed.storeName; else storeName = extractStoreName(url);
          if (parsed?.price) price = parsed.price;
          if (parsed?.imageUrl) imageUrl = parsed.imageUrl;
        } catch {
          storeName = extractStoreName(url);
        }
      }

      await addItem({
        itemName: itemName || 'Unnamed Item',
        storeName,
        price: price ?? '',
        emotion: 'something else',
        notes: undefined,
        duration,
        link,
        photo: null,
        imageUrl,
        tags: [],
        isCart: false,
        itemType: 'item',
        usePlaceholder: false,
      });

      toast({ title: 'Paused', description: 'Added to your pause list', duration: 2000 });
      setValue('');
    } catch (e) {
      console.error('Quick add failed', e);
      toast({ title: 'Error', description: 'Could not add item', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-xl border border-border bg-card/70 backdrop-blur px-3 py-3">
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a link or type a thought..."
          className="flex-1 h-12 rounded-full text-base"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {DURATION_PRESETS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDuration(d.key)}
            aria-pressed={duration === d.key}
            className={
              `flex-1 h-10 rounded-full border text-sm transition-colors ` +
              (duration === d.key
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted')
            }
          >
            {d.label}
          </button>
        ))}
      </div>
      
      <div className="mt-3">
        <Button onClick={handleSubmit} disabled={!value.trim() || submitting} size="xl" shape="pill" className="w-full">
          {submitting ? 'Pausing…' : 'Pause'}
        </Button>
      </div>
    </div>
  );
};

export default PillQuickPauseBar;
