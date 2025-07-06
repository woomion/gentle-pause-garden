
import { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { parseProductUrl } from '../utils/urlParser';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { TagInput } from '@/components/ui/tag-input';
import { getEmotionColor } from '@/utils/emotionColors';

interface PauseFormProps {
  onClose: () => void;
  onShowSignup?: () => void;
  signupModalDismissed?: boolean;
}

const emotions = [
  { name: 'bored' },
  { name: 'overwhelmed' },
  { name: 'burnt out' },
  { name: 'sad' },
  { name: 'inspired' },
  { name: 'deserving' },
  { name: 'curious' },
  { name: 'anxious' },
  { name: 'lonely' },
  { name: 'celebratory' },
  { name: 'resentful' },
  { name: 'something else' }
];

const otherPauseLengths = [
  '2 weeks',
  '1 month',
  '3 months'
];

const PauseForm = ({ onClose, onShowSignup, signupModalDismissed = false }: PauseFormProps) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    link: '',
    itemName: '',
    storeName: '',
    price: '',
    photo: null as File | null,
    emotion: '',
    notes: '',
    duration: '',
    otherDuration: '',
    imageUrl: '', // Add imageUrl to track parsed images
    tags: [] as string[],
    isCart: false,
    itemType: 'item' as 'item' | 'cart'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const extractCartPrice = async (url: string): Promise<string | null> => {
    try {
      // Attempt to fetch the page content
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PocketPause/1.0)'
        }
      });
      
      if (!response.ok) return null;
      
      const text = await response.text();
      
      // Common patterns for cart totals/subtotals
      const pricePatterns = [
        /(?:total|subtotal|grand.?total)[:\s]*\$?([0-9]+(?:\.[0-9]{2})?)/gi,
        /\$([0-9]+(?:\.[0-9]{2})?)\s*(?:total|subtotal)/gi,
        /"totalPrice"[:\s]*"?\$?([0-9]+(?:\.[0-9]{2})?)["']?/gi,
        /"subtotal"[:\s]*"?\$?([0-9]+(?:\.[0-9]{2})?)["']?/gi,
        /data-total[=:"'\s]*\$?([0-9]+(?:\.[0-9]{2})?)/gi
      ];
      
      for (const pattern of pricePatterns) {
        const matches = text.match(pattern);
        if (matches) {
          // Extract numeric value from the first match
          const numericMatch = matches[0].match(/([0-9]+(?:\.[0-9]{2})?)/);
          if (numericMatch) {
            return numericMatch[1];
          }
        }
      }
      
      return null;
    } catch (error) {
      console.log('Price extraction failed (gracefully):', error);
      return null;
    }
  };

  const handleLinkChange = async (value: string) => {
    setFormData(prev => ({ ...prev, link: value }));
    
    // Check if the value looks like a URL
    if (value && (value.startsWith('http://') || value.startsWith('https://') || value.includes('.'))) {
      setIsParsingUrl(true);
      
      try {
        // Try regular product parsing first
        const productInfo = await parseProductUrl(value);
        console.log('Parsed product info:', productInfo);
        
        // If cart mode and no price found, try cart price extraction
        let cartPrice = null;
        if (formData.isCart && !productInfo.price) {
          console.log('Attempting cart price extraction...');
          cartPrice = await extractCartPrice(value);
          if (cartPrice) {
            console.log('Found cart total price:', cartPrice);
          }
        }
        
        // Only update fields that are currently empty and we found data for
        setFormData(prev => ({
          ...prev,
          itemName: prev.itemName || productInfo.itemName || prev.itemName,
          storeName: prev.storeName || productInfo.storeName || prev.storeName,
          price: prev.price || cartPrice || productInfo.price || prev.price,
          imageUrl: prev.imageUrl || productInfo.imageUrl || prev.imageUrl,
        }));
        
        // Log the image URL for debugging
        if (productInfo.imageUrl) {
          console.log('Found product image:', productInfo.imageUrl);
        }
        
      } catch (error) {
        console.error('Error parsing product URL:', error);
      } finally {
        setIsParsingUrl(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, photo: file }));
    
    // Create preview URL for the uploaded photo
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      console.log('Photo selected for upload:', file.name, file.size);
    } else {
      setPhotoPreview(null);
    }
  };

  // Load existing tags and clean up preview URL when component unmounts
  useEffect(() => {
    const loadExistingTags = async () => {
      if (user) {
        const items = supabasePausedItemsStore.getItems();
        const allTags = items.flatMap(item => item.tags || []);
        const uniqueTags = Array.from(new Set(allTags));
        setExistingTags(uniqueTags);
      } else {
        const items = pausedItemsStore.getItems();
        const allTags = items.flatMap(item => item.tags || []);
        const uniqueTags = Array.from(new Set(allTags));
        setExistingTags(uniqueTags);
      }
    };
    
    loadExistingTags();
    
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview, user]);

  const handleDurationSelect = (duration: string) => {
    setFormData(prev => ({ 
      ...prev, 
      duration: duration,
      otherDuration: '' // Clear dropdown selection
    }));
  };

  const handleOtherDurationSelect = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      otherDuration: value,
      duration: '' // Clear button selection
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Show ripple effect for 1 second
    setTimeout(async () => {
      console.log('Pause item data:', formData);
      
      const itemData = {
        itemName: formData.itemName || 'Unnamed Item',
        storeName: formData.storeName || 'Unknown Store',
        price: formData.price || '0',
        emotion: formData.emotion,
        notes: formData.notes,
        duration: formData.duration,
        otherDuration: formData.otherDuration,
        link: formData.link,
        photo: formData.photo,
        imageUrl: formData.imageUrl, // Include parsed image URL
        tags: formData.tags,
        isCart: formData.isCart,
        itemType: formData.itemType
      };

      // Use appropriate store based on authentication status
      if (user) {
        console.log('Uploading to Supabase with photo:', !!formData.photo);
        await supabasePausedItemsStore.addItem(itemData);
      } else {
        pausedItemsStore.addItem(itemData);
      }
      
      setIsSubmitting(false);
      onClose();
      
      // Only show signup modal if user is not authenticated AND hasn't dismissed it
      if (!user && !signupModalDismissed && onShowSignup) {
        onShowSignup();
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-cream dark:bg-[#200E3B] z-50 overflow-y-auto transition-colors duration-300">
      <div className="min-h-screen px-6 py-8">
        {/* Header */}
        <header className="relative mb-8">
          <div className="text-center">
            <div className="text-black dark:text-[#F9F5EB] font-medium text-lg tracking-wide mb-2">
              POCKET || PAUSE
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-0 p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
          >
            <X size={24} />
          </button>
        </header>

        {/* Form */}
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-semibold text-dark-gray dark:text-[#F9F5EB] text-center mb-8">
            Add Something to Pause
          </h1>

          {/* Guest mode banner */}
          {!user && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
              <p className="text-amber-800 dark:text-amber-200 text-sm text-center">
                <strong>Guest Mode:</strong> Your paused items will be stored locally and won't sync across devices. 
                {!signupModalDismissed && (
                  <button 
                    onClick={onShowSignup}
                    className="underline hover:no-underline ml-1"
                  >
                    Sign up to sync!
                  </button>
                )}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Link Field */}
            <div className="space-y-1">
              <Label htmlFor="link" className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base">
                Link (paste a product URL)
              </Label>
              <div className="relative">
                <Input
                  id="link"
                  type="url"
                  placeholder="www.example.com/item"
                  value={formData.link}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  className="bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 placeholder:font-normal text-base dark:text-[#F9F5EB]"
                />
                {isParsingUrl && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-lavender border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {formData.imageUrl && !formData.photo && (
                <div className="mt-2">
                  <p className="text-sm text-green-600 dark:text-green-400">✓ Found product image automatically</p>
                </div>
              )}
            </div>

            {/* Cart Checkbox */}
            <div className="flex items-center space-x-3 -mt-2 mb-4">
              <Checkbox
                id="isCart"
                checked={formData.isCart}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true;
                  setFormData(prev => ({ 
                    ...prev, 
                    isCart: isChecked,
                    itemType: isChecked ? 'cart' : 'item',
                    itemName: isChecked && !prev.itemName ? 'Cart' : prev.itemName,
                    imageUrl: isChecked && !prev.imageUrl && !prev.photo ? 'cart-placeholder' : prev.imageUrl
                  }));
                }}
                className="h-5 w-5"
              />
              <Label htmlFor="isCart" className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base cursor-pointer">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} />
                  Mark as Cart (saving multiple items)
                </div>
              </Label>
            </div>

            {/* Item Name Field */}
            <div className="space-y-1">
              <Label htmlFor="itemName" className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base">
                Item Name
              </Label>
              <Input
                id="itemName"
                type="text"
                placeholder="What are you thinking of buying?"
                value={formData.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                className="bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 placeholder:font-normal text-base dark:text-[#F9F5EB]"
              />
            </div>

            {/* Store Name Field */}
            <div className="space-y-1">
              <Label htmlFor="storeName" className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base">
                Store Name
              </Label>
              <Input
                id="storeName"
                type="text"
                placeholder="Where is this item from?"
                value={formData.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                className="bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 placeholder:font-normal text-base dark:text-[#F9F5EB]"
              />
            </div>

            {/* Price Field */}
            <div className="space-y-1">
              <Label htmlFor="price" className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 placeholder:font-normal text-base dark:text-[#F9F5EB]"
              />
            </div>

            {/* Photo Upload Field */}
            <div className="space-y-1">
              <Label htmlFor="photo" className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base">
                Photo (optional)
              </Label>
              
              {(formData.imageUrl && !formData.photo) || (formData.isCart && formData.imageUrl === 'cart-placeholder') ? (
                <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                  {formData.isCart && formData.imageUrl === 'cart-placeholder' ? (
                    <div className="flex flex-col items-center gap-2 mb-3">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <ShoppingCart size={24} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        🛒 Cart placeholder image
                      </p>
                    </div>
                  ) : (
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                      ✓ Product image already grabbed automatically
                    </p>
                  )}
                  <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                    You can still upload a different photo if you prefer
                  </p>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 dark:text-gray-300 mt-2
                               file:py-2 file:px-4
                               file:rounded-lg file:border-0
                               file:text-sm file:font-medium
                               file:bg-green-100 file:text-green-700
                               hover:file:bg-green-200 dark:file:bg-green-800 dark:file:text-green-200
                               rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10 h-10
                               overflow-hidden"
                  />
                </div>
              ) : (
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 dark:text-gray-300
                             file:py-2 file:px-4
                             file:rounded-xl file:border-0
                             file:text-sm file:font-medium
                             file:bg-lavender file:text-dark-gray
                             hover:file:bg-lavender/90
                             rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-white/10 h-12
                             overflow-hidden"
                />
              )}
              
              {photoPreview && (
                <div className="mt-2">
                  <img 
                    src={photoPreview} 
                    alt="Photo preview" 
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">✓ Photo ready to upload</p>
                </div>
              )}
            </div>

            {/* Emotion Selection */}
            <div className="space-y-1">
              <Label className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base">
                How are you feeling right now?
              </Label>
              <Select value={formData.emotion} onValueChange={(value) => handleInputChange('emotion', value)}>
                <SelectTrigger className="bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 dark:text-[#F9F5EB]">
                  <SelectValue placeholder="Select emotion" className="placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 placeholder:font-normal text-base" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-xl max-h-60 overflow-y-auto">
                  {emotions.map((emotion) => (
                    <SelectItem key={emotion.name} value={emotion.name} className="rounded-lg my-1 dark:text-[#F9F5EB] dark:focus:bg-white/10">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getEmotionColor(emotion.name, isDarkMode) }}
                        />
                        <span className="capitalize">{emotion.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags Field */}
            <div className="space-y-1">
              <Label className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base">
                Tags (optional)
              </Label>
            <TagInput
              value={formData.tags}
              onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              placeholder="Add tags like 'apartment', 'clothes', 'fall wardrobe'..."
              suggestions={existingTags}
              className="w-full"
            />
            </div>

            {/* Notes Field */}
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Why do you want this item?"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 min-h-[80px] resize-none placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 placeholder:font-normal text-base dark:text-[#F9F5EB]"
              />
            </div>

            {/* Pause Duration */}
            <div className="space-y-2">
              <Label className="text-dark-gray dark:text-[#F9F5EB] font-medium text-base">
                Pause for
              </Label>
              
              {/* Row of three buttons */}
              <div className="grid grid-cols-3 gap-2">
                {['24 hours', '3 days', '1 week'].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => handleDurationSelect(duration)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all text-sm ${
                      formData.duration === duration
                        ? 'bg-lavender border-lavender text-dark-gray'
                        : 'bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-dark-gray dark:text-[#F9F5EB] hover:border-lavender/50'
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
              
              {/* Other pause lengths dropdown */}
              <Select 
                value={formData.otherDuration} 
                onValueChange={handleOtherDurationSelect}
              >
                <SelectTrigger className={`bg-white dark:bg-white/10 border-2 rounded-xl py-3 px-4 transition-all dark:text-[#F9F5EB] ${
                  formData.otherDuration ? 'border-lavender bg-lavender dark:bg-lavender text-dark-gray' : 'border-gray-200 dark:border-gray-600 hover:border-lavender/50'
                }`}>
                  <SelectValue placeholder="Other pause lengths" className="placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 placeholder:font-normal text-base" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-xl">
                  {otherPauseLengths.map((duration) => (
                    <SelectItem key={duration} value={duration} className="rounded-lg my-1 dark:text-[#F9F5EB] dark:focus:bg-white/10">
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-dark-gray dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20 rounded-xl py-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 bg-lavender text-dark-gray hover:bg-lavender/90 rounded-xl py-3 relative overflow-hidden ${
                  isSubmitting ? 'pointer-events-none' : ''
                }`}
              >
                {isSubmitting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-dark-gray/20 rounded-full animate-ripple"></div>
                  </div>
                )}
                Start Pause
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs space-y-1" style={{ color: '#A6A1AD' }}>
          <p>|| Pocket Pause—your conscious spending companion</p>
          <div className="flex justify-center gap-4">
            <button className="hover:text-taupe transition-colors">Privacy Policy</button>
            <button className="hover:text-taupe transition-colors">About</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauseForm;
