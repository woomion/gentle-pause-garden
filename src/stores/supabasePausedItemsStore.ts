
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
      console.log('Loading paused items from Supabase...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, skipping load');
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
    const now = new Date();
    console.log('🔍 getItemsForReview DETAILED DEBUG:');
    console.log('🔍 Current time:', now.toISOString());
    console.log('🔍 Current timestamp:', now.getTime());
    console.log('🔍 Total items:', this.items.length);
    
    const reviewItems = this.items.filter(item => {
      const checkInTimestamp = item.checkInDate.getTime();
      const nowTimestamp = now.getTime();
      const isReady = checkInTimestamp <= nowTimestamp;
      const timeDiffMs = checkInTimestamp - nowTimestamp;
      const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
      const timeDiffHours = Math.round(timeDiffMs / (1000 * 60 * 60));
      
      console.log(`🔍 Item "${item.itemName}":`, {
        checkInDate: item.checkInDate.toISOString(),
        checkInTimestamp,
        nowTimestamp,
        timeDiffMs,
        timeDiffMinutes,
        timeDiffHours,
        isReady: isReady ? '✅ READY' : '❌ NOT READY',
        comparison: `${checkInTimestamp} <= ${nowTimestamp} = ${isReady}`
      });
      return isReady;
    });
    
    console.log('🔍 Items ready for review:', reviewItems.length);
    console.log('🔍 Review items:', reviewItems.map(item => ({
      id: item.id,
      itemName: item.itemName,
      checkInDate: item.checkInDate.toISOString(),
      checkInTime: item.checkInTime
    })));
    
    return reviewItems;
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
