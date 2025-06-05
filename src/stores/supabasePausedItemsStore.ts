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
        fileType: file.type
      });

      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('paused-items')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image to Supabase Storage:', uploadError);
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
    
    return {
      id: dbItem.id,
      itemName: dbItem.title,
      storeName: '', // We'll need to store this separately or add to DB
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

  private convertLocalToDb(item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>, imageUrl?: string): Omit<DbPausedItemInsert, 'user_id'> {
    const pauseDurationDays = this.parseDurationToDays(item.duration || item.otherDuration || '24 hours');
    const reviewAt = new Date();
    reviewAt.setDate(reviewAt.getDate() + pauseDurationDays);

    return {
      title: item.itemName,
      price: item.price ? parseFloat(item.price) : null,
      url: imageUrl || item.link || null,
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
      const { data, error } = await supabase
        .from('paused_items')
        .select('*')
        .eq('status', 'paused')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading paused items:', error);
        return;
      }

      this.items = data?.map(item => this.convertDbToLocal(item)) || [];
      this.updateCheckInTimes();
      this.isLoaded = true;
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
        hasPhoto: !!item.photo,
        hasImageUrl: !!item.imageUrl,
        photoSize: item.photo?.size,
        photoName: item.photo?.name
      });

      // Upload image if provided
      let finalImageUrl: string | null = null;
      if (item.photo) {
        console.log('Uploading photo to Supabase Storage...');
        finalImageUrl = await this.uploadImage(item.photo);
        if (finalImageUrl) {
          console.log('Photo uploaded successfully with URL:', finalImageUrl);
        } else {
          console.error('Failed to upload photo to Supabase Storage');
        }
      } else if (item.imageUrl) {
        // Use the parsed image URL from the link
        finalImageUrl = item.imageUrl;
        console.log('Using parsed image URL:', finalImageUrl);
      }

      const dbItem = this.convertLocalToDb(item, finalImageUrl || undefined);
      
      console.log('Saving item to database with final URL:', dbItem.url);
      
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
        return;
      }

      console.log('Item saved to database successfully:', data);

      const newItem = this.convertDbToLocal(data);
      this.items.unshift(newItem);
      this.updateCheckInTimes();
      this.notifyListeners();
      
      console.log('Item successfully added with final image URL:', newItem.imageUrl);
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
