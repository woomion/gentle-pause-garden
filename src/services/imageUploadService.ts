
import { supabase } from '@/integrations/supabase/client';

export const uploadImage = async (file: File): Promise<string | null> => {
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
    console.log('🎯 Final URL being returned:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Unexpected error in uploadImage:', error);
    return null;
  }
};
