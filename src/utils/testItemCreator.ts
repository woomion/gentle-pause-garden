import { supabase } from '@/integrations/supabase/client';

export async function createTestItem(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'No authenticated user found' };
    }

    console.log('Creating test item for user:', user.email);

    // Create review date 5 minutes from now
    const reviewAt = new Date();
    reviewAt.setMinutes(reviewAt.getMinutes() + 5);

    // Insert test item
    const { data, error } = await supabase
      .from('paused_items')
      .insert({
        user_id: user.id,
        title: 'Test Notification Item - Ready in 5 minutes',
        url: 'https://example.com/test-item',
        store_name: 'Test Store',
        price: 29.99,
        review_at: reviewAt.toISOString(),
        pause_duration_days: 1,
        status: 'paused',
        notes: 'This is a test item to verify notifications work',
        reason: 'Testing notification system',
        item_type: 'item'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test item:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Test item created:', data);
    console.log('📅 Will be ready at:', reviewAt.toLocaleString());
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).createTestItem = createTestItem;
}