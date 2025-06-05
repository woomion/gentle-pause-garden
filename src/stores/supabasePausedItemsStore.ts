import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

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
  pausedAt: Date;
  checkInTime: string;
  checkInDate: Date;
}

type DbPausedItem = Database['public']['Tables']['paused_items']['Row'];
type DbPausedItemInsert = Database['public']['Tables']['paused_items']['Insert'];

type Listener = () => void;

class SupabasePausedItemsStore {
  private items: PausedItem[] = [];
  private listeners: Set<Listener> = new Set();
  private isLoaded = false;

  constructor() {
    // Load items when store is created
    this.loadItems();
  }

  private async uploadImage(file: File): Promise<string | null> {
    try {
      console.log('=== IMAGE UPLOAD DEBUG START ===');
      
      // Step 1: Check user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('1. User check:', { 
        user: user ? { id: user.id, email: user.email } : null, 
        error: userError 
      });
      
      if (!user) {
        console.error('❌ No authenticated user for image upload');
        return null;
      }

      // Step 2: Prepare file upload details
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      console.log('2. File details:', {
        originalName: file.name,
        fileName,
        fileSize: file.size,
        fileType: file.type,
        bucket: 'paused-items'
      });

      // Step 3: Check if bucket exists and is accessible
      console.log('3. Checking bucket accessibility...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      console.log('3a. Available buckets:', buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })));
      
      if (bucketError) {
        console.error('3b. ❌ Error checking buckets:', bucketError);
      }

      // Step 4: Attempt file upload
      console.log('4. Starting file upload...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('paused-items')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      console.log('4a. Upload result:', { data: uploadData, error: uploadError });

      if (uploadError) {
        console.error('4b. ❌ Upload failed:', {
          message: uploadError.message,
          bucket: 'paused-items',
          fileName,
          fullError: uploadError
        });
        return null;
      }

      console.log('4c. ✅ Upload successful:', uploadData);

      // Step 5: Generate public URL
      console.log('5. Generating public URL...');
      const { data: urlData } = supabase.storage
        .from('paused-items')
        .getPublicUrl(fileName);

      console.log('5a. Public URL generated:', urlData.publicUrl);
      
      // Step 6: Verify URL accessibility
      console.log('6. Verifying URL accessibility...');
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        console.log('6a. URL check response:', { 
          status: response.status, 
          statusText: response.statusText,
          ok: response.ok 
        });
      } catch (urlError) {
        console.error('6b. ⚠️ URL verification failed:', urlError);
      }

      console.log('=== IMAGE UPLOAD DEBUG END ===');
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Unexpected error in uploadImage:', error);
      return null;
    }
  }

  private convertDbToLocal(dbItem: DbPausedItem): PausedItem {
    const pausedAt = new Date(dbItem.created_at);
    const reviewAt = new Date(dbItem.review_at);
    
    console.log('Converting DB item to local:', {
      id: dbItem.id,
      title: dbItem.title,
      url: dbItem.url,
      reason: dbItem.reason,
      rawItem: dbItem
    });
    
    // Extract store name from URL if available
    const storeName = dbItem.url ? this.extractStoreName(dbItem.url) : 'Unknown Store';
    
    return {
      id: dbItem.id,
      itemName: dbItem.title,
      storeName: storeName,
      price: dbItem.price?.toString() || '',
      imageUrl: dbItem.url || undefined,
      emotion: dbItem.reason || 'something else',
      notes: dbItem.notes || undefined,
      duration: `${dbItem.pause_duration_days} days`,
      otherDuration: undefined,
      link: dbItem.url || undefined,
      photo: null,
      photoDataUrl: undefined,
      pausedAt,
      checkInTime: this.calculateCheckInTimeDisplay(reviewAt),
      checkInDate: reviewAt
    };
  }

  private extractStoreName(url: string): string {
    if (!url) return 'Unknown Store';
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown Store';
    }
  }

  private convertLocalToDb(item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>, imageUrl?: string): Omit<DbPausedItemInsert, 'user_id'> {
    const pauseDurationDays = this.parseDurationToDays(item.duration || item.otherDuration || '24 hours');
    const reviewAt = new Date();
    reviewAt.setDate(reviewAt.getDate() + pauseDurationDays);

    // For authenticated users, prioritize uploaded images over product links
    let finalUrl = null;
    
    if (imageUrl) {
      // This is an uploaded image URL from Supabase Storage
      finalUrl = imageUrl;
      console.log('Using uploaded image URL:', imageUrl);
    } else if (item.link && !item.photo) {
      // This is a product link without an uploaded image
      finalUrl = item.link;
      console.log('Using product link:', item.link);
    }
    
    console.log('Converting local to DB:', {
      itemName: item.itemName,
      emotion: item.emotion,
      storeName: item.storeName,
      finalUrl,
      notes: item.notes,
      hasUploadedImage: !!imageUrl,
      hasProductLink: !!item.link
    });

    return {
      title: item.itemName,
      price: item.price ? parseFloat(item.price) : null,
      url: finalUrl,
      reason: item.emotion,
      notes: item.notes || null,
      pause_duration_days: pauseDurationDays,
      review_at: reviewAt.toISOString(),
      status: 'paused'
    };
  }

  private parseDurationToDays(duration: string): number {
    const durationMap: Record<string, number> = {
      '24 hours': 1,
      '3 days': 3,
      '1 week': 7,
      '2 weeks': 14,
      '1 month': 30,
      '3 months': 90
    };

    return durationMap[duration.toLowerCase()] || 1;
  }

  private calculateCheckInTimeDisplay(checkInDate: Date): string {
    const now = new Date();
    const diffMs = checkInDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours <= 0) return 'Ready to review';
    if (diffHours <= 24) return `Checking-in in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
    if (diffDays === 1) return 'Checking-in in 1 day';
    
    return `Checking-in in ${diffDays} days`;
  }

  private updateCheckInTimes(): void {
    this.items.forEach(item => {
      item.checkInTime = this.calculateCheckInTimeDisplay(item.checkInDate);
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

      this.items = data?.map(item => this.convertDbToLocal(item)) || [];
      this.updateCheckInTimes();
      this.isLoaded = true;
      
      console.log('Converted paused items:', this.items);
      
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
        emotion: item.emotion,
        storeName: item.storeName,
        hasPhoto: !!item.photo,
        hasImageUrl: !!item.imageUrl,
        hasLink: !!item.link,
        photoSize: item.photo?.size,
        photoName: item.photo?.name,
        photoType: item.photo?.type
      });

      // Step 2: Handle image upload if provided
      let uploadedImageUrl: string | null = null;
      if (item.photo) {
        console.log('2. Photo detected, starting upload process...');
        uploadedImageUrl = await this.uploadImage(item.photo);
        console.log('2a. Upload result:', { 
          success: !!uploadedImageUrl, 
          url: uploadedImageUrl 
        });
      } else {
        console.log('2. No photo to upload');
      }

      // Step 3: Convert to database format
      const dbItem = this.convertLocalToDb(item, uploadedImageUrl || undefined);
      console.log('3. Database item prepared:', dbItem);
      
      // Step 4: Save to database
      console.log('4. Saving to database...');
      const { data, error } = await supabase
        .from('paused_items')
        .insert({
          ...dbItem,
          user_id: user.id
        })
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
      const newItem = this.convertDbToLocal(data);
      this.items.unshift(newItem);
      this.updateCheckInTimes();
      this.notifyListeners();
      
      console.log('5. ✅ Item successfully added with final data:', {
        id: newItem.id,
        imageUrl: newItem.imageUrl,
        storeName: newItem.storeName,
        emotion: newItem.emotion
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
    return this.items.filter(item => item.checkInDate <= now);
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
