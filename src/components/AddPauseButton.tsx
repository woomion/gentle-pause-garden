import { useState, useEffect } from 'react';
import { parseProductUrl } from '../utils/urlParser';

interface AddPauseButtonProps {
  onAddPause: (parsedData?: any) => void;
  isCompact?: boolean;
}

const AddPauseButton = ({ onAddPause, isCompact = false }: AddPauseButtonProps) => {
  const [showRipple, setShowRipple] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [url, setUrl] = useState('');
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

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
    
    if (value.trim()) {
      if (value.includes('http') || value.includes('www.')) {
        // This looks like a URL - parse it
        setIsParsingUrl(true);
        try {
          const productInfo = await parseProductUrl(value);
          setParsedData({
            itemName: productInfo.itemName,
            storeName: productInfo.storeName,
            price: productInfo.price,
            imageUrl: productInfo.imageUrl,
            link: value
          });
        } catch (error) {
          console.error('Error parsing URL:', error);
          setParsedData(null);
        } finally {
          setIsParsingUrl(false);
        }
      } else {
        // This looks like a manual item name
        setParsedData({
          itemName: value,
          storeName: '',
          price: '',
          imageUrl: '',
          link: ''
        });
      }
    } else {
      setParsedData(null);
    }
  };

  const handleClick = () => {
    setShowRipple(true);
    
    // Reset ripple after animation
    setTimeout(() => setShowRipple(false), 600);
    
    // Pass parsed data if available
    onAddPause(parsedData || { link: url.trim() || undefined });
  };

  // Determine if button should be compact
  const shouldBeCompact = isCompact || isScrolled;

  return (
    <div className={`relative w-full bg-lavender hover:bg-lavender-hover text-dark-gray font-medium px-6 transition-all duration-300 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg rounded-2xl ${
      shouldBeCompact 
        ? 'py-4 sm:py-3' 
        : 'py-6 sm:py-8'
    }`}>
      {/* URL Input Field */}
      <div className="mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="Paste a product link or describe what you're pausing"
          className="w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-white/10 text-dark-gray placeholder-dark-gray/60 focus:outline-none focus:border-white/40 transition-colors"
        />
        {isParsingUrl && (
          <div className="mt-2 text-sm text-dark-gray/70">
            Parsing product details...
          </div>
        )}
        {parsedData && (
          <div className="mt-2 text-sm text-dark-gray/70">
            {parsedData.link ? 
              `Found: ${parsedData.itemName || 'Product'}${parsedData.storeName ? ` from ${parsedData.storeName}` : ''}` :
              `Ready to pause: ${parsedData.itemName}`
            }
          </div>
        )}
      </div>

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
};

export default AddPauseButton;