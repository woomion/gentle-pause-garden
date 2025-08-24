import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { usePausedItems } from '@/hooks/usePausedItems';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { parseProductUrl } from '@/utils/urlParser';
import { extractStoreName } from '@/utils/pausedItemsUtils';
import { Clipboard, Check, Scan } from 'lucide-react';
import BarcodeScanner from '../BarcodeScanner';
import { lookupProductByBarcode } from '@/utils/productLookup';

// Quick add bar for Pill Mode only. Keeps UI minimal and fast.
const DURATION_PRESETS: { key: string; label: string }[] = [
  { key: '24 hours', label: '1 day' },
  { key: '3 days', label: '3 days' },
  { key: '1 week', label: '1 week' },
  { key: '2 weeks', label: '2 weeks' },
  { key: '1 month', label: '1 month' },
];

const isProbablyUrl = (text: string) => {
  const t = text.trim();
  if (/^(https?:\/\/|www\.)/i.test(t)) return true;
  // Domain-like detection without protocol (e.g., amazon.com/xyz, a.co/abc)
  if (!/^\S+$/.test(t)) return false; // must be single token
  try {
    const u = new URL(t.startsWith('http') ? t : `https://${t}`);
    return !!u.hostname && u.hostname.includes('.');
  } catch {
    return false;
  }
};

const getFallbackTitleFromUrl = (rawUrl: string): string | undefined => {
  try {
    const u = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    let seg = u.pathname.split('/').filter(Boolean).pop() || '';
    seg = decodeURIComponent(seg)
      .replace(/\.(html|htm|php|aspx)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b(dp|gp|product|products|item|sku|p)\b/gi, ' ')
      .trim();
    return seg || undefined;
  } catch {
    return undefined;
  }
};

const PillQuickPauseBar = ({ compact = false, prefillValue, onExpandRequest }: { compact?: boolean; prefillValue?: string; onExpandRequest?: () => void }) => {
  const { addItem } = usePausedItems();
  const { toast } = useToast();
  const usageLimit = useUsageLimit();
  const [value, setValue] = useState('');
  const [duration, setDuration] = useState<string>('1 week');
  const [submitting, setSubmitting] = useState(false);
  const [showClipboardSuccess, setShowClipboardSuccess] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastAppliedPrefill, setLastAppliedPrefill] = useState<string | undefined>(undefined);

  // When a prefill value comes from share target, populate and focus the input once per unique value
  useEffect(() => {
    if (prefillValue && prefillValue !== lastAppliedPrefill) {
      setValue(prefillValue);
      setLastAppliedPrefill(prefillValue);
      // Focus after value set
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [prefillValue, lastAppliedPrefill]);

  const handleSubmit = async () => {
    const raw = value.trim();
    if (!raw || submitting) return;
    
    // Check usage limit before proceeding
    if (!usageLimit.checkUsageLimit()) {
      return;
    }
    
    setSubmitting(true);

    try {
      let itemName = raw;
      let storeName = '';
      let link: string | undefined;
      let price: string | undefined;
      let imageUrl: string | undefined;

      if (isProbablyUrl(raw)) {
        const url = raw.startsWith('http') ? raw : `https://${raw}`;
        link = url;
        try {
          console.log('🔍 Parsing URL:', url);
          const parsed = await parseProductUrl(url);
          console.log('🔍 Parsed result:', parsed);
          if (parsed?.itemName) {
            itemName = parsed.itemName;
          } else {
            const ft = getFallbackTitleFromUrl(url);
            if (ft) itemName = ft;
          }
          if (parsed?.storeName) storeName = parsed.storeName; else storeName = extractStoreName(url);
          if (parsed?.price) price = parsed.price;
          if (parsed?.imageUrl) imageUrl = parsed.imageUrl;
        } catch {
          storeName = extractStoreName(url);
          const ft = getFallbackTitleFromUrl(url);
          if (ft) itemName = ft;
        }
      }

      await addItem({
        itemName: itemName,
        storeName,
        price: price ?? '',
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

      // Increment usage count for non-authenticated users
      usageLimit.incrementUsage();

      toast({ title: 'Paused', description: 'Added to your pause list', duration: 2000 });
      setValue('');
    } catch (e) {
      console.error('Quick add failed', e);
      toast({ title: 'Error', description: 'Could not add item', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReadClipboard = async () => {
    try {
      const clipboardValue = await navigator.clipboard.readText();
      
      if (clipboardValue && clipboardValue.trim()) {
        const urlPattern = /https?:\/\//i;
        if (urlPattern.test(clipboardValue.trim())) {
          setValue(clipboardValue.trim());
          setShowClipboardSuccess(true);
          setTimeout(() => setShowClipboardSuccess(false), 2000);
          toast({
            title: "URL pasted from clipboard!",
            description: "Ready to pause",
          });
          if (compact && onExpandRequest) {
            onExpandRequest();
          }
          setTimeout(() => inputRef.current?.focus(), 0);
        } else {
          toast({
            title: "No URL found",
            description: "Please copy a product URL to your clipboard first",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Clipboard is empty",
          description: "Please copy a product URL to your clipboard first",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      toast({
        title: "Can't access clipboard",
        description: "Please paste the URL manually",
        variant: "destructive"
      });
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    
    try {
      const productInfo = await lookupProductByBarcode(barcode);
      
      // Set the scanned product as the value
      setValue(productInfo.itemName || `Scanned Item ${barcode.slice(-4)}`);
      
      if (compact && onExpandRequest) {
        onExpandRequest();
      }
      
      toast({
        title: "Product scanned!",
        description: productInfo.itemName || "Barcode detected",
      });
      
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (error) {
      console.error('Error looking up product:', error);
      setValue(`Scanned Item ${barcode.slice(-4)}`);
      
      if (compact && onExpandRequest) {
        onExpandRequest();
      }
      
      toast({
        title: "Barcode scanned",
        description: "You can edit the details after pausing",
      });
    }
  };

  return (
    <div className={`w-full rounded-xl bg-card/70 backdrop-blur px-3 ${compact ? 'py-2' : 'py-3'}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                setValue(v);
                if (compact && onExpandRequest && isProbablyUrl(v)) {
                  onExpandRequest();
                }
              }}
              placeholder="Paste a link..."
              className="h-12 rounded-full text-base pr-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
            <button
              onClick={handleReadClipboard}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted/20 rounded-full transition-colors"
              title="Paste from clipboard"
            >
              {showClipboardSuccess ? (
                <Check size={18} className="text-primary" />
              ) : (
                <Clipboard size={18} className="text-primary" />
              )}
            </button>
          </div>
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="h-12 px-4 bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/20 hover:border-primary/40 transition-colors flex items-center gap-2"
            title="Scan Barcode"
          >
            <Scan size={20} className="text-primary" />
            {!compact && <span className="text-sm text-primary">Scan</span>}
          </button>
        </div>
      {!compact && (
        <>
          <div className="mt-3 grid grid-cols-5 gap-2">
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
        </>
      )}
      
      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
};

export default PillQuickPauseBar;
