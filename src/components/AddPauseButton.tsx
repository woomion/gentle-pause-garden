import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { parseProductUrl } from '../utils/urlParser';
import { useIsMobile } from '../hooks/use-mobile';
import { X, Edit, Scan, ExternalLink } from 'lucide-react';
import FirstUseTooltip from './FirstUseTooltip';
import ClipboardButton from './ClipboardButton';
import ShareButton from './ShareButton';
import { ItemFeedbackModal } from './ItemFeedbackModal';
import BarcodeScanner from './BarcodeScanner';
import { lookupProductByBarcode } from '../utils/productLookup';
import { rulesStore } from '@/utils/parsingRulesStore';

interface AddPauseButtonProps {
  onAddPause: (parsedData?: any) => void;
  isCompact?: boolean;
}

export interface AddPauseButtonRef {
  clearUrl: () => void;
}

const AddPauseButton = forwardRef<AddPauseButtonRef, AddPauseButtonProps>(({ onAddPause, isCompact = false }, ref) => {
  const [showRipple, setShowRipple] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [url, setUrl] = useState('');
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [showFirstUseTooltip, setShowFirstUseTooltip] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  // Initialize rules store and check first time user
  useEffect(() => {
    rulesStore.initialize();
    
    const hasEverPaused = localStorage.getItem('pausedItems') || localStorage.getItem('hasSeenFirstUseTooltip');
    if (!hasEverPaused) {
      setShowFirstUseTooltip(true);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100); // Compact after scrolling 100px
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUrlChange = async (value: string) => {
    setUrl(value);
    console.log('URL input changed:', value);
    
    // Dismiss tooltip when user starts typing
    if (showFirstUseTooltip && value.trim()) {
      setShowFirstUseTooltip(false);
      localStorage.setItem('hasSeenFirstUseTooltip', 'true');
    }
    
    // Clear any existing timeout
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }
    
    if (value.trim() && (value.includes('http') || value.includes('www.'))) {
      console.log('Detected URL, starting parse...');
      // This looks like a URL - parse it with debounce
      setIsParsingUrl(true);
      parseTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('🔍 DEBUG: Calling parseProductUrl with URL:', value);
          console.log('🔍 DEBUG: URL contains shopbop?', value.toLowerCase().includes('shopbop'));
          const productInfo = await parseProductUrl(value);
          console.log('🔍 DEBUG: Parse result from parseProductUrl:', JSON.stringify(productInfo, null, 2));
          
          const parsedData = {
            itemName: productInfo.itemName,
            storeName: productInfo.storeName,
            price: productInfo.price,
            imageUrl: productInfo.imageUrl,
            link: value
          };
          console.log('Setting parsed data:', parsedData);
          setParsedData(parsedData);
        } catch (error) {
          console.error('Error parsing URL:', error);
          setParsedData({
            itemName: '',
            storeName: '',
            price: '',
            imageUrl: '',
            link: value
          });
        } finally {
          setIsParsingUrl(false);
        }
      }, 300); // 300ms debounce
    } else {
      console.log('Not a URL, clearing parsed data');
      setIsParsingUrl(false);
      setParsedData(null);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    console.log('🔘 Add to Pause button clicked');
    console.log('🔘 Current URL:', url);
    console.log('🔘 Current parsed data:', parsedData);
    
    // Dismiss first use tooltip if showing
    if (showFirstUseTooltip) {
      setShowFirstUseTooltip(false);
      localStorage.setItem('hasSeenFirstUseTooltip', 'true');
    }
    
    // Stop any ongoing parsing
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
      setIsParsingUrl(false);
    }
    
    setShowRipple(true);
    
    // Reset ripple after animation
    setTimeout(() => setShowRipple(false), 600);
    
    // If we have a URL but no parsed data yet, try to parse it immediately
    if (url.trim() && (url.includes('http') || url.includes('www.')) && !parsedData) {
      console.log('No parsed data yet, attempting immediate parse...');
      try {
        const productInfo = await parseProductUrl(url);
        const immediateData = {
          itemName: productInfo.itemName,
          storeName: productInfo.storeName,
          price: productInfo.price,
          imageUrl: productInfo.imageUrl,
          link: url
        };
        console.log('Immediate parse result:', immediateData);
        onAddPause(immediateData);
        return;
      } catch (error) {
        console.error('Immediate parse failed:', error);
        // Fall back to passing just the URL
        onAddPause({ link: url.trim() });
        return;
      }
    }
    
    // Pass parsed data if available, otherwise just the URL
    const dataToPass = parsedData || (url.trim() ? { link: url.trim() } : {});
    console.log('Passing data to form:', dataToPass);
    onAddPause(dataToPass);
  };

  const handleClearUrl = () => {
    setUrl('');
    setParsedData(null);
    setIsParsingUrl(false);
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    
    try {
      const productInfo = await lookupProductByBarcode(barcode);
      
      const barcodeData = {
        itemName: productInfo.itemName,
        storeName: productInfo.storeName || '',
        price: productInfo.price || '',
        imageUrl: productInfo.imageUrl || '',
        link: '', // No direct link for scanned items
        isScannedItem: true // Flag to show search option
      };
      
      console.log('Product lookup result:', barcodeData);
      setParsedData(barcodeData);
      setUrl(''); // Clear URL since this is a scanned item
    } catch (error) {
      console.error('Error looking up product:', error);
      // Set basic data with barcode
      setParsedData({
        itemName: `Scanned Item ${barcode.slice(-4)}`,
        storeName: '',
        price: '',
        imageUrl: '',
        link: '',
        isScannedItem: true
      });
    }
  };

  const handleViewItem = () => {
    if (parsedData?.itemName) {
      const searchQuery = encodeURIComponent(
        `${parsedData.itemName}${parsedData.storeName ? ` ${parsedData.storeName}` : ''}`
      );
      const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
      window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Expose the clear function to parent via ref
  useImperativeHandle(ref, () => ({
    clearUrl: handleClearUrl
  }));

  // On mobile, only use isCompact prop (My Pauses toggle), ignore scroll
  // On desktop, use scroll behavior
  const shouldBeCompact = isMobile ? isCompact : (isCompact || isScrolled);

  return (
    <div 
      className={`relative w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 transition-all duration-300 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg rounded-2xl ${
        shouldBeCompact 
          ? 'py-4 sm:py-3' 
          : 'py-6 sm:py-8'
      }`}
      style={{ zIndex: 9999, position: 'relative' }}
      onClick={() => console.log('🔥 CONTAINER CLICKED')}
    >
      {/* URL Input Field with action buttons */}
      <div className="mb-4 relative">
        <FirstUseTooltip 
          show={showFirstUseTooltip} 
          onDismiss={() => {
            setShowFirstUseTooltip(false);
            localStorage.setItem('hasSeenFirstUseTooltip', 'true');
          }} 
        />
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste a product URL"
              className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-white/20 bg-white/10 text-primary-foreground placeholder-primary-foreground/60 focus:outline-none focus:border-white/40 transition-colors"
            />
            {url && (
              <button
                onClick={handleClearUrl}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
                type="button"
              >
                <X size={16} className="text-primary-foreground/60" />
              </button>
            )}
          </div>
          
          {/* Action buttons */}
          <ClipboardButton onUrlPasted={handleUrlChange} />
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="flex items-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-xl border-2 border-white/20 hover:border-white/40 transition-colors whitespace-nowrap"
            title="Scan Barcode"
          >
            <Scan size={20} className="text-primary-foreground" />
            <span className="text-sm text-primary-foreground hidden sm:inline">Scan</span>
          </button>
          {url && <ShareButton url={url} text={parsedData?.itemName} />}
        </div>
        
        {isParsingUrl && (
          <div className="mt-2 text-sm text-primary-foreground/70">
            Parsing product details...
          </div>
        )}
        {parsedData && (
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-primary-foreground/70">
              Found: {parsedData.itemName || 'Product'}{parsedData.storeName ? ` from ${parsedData.storeName}` : ''}
            </div>
            <div className="flex items-center gap-1">
              {(parsedData as any)?.isScannedItem && (
                <button
                  onClick={handleViewItem}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors text-primary-foreground/60 hover:text-primary-foreground"
                  title="Search for this item"
                >
                  <ExternalLink size={14} />
                </button>
              )}
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="p-1 hover:bg-white/20 rounded-md transition-colors text-primary-foreground/60 hover:text-primary-foreground"
                title="Fix Details"
              >
                <Edit size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add to Pause Button */}
      <button
        onClick={(e) => {
          console.log('🔥 BUTTON CLICKED!', e);
          e.preventDefault();
          e.stopPropagation();
          handleClick();
        }}
        onPointerDown={(e) => console.log('🔥 POINTER DOWN', e)}
        onTouchStart={(e) => console.log('🔥 TOUCH START', e)}
        disabled={false}
        className="relative w-full bg-white/20 hover:bg-white/30 text-primary-foreground font-medium py-4 rounded-xl transition-colors cursor-pointer"
        style={{ 
          position: 'relative',
          zIndex: 9999,
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        {/* Ripple effect */}
        {showRipple && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 bg-primary/30 rounded-full animate-ripple"></div>
          </div>
        )}
        
        + Add to Pause
      </button>

      {/* Feedback Modal */}
      <ItemFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        originalUrl={url}
        originalData={parsedData}
        onSave={(correctedData) => {
          setParsedData(correctedData);
        }}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
});

AddPauseButton.displayName = 'AddPauseButton';

export default AddPauseButton;