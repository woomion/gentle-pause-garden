import { useState } from 'react';
import { useUsageLimit } from './useUsageLimit';
import { usePausedItems } from './usePausedItems';
import { useToast } from '@/components/ui/use-toast';

export const useModalStates = () => {
  const [showForm, setShowForm] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalDismissed, setSignupModalDismissed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewType, setReviewType] = useState<'solo' | 'partner'>('solo');
  const [formInitialData, setFormInitialData] = useState<any>(null);
  const usageLimit = useUsageLimit();
  const { addItem } = usePausedItems();
  const { toast } = useToast();

  const handleAddPause = async (parsedData?: any) => {
    console.log('🎯 handleAddPause called with data:', parsedData);
    
    // Check usage limit first
    if (!usageLimit.checkUsageLimit()) {
      console.log('🚫 Usage limit reached, showing usage limit modal');
      return;
    }
    
    // If we have parsed data, add the item directly
    if (parsedData && (parsedData.itemName || parsedData.link)) {
      try {
        console.log('✅ Adding item directly to paused items:', parsedData);
        await addItem({
          itemName: parsedData.itemName || 'Product',
          storeName: parsedData.storeName || '',
          price: parsedData.price || '',
          
          notes: undefined,
          duration: '1 week',
          link: parsedData.link,
          photo: null,
          imageUrl: parsedData.imageUrl,
          tags: [],
          isCart: false,
          itemType: 'item',
          usePlaceholder: false,
        });
        
        // Increment usage count for non-authenticated users
        usageLimit.incrementUsage();
        
        toast({ 
          title: 'Paused', 
          description: `Added "${parsedData.itemName || 'item'}" to your pause list`, 
          duration: 2000 
        });
        
        console.log('✅ Item successfully added to pause list');
      } catch (error) {
        console.error('❌ Failed to add item:', error);
        toast({ 
          title: 'Error', 
          description: 'Could not add item to pause list', 
          variant: 'destructive' 
        });
      }
    } else {
      console.log('⚠️ No valid data to add');
      toast({ 
        title: 'No item to add', 
        description: 'Please enter a product URL first', 
        variant: 'destructive' 
      });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormInitialData(null); // Clear initial data when closing
  };

  const handleShowSignup = () => {
    // Only show signup modal if user is not authenticated AND hasn't dismissed it
    if (!signupModalDismissed) {
      setShowSignupModal(true);
    }
  };

  const handleCloseSignup = () => {
    setShowSignupModal(false);
    setSignupModalDismissed(true);
  };

  const handleStartReview = (type: 'solo' | 'partner' = 'solo') => {
    setReviewType(type);
    setShowReviewModal(true);
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
  };

  return {
    // State
    showForm,
    showSignupModal,
    signupModalDismissed,
    showReviewModal,
    reviewType,
    formInitialData,
    
    // Actions
    handleAddPause,
    handleCloseForm,
    handleShowSignup,
    handleCloseSignup,
    handleStartReview,
    handleCloseReview,
  };
};