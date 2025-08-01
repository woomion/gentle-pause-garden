import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { parseProductUrl } from '../utils/urlParser';
import { useIsMobile } from '../hooks/use-mobile';
import { X, Clipboard } from 'lucide-react';

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
  const [clipboardUrl, setClipboardUrl] = useState<string>('');
  const [showClipboardSuggestion, setShowClipboardSuggestion] = useState(false);
  const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

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
          console.log('Calling parseProductUrl with:', value);
          const productInfo = await parseProductUrl(value);
          console.log('Parse result:', productInfo);
          
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

  // Check clipboard for URLs when component mounts or becomes visible
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        // Check if clipboard API is available and we have permission
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          return;
        }

        const clipboardText = await navigator.clipboard.readText();
        
        // Check if clipboard contains a URL
        if (clipboardText && isValidUrl(clipboardText) && !url) {
          setClipboardUrl(clipboardText);
          setShowClipboardSuggestion(true);
        }
      } catch (error) {
        // Silently fail if clipboard permission is denied
        console.log('Clipboard access not available or denied');
      }
    };

    // Check clipboard when component mounts
    checkClipboard();
  }, [url]);

  // Helper function to validate URLs
  const isValidUrl = (text: string): boolean => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(text.trim()) && (text.includes('http') || text.includes('www.') || text.includes('.com') || text.includes('.net') || text.includes('.org'));
  };

  // Handle using clipboard URL
  const handleUseClipboardUrl = () => {
    setUrl(clipboardUrl);
    setShowClipboardSuggestion(false);
    handleUrlChange(clipboardUrl);
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
    console.log('Add to Pause clicked');
    
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

  // Expose the clear function to parent via ref
  useImperativeHandle(ref, () => ({
    clearUrl: handleClearUrl
  }));

  // On mobile, only use isCompact prop (My Pauses toggle), ignore scroll
  // On desktop, use scroll behavior
  const shouldBeCompact = isMobile ? isCompact : (isCompact || isScrolled);

  return (
    <div className={`relative w-full bg-lavender hover:bg-lavender-hover text-dark-gray font-medium px-6 transition-all duration-300 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg rounded-2xl ${
      shouldBeCompact 
        ? 'py-4 sm:py-3' 
        : 'py-6 sm:py-8'
    }`}>
      {/* URL Input Field */}
      <div className="mb-4 relative">
        <input
          type="text"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="Paste a product URL"
          className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-white/20 bg-white/10 text-dark-gray placeholder-dark-gray/60 focus:outline-none focus:border-white/40 transition-colors"
        />
        {url && (
          <button
            onClick={handleClearUrl}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
            type="button"
          >
            <X size={16} className="text-dark-gray/60" />
          </button>
        )}
        {isParsingUrl && (
          <div className="mt-2 text-sm text-dark-gray/70">
            Parsing product details...
          </div>
        )}
        {parsedData && (
          <div className="mt-2 text-sm text-dark-gray/70">
            Found: {parsedData.itemName || 'Product'}{parsedData.storeName ? ` from ${parsedData.storeName}` : ''}
          </div>
        )}
      </div>

      {/* Clipboard Suggestion */}
      {showClipboardSuggestion && !url && (
        <div className="mb-4 p-3 bg-white/10 rounded-xl border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-dark-gray/80">
              <Clipboard size={16} />
              <span>Found link in clipboard</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUseClipboardUrl}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-dark-gray text-sm rounded-lg transition-colors"
              >
                Use it
              </button>
              <button
                onClick={() => setShowClipboardSuggestion(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={14} className="text-dark-gray/60" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-dark-gray/60 truncate">
            {clipboardUrl}
          </div>
        </div>
      )}

      {/* Add to Pause Button */}
      <button
        onClick={handleClick}
        className="relative w-full bg-white/20 hover:bg-white/30 text-dark-gray font-medium py-4 rounded-xl transition-colors"
      >
        {/* Ripple effect */}
        {showRipple && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 bg-primary/30 rounded-full animate-ripple"></div>
          </div>
        )}
        
        + Add to Pause
      </button>
    </div>
  );
});

AddPauseButton.displayName = 'AddPauseButton';

export default AddPauseButton;