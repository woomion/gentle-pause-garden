
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
  sharedWithPartners?: string[];
  originalUserId?: string; // Added to track who originally created the item
  usePlaceholder?: boolean;
}

type Listener = () => void;

class SupabasePausedItemsStore {
  private items: PausedItem[] = [];
  private listeners: Set<Listener> = new Set();
  private isLoaded = false;

  constructor() {
    // Load items when store is created
    this.loadItems();
  }

  private updateCheckInTimes(): void {
    this.items.forEach(item => {
      item.checkInTime = calculateCheckInTimeDisplay(item.checkInDate);
    });
  }

  async loadItems(): Promise<void> {
    try {
      console.log('🔍 Store loadItems: Starting to load paused items from Supabase...');
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 Store loadItems: Auth check result:', { user: !!user, userId: user?.id });
      
      if (!user) {
        console.log('🔍 Store loadItems: No authenticated user, skipping load');
        this.items = [];
        this.isLoaded = true;
        this.notifyListeners();
        return;
      }

      const { data, error } = await supabase
        .from('paused_items')
        .select('*')
        .eq('status', 'paused')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading paused items:', error);
        return;
      }

      console.log('Raw paused items data from Supabase:', data);
      
      // Debug tags from database
      data?.forEach((item, index) => {
        console.log(`🏷️ DB Item ${index + 1} (${item.title}):`, {
          id: item.id,
          tags: item.tags,
          tagsType: typeof item.tags,
          tagsIsArray: Array.isArray(item.tags),
          tagsLength: item.tags?.length || 0
        });
      });

      this.items = data?.map(item => convertDbToLocal(item)) || [];
      this.updateCheckInTimes();
      this.isLoaded = true;
      
      console.log('Converted paused items:', this.items);
      
      // Debug converted tags
      this.items.forEach((item, index) => {
        console.log(`🏷️ Converted Item ${index + 1} (${item.itemName}):`, {
          id: item.id,
          tags: item.tags,
          tagsType: typeof item.tags,
          tagsIsArray: Array.isArray(item.tags),
          tagsLength: item.tags?.length || 0
        });
      });
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error in loadItems:', error);
    }
  }

  async addItem(item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>): Promise<void> {
    try {
      console.log('=== ADD ITEM DEBUG START ===');
      
      // Step 1: Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return;
      }

      console.log('1. Adding item for user:', user.id, 'with data:', {
        itemName: item.itemName,
        storeName: item.storeName,
        emotion: item.emotion,
        hasPhoto: !!item.photo,
        hasImageUrl: !!item.imageUrl,
        imageUrlValue: item.imageUrl,
        hasLink: !!item.link,
        photoSize: item.photo?.size,
        photoName: item.photo?.name,
        photoType: item.photo?.type,
        tags: item.tags,
        tagsLength: item.tags?.length || 0
      });

      // Step 2: Handle image upload if provided
      let uploadedImageUrl: string | null = null;
      if (item.photo) {
        console.log('2. Photo detected, starting upload process...');
        uploadedImageUrl = await uploadImage(item.photo);
        console.log('2a. Upload result:', { 
          success: !!uploadedImageUrl, 
          url: uploadedImageUrl 
        });
      } else {
        console.log('2. No photo to upload');
      }

      // Step 3: Convert to database format
      const dbItem = convertLocalToDb(item, uploadedImageUrl || undefined);
      console.log('3. Database item prepared:', dbItem);
      console.log('3a. Tags specifically:', { 
        originalTags: item.tags, 
        dbItemTags: dbItem.tags,
        tagsType: typeof dbItem.tags,
        tagsIsArray: Array.isArray(dbItem.tags)
      });
      
      // Step 4: Save to database
      console.log('4. Saving to database...');
      const insertData = {
        ...dbItem,
        user_id: user.id
      };
      console.log('4a. Final insert data:', insertData);
      console.log('4b. Insert data tags:', { 
        tags: insertData.tags, 
        tagsType: typeof insertData.tags,
        tagsIsArray: Array.isArray(insertData.tags)
      });
      
      const { data, error } = await supabase
        .from('paused_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('4a. ❌ Database save failed:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        return;
      }

      console.log('4b. ✅ Database save successful:', data);

      // Step 5: Update local state
      const newItem = convertDbToLocal(data);
      this.items.unshift(newItem);
      this.updateCheckInTimes();
      this.notifyListeners();
      
      console.log('5. ✅ Item successfully added with final data:', {
        id: newItem.id,
        storeName: newItem.storeName,
        imageUrl: newItem.imageUrl,
        emotion: newItem.emotion,
        tags: newItem.tags,
        tagsLength: newItem.tags?.length || 0
      });
      
      console.log('=== ADD ITEM DEBUG END ===');
    } catch (error) {
      console.error('❌ Unexpected error in addItem:', error);
    }
  }

  getItems(): PausedItem[] {
    this.updateCheckInTimes();
    return [...this.items];
  }

  getItemsForReview(): PausedItem[] {
    console.log('🔍 Store getItemsForReview: isLoaded:', this.isLoaded, 'items length:', this.items.length);
    
    // Return empty array if not loaded or no items
    if (!this.isLoaded || !this.items.length) {
      console.log('🔍 Store getItemsForReview: Early return - not loaded or no items');
      return [];
    }

    try {
      const now = new Date();
      console.log('🔍 Store getItemsForReview: Current time:', now.toISOString());
      
      const reviewItems = this.items.filter(item => {
        try {
          // Ensure item has required properties
          if (!item || !item.checkInDate) {
            console.log('🔍 Store getItemsForReview: Item missing required properties:', {
              itemId: item?.id,
              itemName: item?.itemName,
              hasCheckInDate: !!item?.checkInDate
            });
            return false;
          }
          
          const checkInTimestamp = item.checkInDate.getTime();
          const nowTimestamp = now.getTime();
          const isReady = checkInTimestamp <= nowTimestamp;
          
          console.log('🔍 Store getItemsForReview: Item time check:', {
            itemId: item.id,
            itemName: item.itemName,
            checkInDate: item.checkInDate.toISOString(),
            checkInTimestamp,
            nowTimestamp,
            timeDiff: nowTimestamp - checkInTimestamp,
            isReady
          });
          
          return isReady;
        } catch (error) {
          console.error('Error filtering review item:', error, item);
          return false;
        }
      });
      
      console.log('🔍 Store getItemsForReview: Final review items:', reviewItems.length, reviewItems);
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

  async extendPause(itemId: string, newDuration: string, otherDuration?: string): Promise<void> {
    try {
      // Calculate new review date based on duration
      const now = new Date();
      let daysToAdd = 0;
      
      switch (newDuration) {
        case '1-day':
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
        case 'other':
          // Parse the other duration
          if (otherDuration) {
            const match = otherDuration.match(/(\d+)\s*(day|days|week|weeks|month|months)/i);
            if (match) {
              const number = parseInt(match[1]);
              const unit = match[2].toLowerCase();
              if (unit.startsWith('day')) {
                daysToAdd = number;
              } else if (unit.startsWith('week')) {
                daysToAdd = number * 7;
              } else if (unit.startsWith('month')) {
                daysToAdd = number * 30;
              }
            }
          }
          break;
      }

      const newReviewAt = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      
      const { error } = await supabase
        .from('paused_items')
        .update({
          pause_duration_days: daysToAdd,
          other_duration: otherDuration,
          review_at: newReviewAt.toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error extending pause:', error);
        return;
      }

      // Update local item
      const itemIndex = this.items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        this.items[itemIndex] = {
          ...this.items[itemIndex],
          duration: newDuration,
          otherDuration,
          checkInDate: newReviewAt,
          checkInTime: calculateCheckInTimeDisplay(newReviewAt)
        };
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Error in extendPause:', error);
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
