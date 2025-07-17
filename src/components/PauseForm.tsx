
import { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import confetti from 'canvas-confetti';
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

import { TagInput } from '@/components/ui/tag-input';
import { getEmotionColor } from '@/utils/emotionColors';
import PartnerSharingSection from './PartnerSharingSection';

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
  
  const [showReflectiveBackground, setShowReflectiveBackground] = useState(false);
  
  // Form background transition effect
  useEffect(() => {
    console.log('PauseForm mounted - Starting background transition');
    
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setShowReflectiveBackground(true);
    }, 100);
    
    return () => {
      console.log('PauseForm unmounted - Cleaning up');
      clearTimeout(timer);
    };
  }, []);
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
    itemType: 'item' as 'item' | 'cart',
    sharedWithPartners: [] as string[],
    usePlaceholder: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<'pause' | 'details'>('pause');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If the user manually edits a field that was auto-filled, remove it from tracking
    if (autoFilledFields.has(field)) {
      setAutoFilledFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
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
      return null;
    }
  };

  const handleLinkChange = async (value: string) => {
    setFormData(prev => ({ ...prev, link: value }));
    
    // If URL is cleared, clear all auto-filled fields
    if (!value || value.trim() === '') {
      const fieldsToReset: any = {};
      
      // Clear auto-filled fields
      if (autoFilledFields.has('itemName')) {
        fieldsToReset.itemName = '';
      }
      if (autoFilledFields.has('storeName')) {
        fieldsToReset.storeName = '';
      }
      if (autoFilledFields.has('price')) {
        fieldsToReset.price = '';
      }
      if (autoFilledFields.has('imageUrl')) {
        fieldsToReset.imageUrl = '';
      }
      
      // Update form data if we have fields to reset
      if (Object.keys(fieldsToReset).length > 0) {
        setFormData(prev => ({ ...prev, ...fieldsToReset }));
      }
      
      // Clear the auto-filled fields tracking
      setAutoFilledFields(new Set());
      return;
    }
    
    // Check if the value looks like a URL
    if (value && (value.startsWith('http://') || value.startsWith('https://') || value.includes('.'))) {
      setIsParsingUrl(true);
      
      try {
        // Try regular product parsing first
        const productInfo = await parseProductUrl(value);
        
        // If cart mode and no price found, try cart price extraction
        let cartPrice = null;
        if (formData.isCart && !productInfo.price) {
          cartPrice = await extractCartPrice(value);
        }
        
        // Track which fields we're auto-filling
        const newAutoFilledFields = new Set<string>();
        const fieldsToUpdate: any = {};
        
        // Only update fields that are currently empty and we found data for
        if (!formData.itemName && productInfo.itemName) {
          fieldsToUpdate.itemName = productInfo.itemName;
          newAutoFilledFields.add('itemName');
        }
        if (!formData.storeName && productInfo.storeName) {
          fieldsToUpdate.storeName = productInfo.storeName;
          newAutoFilledFields.add('storeName');
        }
        if (!formData.price && (cartPrice || productInfo.price)) {
          fieldsToUpdate.price = cartPrice || productInfo.price;
          newAutoFilledFields.add('price');
        }
        if (!formData.imageUrl && productInfo.imageUrl) {
          fieldsToUpdate.imageUrl = productInfo.imageUrl;
          newAutoFilledFields.add('imageUrl');
        }
        
        // Update form data and tracking
        if (Object.keys(fieldsToUpdate).length > 0) {
          setFormData(prev => ({ ...prev, ...fieldsToUpdate }));
          setAutoFilledFields(newAutoFilledFields);
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
    
    // If user uploads a file, remove imageUrl from auto-filled tracking
    // since they're now providing their own image
    if (file && autoFilledFields.has('imageUrl')) {
      setAutoFilledFields(prev => {
        const newSet = new Set(prev);
        newSet.delete('imageUrl');
        return newSet;
      });
    }
    
    // Create preview URL for the uploaded photo
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      
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

  const handlePauseCommit = () => {
    // Validate essential fields for the pause step
    if (!formData.emotion || (!formData.duration && !formData.otherDuration)) {
      return; // Could add validation feedback here
    }
    setCurrentStep('details');
  };

  const handleBackToBasics = () => {
    setCurrentStep('pause');
  };

  const isBasicStepValid = () => {
    return formData.emotion && (formData.duration || formData.otherDuration);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Show ripple effect for 1 second
    setTimeout(async () => {
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
        itemType: formData.itemType,
        sharedWithPartners: formData.sharedWithPartners,
        usePlaceholder: formData.usePlaceholder
      };

      // Use appropriate store based on authentication status
      if (user) {
        await supabasePausedItemsStore.addItem(itemData);
      } else {
        pausedItemsStore.addItem(itemData);
      }
      
      setIsSubmitting(false);
      
      // Start star rain immediately
      const createStarRain = () => {
        // Create multiple bursts of stars from the top
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            confetti({
              particleCount: 12,
              spread: 60,
              origin: { 
                x: Math.random() * 0.8 + 0.1, // Random position across top
                y: -0.1 
              },
              colors: ['#FFD700', '#FFA500', '#FFFF00', '#F0E68C', '#DAA520', '#FF6347'],
              scalar: 0.8,
              gravity: 0.4,
              drift: 0.1,
              startVelocity: 20
            });
          }, i * 100);
        }
        
        // Add some smaller sparkles
        setTimeout(() => {
          confetti({
            particleCount: 30,
            spread: 80,
            origin: { x: 0.5, y: -0.1 },
            colors: ['#FFFF00', '#F0E68C', '#DAA520'],
            scalar: 0.4,
            gravity: 0.3,
            drift: 0.2,
            startVelocity: 15
          });
        }, 300);
      };
      
      // Start the star rain
      createStarRain();
      
      // Add a second wave of stars
      setTimeout(() => {
        createStarRain();
      }, 500);
      
      // Close form after stars have time to fall
      setTimeout(() => {
        onClose();
        
        // Only show signup modal if user is not authenticated AND hasn't dismissed it
        if (!user && !signupModalDismissed && onShowSignup) {
          onShowSignup();
        }
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto transition-all ease-out" 
         style={{ 
           backgroundColor: showReflectiveBackground ? 'hsl(260, 47%, 95%)' : '#F9F5EB',
           transitionDuration: '3000ms' 
         }}>
      <div className="min-h-screen px-6 py-8">
        {/* Header */}
        <header className="relative mb-8">
          <div className="text-center">
            <button 
              onClick={onClose}
              className="text-black font-medium text-lg tracking-wide mb-2 hover:text-gray-600 transition-colors"
            >
              POCKET || PAUSE
            </button>
          </div>
        </header>

        {/* Form */}
        <div className="max-w-md mx-auto relative">
          <button 
            onClick={onClose}
            className="absolute -top-16 right-0 p-2 text-black hover:text-taupe transition-colors"
          >
            <X size={24} />
          </button>
          <h1 className="text-2xl font-semibold text-dark-gray text-center mb-8">
            Add Something to Pause
          </h1>

          {/* Guest mode banner */}
          {!user && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm text-center">
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
            {currentStep === 'pause' ? (
              // STEP 1: Core pause decision
              <>
                {/* Link Field */}
                <div className="space-y-1">
                  <Label htmlFor="link" className="text-dark-gray font-medium text-base">
                    Link (paste a product URL)
                  </Label>
                  <div className="relative">
                    <Input
                      id="link"
                      type="url"
                      placeholder="www.example.com/item"
                      value={formData.link}
                      onChange={(e) => handleLinkChange(e.target.value)}
                      className="bg-white border-gray-200 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7] placeholder:font-normal text-base"
                    />
                    {isParsingUrl && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-lavender border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  {formData.imageUrl && !formData.photo && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">✓ Found product details automatically</p>
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
                  <Label htmlFor="isCart" className="text-dark-gray font-medium text-base cursor-pointer">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={16} />
                      Mark as Cart (saving multiple items)
                    </div>
                  </Label>
                </div>

                {/* Emotion Selection */}
                <div className="space-y-1">
                  <Label className="text-dark-gray font-medium text-base">
                    How are you feeling right now?
                  </Label>
                  <Select value={formData.emotion} onValueChange={(value) => handleInputChange('emotion', value)}>
                    <SelectTrigger className="bg-white border-gray-200 rounded-xl py-3 px-4">
                      <SelectValue placeholder="Select emotion" className="placeholder:text-[#B0ABB7] placeholder:font-normal text-base" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 rounded-xl max-h-60 overflow-y-auto">
                      {emotions.map((emotion) => (
                        <SelectItem key={emotion.name} value={emotion.name} className="rounded-lg my-1">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: getEmotionColor(emotion.name) }}
                            />
                            <span className="capitalize">{emotion.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pause Duration */}
                <div className="space-y-2">
                  <Label className="text-dark-gray font-medium text-base">
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
                            : 'bg-white border-gray-200 text-dark-gray hover:border-lavender/50'
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
                    <SelectTrigger className={`bg-white border-2 rounded-xl py-3 px-4 transition-all ${
                      formData.otherDuration ? 'border-lavender bg-lavender text-dark-gray' : 'border-gray-200 hover:border-lavender/50'
                    }`}>
                      <SelectValue placeholder="Other pause lengths" className="placeholder:text-[#B0ABB7] placeholder:font-normal text-base" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 rounded-xl">
                      {otherPauseLengths.map((duration) => (
                        <SelectItem key={duration} value={duration} className="rounded-lg my-1">
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 1 Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 bg-white border-gray-200 text-dark-gray hover:bg-gray-50 rounded-xl py-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePauseCommit}
                    disabled={!isBasicStepValid()}
                    className={`flex-1 bg-lavender text-dark-gray hover:bg-lavender/90 rounded-xl py-3 ${
                      !isBasicStepValid() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Commit to Pause
                  </Button>
                </div>
              </>
            ) : (
              // STEP 2: Details and finalization
              <>
                {/* Step indicator */}
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-800 text-sm font-medium">
                    ✓ Pause committed! Now let's add some details to help you reflect later.
                  </p>
                </div>

                {/* Item Name Field */}
                <div className="space-y-1">
                  <Label htmlFor="itemName" className="text-dark-gray font-medium text-base">
                    Item Name
                  </Label>
                  <Input
                    id="itemName"
                    type="text"
                    placeholder="What are you thinking of buying?"
                    value={formData.itemName}
                    onChange={(e) => handleInputChange('itemName', e.target.value)}
                    className="bg-white border-gray-200 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7] placeholder:font-normal text-base"
                  />
                </div>

                {/* Store Name Field */}
                <div className="space-y-1">
                  <Label htmlFor="storeName" className="text-dark-gray font-medium text-base">
                    Store Name
                  </Label>
                  <Input
                    id="storeName"
                    type="text"
                    placeholder="Where is this item from?"
                    value={formData.storeName}
                    onChange={(e) => handleInputChange('storeName', e.target.value)}
                    className="bg-white border-gray-200 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7] placeholder:font-normal text-base"
                  />
                </div>

                {/* Price Field */}
                <div className="space-y-1">
                  <Label htmlFor="price" className="text-dark-gray font-medium text-base">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="bg-white border-gray-200 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7] placeholder:font-normal text-base"
                  />
                </div>

                {/* Photo Upload Field */}
                <div className="space-y-1">
                  <Label htmlFor="photo" className="text-dark-gray font-medium text-base">
                    Photo (optional)
                  </Label>
                  
                  {/* Use Placeholder Checkbox */}
                  {!formData.photo && !formData.imageUrl && (
                    <div className="flex items-center space-x-3 mb-3">
                      <Checkbox
                        id="usePlaceholder"
                        checked={formData.usePlaceholder}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({ ...prev, usePlaceholder: checked === true }));
                        }}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="usePlaceholder" className="text-sm text-gray-600 cursor-pointer">
                        Use placeholder image
                      </Label>
                    </div>
                  )}
                  
                  {/* Show placeholder preview if checked */}
                  {formData.usePlaceholder && !formData.photo && !formData.imageUrl && (
                    <div className="mb-3">
                      <img 
                        src="/lovable-uploads/1358c375-933c-4b12-9b1e-e3b852c396df.png" 
                        alt="Placeholder preview" 
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <p className="text-sm text-blue-600 mt-1">✓ Placeholder image selected</p>
                    </div>
                  )}
                  
                  {(formData.imageUrl && !formData.photo) || (formData.isCart && formData.imageUrl === 'cart-placeholder') ? (
                    <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      {formData.isCart && formData.imageUrl === 'cart-placeholder' ? (
                        <div className="flex flex-col items-center gap-2 mb-3">
                          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                            <ShoppingCart size={24} className="text-blue-600" />
                          </div>
                          <p className="text-blue-600 text-sm font-medium">
                            🛒 Cart placeholder image
                          </p>
                        </div>
                      ) : (
                        <p className="text-green-600 text-sm font-medium">
                          ✓ Product image already grabbed automatically
                        </p>
                      )}
                      <p className="text-green-600 text-xs mt-1">
                        You can still upload a different photo if you prefer
                      </p>
                      <input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-500 mt-2
                                   file:py-2 file:px-4
                                   file:rounded-lg file:border-0
                                   file:text-sm file:font-medium
                                   file:bg-green-100 file:text-green-700
                                   hover:file:bg-green-200
                                   rounded-lg border border-green-200 bg-green-50 h-10
                                   overflow-hidden"
                      />
                    </div>
                  ) : (
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-sm text-gray-500
                                 file:py-3 file:px-4
                                 file:rounded-xl file:border-0
                                 file:text-sm file:font-medium
                                 file:bg-lavender file:text-dark-gray
                                 hover:file:bg-lavender/90
                                 rounded-xl border border-gray-200 bg-white h-12
                                 overflow-hidden
                                 flex items-center"
                    />
                  )}
                  
                  {photoPreview && (
                    <div className="mt-2">
                      <img 
                        src={photoPreview} 
                        alt="Photo preview" 
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <p className="text-sm text-green-600 mt-1">✓ Photo ready to upload</p>
                    </div>
                  )}
                </div>

                {/* Tags Field */}
                <div className="space-y-1">
                  <Label className="text-dark-gray font-medium text-base">
                    Tags (optional)
                  </Label>
                  <TagInput
                    value={formData.tags}
                    onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                    placeholder="Add tags like 'apartment', 'clothes', 'fall wardrobe'..."
                    suggestions={existingTags}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1 md:hidden">
                    Add a comma or click outside the input to set a tag.
                  </p>
                </div>

                {/* Partner Sharing */}
                <PartnerSharingSection
                  selectedPartners={formData.sharedWithPartners}
                  onPartnersChange={(partners) => setFormData(prev => ({ ...prev, sharedWithPartners: partners }))}
                />

                {/* Notes Field */}
                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-dark-gray font-medium text-base">
                    Notes (optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Why do you want this item?"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="bg-white border-gray-200 rounded-xl py-3 px-4 min-h-[80px] resize-none placeholder:text-[#B0ABB7] placeholder:font-normal text-base"
                  />
                </div>

                {/* Step 2 Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    variant="outline"
                    onClick={handleBackToBasics}
                    className="flex-1 bg-white border-gray-200 text-dark-gray hover:bg-gray-50 rounded-xl py-3"
                  >
                    ← Back
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
                    Complete Pause
                  </Button>
                </div>
              </>
            )}
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
