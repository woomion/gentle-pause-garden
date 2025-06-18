
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { formatPrice } from '../utils/priceFormatter';
import { useItemNavigation } from '../hooks/useItemNavigation';
import { getEmotionColor } from '../utils/emotionColors';
import { useItemActions } from '../hooks/useItemActions';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi
} from "@/components/ui/carousel"

interface ItemReviewModalProps {
  items: (PausedItem | LocalPausedItem)[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onItemDecided: (id: string) => void;
  onNext: () => void;
}

const ItemReviewModal = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onItemDecided,
  onNext
}: ItemReviewModalProps) => {
  const [selectedDecision, setSelectedDecision] = useState<'purchase' | 'let-go' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [api, setApi] = useState<CarouselApi>();

  const { handleViewItem } = useItemNavigation();
  const { handleBought, handleLetGo } = useItemActions();

  const currentItem = items[activeIndex];
  const isLastItem = activeIndex >= items.length - 1;

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const selectedIndex = api.selectedScrollSnap();
      setActiveIndex(selectedIndex);
      setSelectedDecision(null);
      setShowFeedback(false);
      setNotes('');
    };

    api.on('select', onSelect);
    return () => api.off('select', onSelect);
  }, [api]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDecision(null);
      setShowFeedback(false);
      setNotes('');
      setActiveIndex(currentIndex);
    }
  }, [isOpen, currentIndex]);

  useEffect(() => {
    setActiveIndex(currentIndex);
    if (api) {
      api.scrollTo(currentIndex);
    }
  }, [currentIndex, api]);

  if (!isOpen || !currentItem) return null;

  const handleDecision = async (decision: 'purchase' | 'let-go') => {
    setSelectedDecision(decision);
    setShowFeedback(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedDecision) return;

    try {
      if (selectedDecision === 'purchase') {
        await handleBought(currentItem, onItemDecided, () => {});
      } else {
        await handleLetGo(currentItem, onItemDecided, () => {});
      }

      onItemDecided(currentItem.id);

      if (isLastItem) {
        onClose();
      } else {
        setSelectedDecision(null);
        setShowFeedback(false);
        setNotes('');
        const nextIndex = activeIndex + 1;
        if (nextIndex < items.length) {
          setActiveIndex(nextIndex);
          if (api) {
            api.scrollTo(nextIndex);
          }
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error submitting decision:', error);
    }
  };

  const emotionColor = getEmotionColor(currentItem.emotion);

  const imageUrl = (() => {
    if (currentItem.imageUrl) {
      if (currentItem.imageUrl.includes('supabase')) {
        return currentItem.imageUrl;
      } else {
        try {
          new URL(currentItem.imageUrl);
          return currentItem.imageUrl;
        } catch {
          return null;
        }
      }
    }
    if (currentItem.photoDataUrl) {
      return currentItem.photoDataUrl;
    }
    if (currentItem.photo instanceof File) {
      return URL.createObjectURL(currentItem.photo);
    }
    return null;
  })();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    if (target.parentElement) {
      target.parentElement.innerHTML = '<div class="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-xl opacity-50 flex items-center justify-center" aria-hidden="true"><div class="w-8 h-8 bg-gray-400 dark:bg-gray-500 rounded-full"></div></div>';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-cream dark:bg-[#200E3B] rounded-2xl w-full max-w-md mx-auto border border-lavender/30 dark:border-gray-600 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-lavender/30 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB]">
                Ready to decide?
              </h2>
              <p className="text-black dark:text-[#F9F5EB] text-sm mt-1">
                {activeIndex + 1} of {items.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-lavender/20 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} className="text-black dark:text-[#F9F5EB]" />
            </button>
          </div>
        </div>

        {/* Carousel for multiple items */}
        {items.length > 1 ? (
          <Carousel className="w-full" setApi={setApi} opts={{ startIndex: activeIndex }}>
            <CarouselContent>
              {items.map((item, index) => (
                <CarouselItem key={item.id}>
                  <ItemContent 
                    item={item}
                    emotionColor={getEmotionColor(item.emotion)}
                    imageUrl={(() => {
                      if (item.imageUrl) {
                        if (item.imageUrl.includes('supabase')) {
                          return item.imageUrl;
                        } else {
                          try {
                            new URL(item.imageUrl);
                            return item.imageUrl;
                          } catch {
                            return null;
                          }
                        }
                      }
                      if (item.photoDataUrl) {
                        return item.photoDataUrl;
                      }
                      if (item.photo instanceof File) {
                        return URL.createObjectURL(item.photo);
                      }
                      return null;
                    })()}
                    handleImageError={handleImageError}
                    handleViewItem={handleViewItem}
                    showFeedback={showFeedback}
                    selectedDecision={selectedDecision}
                    notes={notes}
                    setNotes={setNotes}
                    handleDecision={handleDecision}
                    handleSubmitDecision={handleSubmitDecision}
                    isLastItem={index >= items.length - 1}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Carousel Navigation at Bottom */}
            <div className="flex items-center justify-center pb-4 gap-4">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 static" />
              <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                Swipe or use arrows to navigate
              </span>
              <CarouselNext className="relative right-0 top-0 translate-y-0 static" />
            </div>
          </Carousel>
        ) : (
          <ItemContent 
            item={currentItem}
            emotionColor={emotionColor}
            imageUrl={imageUrl}
            handleImageError={handleImageError}
            handleViewItem={handleViewItem}
            showFeedback={showFeedback}
            selectedDecision={selectedDecision}
            notes={notes}
            setNotes={setNotes}
            handleDecision={handleDecision}
            handleSubmitDecision={handleSubmitDecision}
            isLastItem={isLastItem}
          />
        )}
      </div>
    </div>
  );
};

interface ItemContentProps {
  item: PausedItem | LocalPausedItem;
  emotionColor: string;
  imageUrl: string | null;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  handleViewItem: (item: PausedItem | LocalPausedItem) => void;
  showFeedback: boolean;
  selectedDecision: 'purchase' | 'let-go' | null;
  notes: string;
  setNotes: (notes: string) => void;
  handleDecision: (decision: 'purchase' | 'let-go') => void;
  handleSubmitDecision: () => void;
  isLastItem: boolean;
}

const ItemContent = ({
  item,
  emotionColor,
  imageUrl,
  handleImageError,
  handleViewItem,
  showFeedback,
  selectedDecision,
  notes,
  setNotes,
  handleDecision,
  handleSubmitDecision,
  isLastItem
}: ItemContentProps) => {
  return (
    <div className="p-6">
      {!showFeedback ? (
        <>
          {/* Item Details */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={item.itemName}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  loading="lazy"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50" aria-hidden="true" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-black dark:text-[#F9F5EB] truncate pr-2">
                  {item.itemName}
                </h3>
                {item.price && (
                  <span className="text-black dark:text-[#F9F5EB] font-medium flex-shrink-0">
                    {formatPrice(item.price)}
                  </span>
                )}
              </div>
              
              <p className="text-black dark:text-[#F9F5EB] text-sm mb-2">
                {item.storeName}
              </p>
              
              <div className="text-black dark:text-[#F9F5EB] text-sm mb-3">
                <span>Paused while feeling </span>
                <span 
                  className="inline-block px-2 py-1 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: emotionColor,
                    color: '#000'
                  }}
                >
                  {item.emotion}
                </span>
              </div>

              {/* Notes section */}
              {item.notes && item.notes.trim() && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mb-3">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    <strong>Note:</strong> {item.notes}
                  </p>
                </div>
              )}

              {/* View Link CTA */}
              {item.link && item.link.trim() && (
                <div className="pt-2">
                  <button
                    onClick={() => handleViewItem(item)}
                    className="text-black dark:text-[#F9F5EB] text-sm underline hover:no-underline transition-all duration-200"
                  >
                    view link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Decision Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleDecision('purchase')}
              className="w-full py-3 px-4 bg-[#CAB6F7] hover:bg-[#B5A0F2] text-black font-medium rounded-xl transition-colors"
            >
              I want to buy this
            </button>
            <button
              onClick={() => handleDecision('let-go')}
              className="w-full py-3 px-4 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-black dark:text-[#F9F5EB] font-medium rounded-xl border border-lavender/30 dark:border-gray-600 transition-colors"
            >
              I'm ready to let this go
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Feedback Form */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB] mb-4">
              {selectedDecision === 'purchase' ? 'Great choice!' : 'Good for you!'}
            </h3>
            <p className="text-black dark:text-[#F9F5EB] text-sm mb-4">
              {selectedDecision === 'purchase' 
                ? 'Any thoughts about this purchase?'
                : 'What helped you decide to let this go?'
              }
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional reflection..."
              className="w-full p-3 border border-lavender/30 dark:border-gray-600 rounded-xl bg-white/60 dark:bg-white/10 text-black dark:text-[#F9F5EB] placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#CAB6F7]"
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitDecision}
            className="w-full py-3 px-4 bg-[#CAB6F7] hover:bg-[#B5A0F2] text-black font-medium rounded-xl transition-colors"
          >
            {isLastItem ? 'Finish' : 'Continue'}
          </button>
        </>
      )}
    </div>
  );
};

export default ItemReviewModal;
