
import { usePausedItems } from '../hooks/usePausedItems';

export const usePauseFormSubmission = () => {
  const { addItem } = usePausedItems();

  const handleSubmit = async (formData: {
    itemName: string;
    storeName: string;
    price: string;
    emotion: string;
    duration: string;
    otherDuration?: string;
    notes?: string;
    link?: string;
    photo?: File | null;
  }) => {
    try {
      await addItem({
        itemName: formData.itemName,
        storeName: formData.storeName,
        price: formData.price,
        emotion: formData.emotion,
        duration: formData.duration,
        otherDuration: formData.otherDuration,
        notes: formData.notes,
        link: formData.link,
        photo: formData.photo
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding paused item:', error);
      return { success: false, error: 'Failed to save item. Please try again.' };
    }
  };

  return { handleSubmit };
};
