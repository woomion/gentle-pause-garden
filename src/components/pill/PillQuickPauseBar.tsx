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

import { useSubscription } from '@/hooks/useSubscription';
import PremiumDurationModal from '../PremiumDurationModal';

// Quick add bar for Pill Mode only. Keeps UI minimal and fast.
// Temporarily only showing 24 hours option for launch
const DURATION_PRESETS: { key: string; label: string; isPremium?: boolean }[] = [
  { key: '24 hours', label: '1 day', isPremium: false },
  // Temporarily commented out for launch
  // { key: '3 days', label: '3 days', isPremium: true },
  // { key: '1 week', label: '1 week', isPremium: true },
  // { key: '2 weeks', label: '2 weeks', isPremium: true },
  // { key: '1 month', label: '1 month', isPremium: true },
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

const PillQuickPauseBar = ({ compact = false, prefillValue, onExpandRequest, onUrlEntry, onBarcodeScanned }: { 
  compact?: boolean; 
  prefillValue?: string; 
  onExpandRequest?: () => void;
  onUrlEntry?: () => void;
  onBarcodeScanned?: () => void;
}) => {
  const { addItem } = usePausedItems();
  const { toast } = useToast();
  const usageLimit = useUsageLimit();
  const { isPremiumUser } = useSubscription();
  const [value, setValue] = useState('');
  const [duration, setDuration] = useState<string>('24 hours');
  const [submitting, setSubmitting] = useState(false);
  const [showClipboardSuccess, setShowClipboardSuccess] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPremiumDurationModal, setShowPremiumDurationModal] = useState(false);
  const [pendingPremiumDuration, setPendingPremiumDuration] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastAppliedPrefill, setLastAppliedPrefill] = useState<string | undefined>(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // When a prefill value comes from share target, populate and focus the input once per unique value
  useEffect(() => {
    if (prefillValue && prefillValue !== lastAppliedPrefill) {
      setValue(prefillValue);
      setLastAppliedPrefill(prefillValue);
      // Focus after value set
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [prefillValue, lastAppliedPrefill]);

  // Handle scroll to collapse/expand footer
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Collapse when scrolling up and no input value
      if (currentScrollY < lastScrollY && !value.trim()) {
        setIsCollapsed(true);
      } 
      // Expand when scrolling down or when there's input
      else if (currentScrollY > lastScrollY || value.trim()) {
        setIsCollapsed(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, value]);

  const handleSubmit = async () => {
    const raw = value.trim();
    if (!raw || submitting) return;
    
    console.log('🔘 PillQuickPauseBar handleSubmit called with:', raw);
    
    // Check usage limit before proceeding
    if (!usageLimit.checkUsageLimit()) {
      console.log('🚫 Usage limit reached');
      return;
    }
    
    console.log('✅ Usage limit check passed, proceeding...');
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

      // Call callback if URL was entered
      if (isProbablyUrl(raw) && onUrlEntry) {
        onUrlEntry();
      }

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
    console.log('📱 PillQuickPauseBar received barcode:', barcode);
    
    try {
      console.log('🔄 Starting product lookup...');
      const productInfo = await lookupProductByBarcode(barcode);
      console.log('📦 Product lookup result:', productInfo);
      
      // Set the scanned product as the value
      const displayName = productInfo.itemName || `Scanned Item ${barcode.slice(-4)}`;
      console.log('✅ Setting value to:', displayName);
      setValue(displayName);
      
      if (compact && onExpandRequest) {
        console.log('📏 Expanding from compact mode');
        onExpandRequest();
      }
      
      // Call barcode scanned callback
      if (onBarcodeScanned) {
        onBarcodeScanned();
      }
      
      toast({
        title: "Barcode scanned!",
        description: `Found: ${displayName}`,
      });
    } catch (error) {
      console.error('❌ Error in handleBarcodeScanned:', error);
      toast({
        title: "Scan failed",
        description: "Please try scanning again",
        variant: "destructive"
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
                // Expand when user starts typing/pasting content
                if (compact && onExpandRequest && v.trim().length > 0) {
                  onExpandRequest();
                }
              }}
              onFocus={() => {
                // Expand when input is focused and there's content
                if (compact && onExpandRequest && (value.trim().length > 0 || prefillValue)) {
                  onExpandRequest();
                }
              }}
              onPaste={() => {
                // Expand immediately on paste
                if (compact && onExpandRequest) {
                  setTimeout(() => onExpandRequest(), 10); // Small delay to allow paste to complete
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
        <div className="mt-3">
          {/* Temporarily commented out duration selector for launch */}
          {/* <div className="mb-3 grid grid-cols-5 gap-2">
            {DURATION_PRESETS.map((d) => {
              const isPremiumDuration = d.isPremium && !isPremiumUser();
              const isSelected = duration === d.key;
              
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => {
                    if (d.isPremium && !isPremiumUser()) {
                      setPendingPremiumDuration(d.label);
                      setShowPremiumDurationModal(true);
                    } else {
                      setDuration(d.key);
                    }
                  }}
                  aria-pressed={isSelected}
                  className={
                    `flex-1 h-10 rounded-full border text-sm transition-colors relative ${
                      isPremiumDuration ? 'opacity-60' : ''
                    } ` +
                    (isSelected
                      ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted')
                }
                >
                  {d.label}
                </button>
                );
            })}
          </div> */}
          
          {/* Show pause button when expanded OR when collapsed but there's input */}
          {(!isCollapsed || value.trim()) && (
            <Button 
              onClick={(e) => {
                console.log('🔥 PAUSE BUTTON CLICKED in PillQuickPauseBar!', e);
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }} 
              disabled={!value.trim() || submitting} 
              size="xl" 
              shape="pill" 
              className="w-full"
              style={{ 
                position: 'relative',
                zIndex: 9999,
                pointerEvents: 'auto',
                touchAction: 'manipulation'
              }}
            >
              {submitting ? 'Pausing…' : 'Pause for 24 hours'}
            </Button>
          )}
        </div>
      )}
      
      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScanned}
      />
      
      {/* Premium Duration Modal */}
      <PremiumDurationModal
        isOpen={showPremiumDurationModal}
        onClose={() => setShowPremiumDurationModal(false)}
        onSignUp={() => {
          setShowPremiumDurationModal(false);
          // You can add navigation to signup here
          toast({
            title: "Feature coming soon",
            description: "Premium subscriptions will be available soon!",
          });
        }}
        selectedDuration={pendingPremiumDuration}
      />
    </div>
  );
};

export default PillQuickPauseBar;
