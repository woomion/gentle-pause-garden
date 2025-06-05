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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for image upload');
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('Starting image upload to Supabase Storage:', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        bucket: 'paused-items'
      });

      // First check if bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets);
      
      if (bucketError) {
        console.error('Error checking buckets:', bucketError);
      }

      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('paused-items')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image to Supabase Storage:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          bucket: 'paused-items',
          fileName
        });
        return null;
      }

      console.log('Image uploaded successfully:', uploadData);

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('paused-items')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
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

    // CRITICAL: For authenticated users, we need to store images differently
    // If we have an uploaded image URL, use that
    // If we have a product link and no uploaded image, store the link separately
    let finalUrl = null;
    
    if (imageUrl) {
      // This is an uploaded image - store it in the url field
      finalUrl = imageUrl;
      console.log('Using uploaded image URL:', imageUrl);
    } else if (item.link && !item.photo) {
      // This is a product link without an uploaded image - store the link
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
      reason: item.emotion, // Store emotion in reason field
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      console.log('Adding item with data:', {
        itemName: item.itemName,
        emotion: item.emotion,
        storeName: item.storeName,
        hasPhoto: !!item.photo,
        hasImageUrl: !!item.imageUrl,
        hasLink: !!item.link,
        photoSize: item.photo?.size,
        photoName: item.photo?.name
      });

      // Upload image if provided
      let finalImageUrl: string | null = null;
      if (item.photo) {
        console.log('Attempting to upload photo to Supabase Storage...');
        finalImageUrl = await this.uploadImage(item.photo);
        if (finalImageUrl) {
          console.log('Photo uploaded successfully with URL:', finalImageUrl);
        } else {
          console.error('Failed to upload photo to Supabase Storage - will proceed without image');
        }
      }

      const dbItem = this.convertLocalToDb(item, finalImageUrl || undefined);
      
      console.log('Saving item to database:', dbItem);
      
      const { data, error } = await supabase
        .from('paused_items')
        .insert({
          ...dbItem,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding paused item to database:', error);
        console.error('Database error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      console.log('Item saved to database successfully:', data);

      const newItem = this.convertDbToLocal(data);
      this.items.unshift(newItem);
      this.updateCheckInTimes();
      this.notifyListeners();
      
      console.log('Item successfully added with final data:', {
        id: newItem.id,
        imageUrl: newItem.imageUrl,
        storeName: newItem.storeName,
        emotion: newItem.emotion
      });
    } catch (error) {
      console.error('Error in addItem:', error);
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
