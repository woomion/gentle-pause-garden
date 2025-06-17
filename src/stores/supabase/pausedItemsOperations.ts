
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from '@/services/imageUploadService';
import { convertDbToLocal, convertLocalToDb } from '@/utils/pausedItemsConverters';
import { PausedItem } from './types';

export class PausedItemsOperations {
  static async loadItems(): Promise<PausedItem[]> {
    try {
      console.log('Loading paused items from Supabase...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, skipping load');
        return [];
      }

      const { data, error } = await supabase
        .from('paused_items')
        .select('*')
        .eq('status', 'paused')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading paused items:', error);
        return [];
      }

      console.log('Raw paused items data from Supabase:', data);
      const items = data?.map(item => convertDbToLocal(item)) || [];
      console.log('Converted paused items:', items);
      
      return items;
    } catch (error) {
      console.error('Error in loadItems:', error);
      return [];
    }
  }

  static async addItem(item: Omit<PausedItem, 'id' | 'pausedAt' | 'checkInTime' | 'checkInDate'>): Promise<PausedItem | null> {
    try {
      console.log('=== ADD ITEM DEBUG START ===');
      
      // Step 1: Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        return null;
      }

      console.log('1. Adding item for user:', user.id, 'with data:', {
        itemName: item.itemName,
        storeName: item.storeName,
        emotion: item.emotion,
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
        return null;
      }

      console.log('4b. ✅ Database save successful:', data);

      // Step 5: Convert back to local format
      const newItem = convertDbToLocal(data);
      
      console.log('5. ✅ Item successfully added with final data:', {
        id: newItem.id,
        storeName: newItem.storeName,
        imageUrl: newItem.imageUrl,
        emotion: newItem.emotion
      });
      
      console.log('=== ADD ITEM DEBUG END ===');
      return newItem;
    } catch (error) {
      console.error('❌ Unexpected error in addItem:', error);
      return null;
    }
  }

  static async removeItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('paused_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing paused item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeItem:', error);
      return false;
    }
  }
}
