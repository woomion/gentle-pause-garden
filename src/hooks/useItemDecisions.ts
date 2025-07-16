
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabasePauseLogStore } from '../stores/supabasePauseLogStore';
import { pauseLogStore } from '../stores/pauseLogStore';
import { PausedItem } from '../stores/supabasePausedItemsStore';

export const useItemDecisions = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLetGo = async (item: PausedItem, onDelete: (id: string) => void, onClose: () => void, reflectionNotes?: string) => {
    console.log('📝 Adding item to pause log (let go):', {
      itemName: item.itemName,
      emotion: item.emotion,
      storeName: item.storeName,
      status: 'let-go',
      notes: reflectionNotes || item.notes,
      user: user ? 'authenticated' : 'guest'
    });

    try {
      // Use appropriate pause log store based on authentication
      if (user) {
        await supabasePauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'let-go',
          notes: reflectionNotes || item.notes,
          tags: item.tags
        });
        console.log('✅ Item added to Supabase pause log');
      } else {
        pauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'let-go',
          notes: reflectionNotes || item.notes,
          tags: item.tags
        });
        console.log('✅ Item added to local pause log');
      }
      
      // Remove from paused items
      onDelete(item.id);
      
      // Show success toast
      toast({
        title: "Item released",
        description: `"${item.itemName}" has been moved to your pause log.`,
      });
    } catch (error) {
      console.error('❌ Error adding item to pause log:', error);
      toast({
        title: "Error",
        description: "Failed to save decision. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBought = async (item: PausedItem, onDelete: (id: string) => void, onClose: () => void, reflectionNotes?: string) => {
    console.log('📝 Adding item to pause log (purchased):', {
      itemName: item.itemName,
      emotion: item.emotion,
      storeName: item.storeName,
      status: 'purchased',
      notes: reflectionNotes || item.notes,
      user: user ? 'authenticated' : 'guest'
    });

    try {
      // Use appropriate pause log store based on authentication
      if (user) {
        await supabasePauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'purchased',
          notes: reflectionNotes || item.notes,
          tags: item.tags
        });
        console.log('✅ Item added to Supabase pause log');
      } else {
        pauseLogStore.addItem({
          itemName: item.itemName,
          emotion: item.emotion,
          storeName: item.storeName,
          status: 'purchased',
          notes: reflectionNotes || item.notes,
          tags: item.tags
        });
        console.log('✅ Item added to local pause log');
      }
      
      // Remove from paused items
      onDelete(item.id);
      
      // Show success toast that auto-dismisses
      const toastInstance = toast({
        title: "Great, you made a conscious choice!",
        description: "We've moved this thoughtful decision to your Pause Log for future reference.",
      });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        toastInstance.dismiss();
      }, 3000);
    } catch (error) {
      console.error('❌ Error adding item to pause log:', error);
      toast({
        title: "Error",
        description: "Failed to save decision. Please try again.",
        variant: "destructive"
      });
    }
  };

  return { handleLetGo, handleBought };
};
