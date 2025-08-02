
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from '@/services/imageUploadService';
import { convertDbToLocal, convertLocalToDb } from '@/utils/pausedItemsConverters';
import { calculateCheckInTimeDisplay } from '@/utils/pausedItemsUtils';

export interface PausedItem {
  id: string;
  itemName: string;
  storeName: string;
  price: string;
  imageUrl?: string;
  emotion: string;
  notes?: string;
  duration: string;
  otherDuration?: string;
  link?: string;
  photo?: File | null;
  photoDataUrl?: string;
  tags?: string[];
  pausedAt: Date;
  checkInTime: string;
  checkInDate: Date;
  isCart?: boolean;
  itemType?: 'item' | 'cart';
  
  originalUserId?: string; // Added to track who originally created the item
  usePlaceholder?: boolean;
}

type Listener = () => void;

class SupabasePausedItemsStore {
  private items: PausedItem[] = [];
  private listeners: Set<Listener> = new Set();
  private isLoaded = false;

  constructor() {
    // Don't auto-load on construction to prevent delays
    this.isLoaded = true; // Set as loaded initially for guest mode
  }

  private updateCheckInTimes(): void {
    this.items.forEach(item => {
      item.checkInTime = calculateCheckInTimeDisplay(item.checkInDate);
    });
  }

  async loadItems(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        this.items = [];
        this.isLoaded = true;
        this.notifyListeners();
        return;
      }

      this.isLoaded = false; // Set to false only when we actually need to load

      const { data, error } = await supabase
        .from('paused_items')
        .select('*')
        .eq('status', 'paused')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading paused items:', error);
        this.isLoaded = true; // Set loaded even on error to prevent infinite loading
        this.notifyListeners();
        return;
      }

      this.items = data?.map(item => convertDbToLocal(item)) || [];
      this.updateCheckInTimes();
      this.isLoaded = true;
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error in loadItems:', error);
      this.isLoaded = true; // Set loaded even on error to prevent infinite loading
      this.notifyListeners();
    }
  }

  async addItem(item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>): Promise<void> {
    try {
      // Step 1: Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return;
      }

      // Step 2: Handle image upload if provided
      let uploadedImageUrl: string | null = null;
      if (item.photo) {
        uploadedImageUrl = await uploadImage(item.photo);
      }

      // Step 3: Convert to database format and save
      const dbItem = convertLocalToDb(item, uploadedImageUrl || undefined);
      
      const { data, error } = await supabase
        .from('paused_items')
        .insert({
          ...dbItem,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database save failed:', error);
        return;
      }

      // Step 4: Update local state
      const newItem = convertDbToLocal(data);
      this.items.unshift(newItem);
      this.updateCheckInTimes();
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Unexpected error in addItem:', error);
    }
  }

  getItems(): PausedItem[] {
    this.updateCheckInTimes();
    return [...this.items];
  }

  getItemsForReview(): PausedItem[] {
    // Return empty array if not loaded or no items
    if (!this.isLoaded || !this.items.length) {
      return [];
    }

    try {
      const now = new Date();
      
      const reviewItems = this.items.filter(item => {
        try {
          // Ensure item has required properties
          if (!item || !item.checkInDate) {
            return false;
          }
          
          return item.checkInDate.getTime() <= now.getTime();
        } catch (error) {
          console.error('Error filtering review item:', error);
          return false;
        }
      });
      
      return reviewItems;
    } catch (error) {
      console.error('Error in getItemsForReview:', error);
      return [];
    }
  }

  async removeItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('paused_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing paused item:', error);
        return;
      }

      this.items = this.items.filter(item => item.id !== id);
      this.notifyListeners();
    } catch (error) {
      console.error('Error in removeItem:', error);
    }
  }

  async extendPause(itemId: string, newDuration: string): Promise<void> {
    try {
      console.log('🔄 Supabase store extendPause called:', { itemId, newDuration });
      
      // First verify the item exists
      const existingItem = this.items.find(item => item.id === itemId);
      if (!existingItem) {
        console.error('❌ Item not found in store before extend:', itemId);
        return;
      }
      
      console.log('📦 Item found before extend:', existingItem);
      
      // Calculate new review date based on duration
      const now = new Date();
      let daysToAdd = 0;
      
      switch (newDuration) {
        case '24-hours':
          daysToAdd = 1;
          break;
        case '3-days':
          daysToAdd = 3;
          break;
        case '1-week':
          daysToAdd = 7;
          break;
        case '2-weeks':
          daysToAdd = 14;
          break;
        case '1-month':
          daysToAdd = 30;
          break;
        case '3-months':
          daysToAdd = 90;
          break;
        default:
          daysToAdd = 7; // Default to 1 week
          break;
      }

      const newReviewAt = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      
      console.log('📅 Calculated new review date:', newReviewAt.toISOString());
      
      const { error } = await supabase
        .from('paused_items')
        .update({
          pause_duration_days: daysToAdd,
          review_at: newReviewAt.toISOString(),
          status: 'paused'
        })
        .eq('id', itemId);

      if (error) {
        console.error('❌ Database error extending pause:', error);
        return;
      }

      console.log('✅ Database update successful');

      // Update local item
      const itemIndex = this.items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        const originalItem = this.items[itemIndex];
        this.items[itemIndex] = {
          ...this.items[itemIndex],
          duration: newDuration,
          checkInDate: newReviewAt,
          checkInTime: calculateCheckInTimeDisplay(newReviewAt)
        };
        
        console.log('📦 Local item updated:', {
          original: originalItem,
          updated: this.items[itemIndex]
        });
      } else {
        console.error('❌ Item not found in local store after database update:', itemId);
      }

      // Refresh the data to ensure proper filtering across tabs
      await this.loadItems();
      this.notifyListeners();
      
      console.log('🔄 Store refreshed after extend pause');
    } catch (error) {
      console.error('❌ Critical error in extendPause:', error);
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in store listener:', error);
      }
    });
  }

  isDataLoaded(): boolean {
    return this.isLoaded;
  }
}

export const supabasePausedItemsStore = new SupabasePausedItemsStore();
