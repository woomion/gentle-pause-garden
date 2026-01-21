import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Scan } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { parseProductUrl } from "@/utils/urlParser";
import { extractStoreName } from "@/utils/pausedItemsUtils";
import { triggerProcessingHaptic, triggerSuccessHaptic } from "@/utils/hapticUtils";

const isProbablyUrl = (text: string) => {
  const t = text.trim();
  if (/^(https?:\/\/|www\.)/i.test(t)) return true;
  if (!/^\S+$/.test(t)) return false;
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

const GetApp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to main app
    if (user) {
      navigate('/', { replace: true });
      return;
    }

    // SEO
    document.title = "Pocket Pause - A little space before you buy";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = "Paste a link. Pause. Review later. Simple mindful spending app.";
  }, [user, navigate]);

  const handleSubmit = async () => {
    const raw = value.trim();
    if (!raw || submitting) return;
    
    triggerProcessingHaptic();
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
          const parsed = await parseProductUrl(url);
          if (parsed?.itemName) {
            itemName = parsed.itemName;
          } else {
            const ft = getFallbackTitleFromUrl(url);
            if (ft) itemName = ft;
          }
          if (parsed?.storeName) storeName = parsed.storeName; 
          else storeName = extractStoreName(url);
          if (parsed?.price) price = parsed.price;
          if (parsed?.imageUrl) imageUrl = parsed.imageUrl;
        } catch {
          storeName = extractStoreName(url);
          const ft = getFallbackTitleFromUrl(url);
          if (ft) itemName = ft;
        }
      }

      // Store the pending item for the guest flow
      const pendingItem = {
        itemName,
        storeName,
        price: price ?? '',
        link,
        imageUrl,
        duration: '24 hours',
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem('pendingPauseItem', JSON.stringify(pendingItem));
      
      triggerSuccessHaptic();
      
      // Navigate directly to the app - signup prompt will show there
      navigate('/');
    } catch (e) {
      console.error('Failed to process item', e);
      toast({ title: 'Error', description: 'Could not process item', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const { lookupProductByBarcode } = await import('@/utils/productLookup');
      const productInfo = await lookupProductByBarcode(barcode);
      const displayName = productInfo.itemName || `Scanned Item ${barcode.slice(-4)}`;
      setValue(displayName);
      
      toast({
        title: "Barcode scanned!",
        description: `Found: ${displayName}`,
      });
    } catch (error) {
      console.error('Error in handleBarcodeScanned:', error);
      toast({
        title: "Scan failed",
        description: "Please try scanning again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      {/* Main hero - vertically and horizontally centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto space-y-8 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/1358c375-933c-4b12-9b1e-e3b852c396df.png" 
              alt="Pocket Pause" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl shadow-lg"
            />
          </div>
          
          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-inter">
              Pocket Pause
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground font-domine italic">
              A little space before you buy
            </p>
          </div>

          {/* Input area - matching app style */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Paste a link..."
                  className="h-14 rounded-full text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                />
              </div>
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="h-14 px-4 bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/20 hover:border-primary/40 transition-colors flex items-center gap-2"
                title="Scan Barcode"
              >
                <Scan size={20} className="text-primary" />
                <span className="text-sm text-primary hidden sm:inline">Scan</span>
              </button>
            </div>
            
            {/* Pause button appears when there's input */}
            {value.trim() && (
              <Button 
                onClick={handleSubmit} 
                disabled={!value.trim() || submitting} 
                size="xl"
                className="w-full h-14 rounded-full text-base"
              >
                {submitting ? 'Processing…' : 'Pause for 24 hours'}
              </Button>
            )}
          </div>

          {/* Subtle explanation */}
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Drop something you're thinking about buying. We'll hold it for a day so you can decide with clarity.
          </p>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          Mindful spending, one pause at a time
        </p>
      </footer>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
};

export default GetApp;
