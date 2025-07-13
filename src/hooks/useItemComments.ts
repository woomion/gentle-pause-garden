import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommentCount {
  item_id: string;
  comment_count: number;
  last_comment_at: string;
}

export const useItemComments = (userId: string | null) => {
  const [commentCounts, setCommentCounts] = useState<Map<string, CommentCount>>(new Map());
  const [unreadComments, setUnreadComments] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    console.log('🔔 useItemComments - Hook initialized with userId:', userId);
    
    if (!userId) {
      console.log('🔔 useItemComments - No userId, clearing all state');
      setCommentCounts(new Map());
      setUnreadComments(new Map());
      return;
    }

    // Clear any existing state first
    setCommentCounts(new Map());
    setUnreadComments(new Map());
    
    loadCommentCounts();

    // Create unique channel name to avoid conflicts
    const channelName = `item-comments-changes-${userId}-${Date.now()}`;
    
    // Set up real-time subscription for comment and read status changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_comments'
        },
        () => {
          console.log('🔔 Comment change detected, reloading counts');
          loadCommentCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_read_status'
        },
        () => {
          console.log('🔔 Read status change detected, reloading counts');
          loadCommentCounts();
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Cleaning up subscription:', channelName);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadCommentCounts = async () => {
    if (!userId) {
      console.log('🔔 loadCommentCounts - No userId, clearing counts');
      setCommentCounts(new Map());
      setUnreadComments(new Map());
      return;
    }

    try {
      // Get items the user can see (owned or shared)
      const { data: items, error: itemsError } = await supabase
        .from('paused_items')
        .select('id')
        .or(`user_id.eq.${userId},shared_with_partners.cs.{${userId}}`);

      if (itemsError) {
        console.error('Error loading items for comments:', itemsError);
        return;
      }

      if (!items || items.length === 0) {
        console.log('🔔 loadCommentCounts - No items found, clearing counts');
        setCommentCounts(new Map());
        setUnreadComments(new Map());
        return;
      }

      const itemIds = items.map(item => item.id);
      console.log('🔔 loadCommentCounts - Found items:', itemIds);

      // Get all comments for these items
      const { data: comments, error: commentsError } = await supabase
        .from('item_comments')
        .select('id, item_id, created_at, user_id')
        .in('item_id', itemIds)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error loading comments:', commentsError);
        return;
      }

      console.log('🔔 loadCommentCounts - Found comments:', comments?.length || 0);

      // Get read status for current user
      const { data: readStatus, error: readError } = await supabase
        .from('comment_read_status')
        .select('comment_id')
        .eq('user_id', userId);

      if (readError) {
        console.error('Error loading read status:', readError);
      }

      const readCommentIds = new Set(readStatus?.map(r => r.comment_id) || []);
      console.log('🔔 Read comment IDs:', Array.from(readCommentIds));

      // Process comment data
      const counts = new Map<string, CommentCount>();
      const unread = new Map<string, number>();

      comments?.forEach(comment => {
        // Update comment counts
        const existing = counts.get(comment.item_id);
        const commentTime = new Date(comment.created_at);
        
        if (!existing || commentTime > new Date(existing.last_comment_at)) {
          counts.set(comment.item_id, {
            item_id: comment.item_id,
            comment_count: (existing?.comment_count || 0) + 1,
            last_comment_at: comment.created_at
          });
        } else {
          counts.set(comment.item_id, {
            ...existing,
            comment_count: existing.comment_count + 1
          });
        }

        // Count unread comments (comments from other users that haven't been marked as read)
        const isFromOtherUser = comment.user_id !== userId;
        const isUnread = !readCommentIds.has(comment.id);
        
        console.log('🔔 Comment analysis:', {
          comment_id: comment.id,
          isFromOtherUser,
          isUnread,
          comment_user_id: comment.user_id,
          current_user_id: userId
        });
        
        if (isFromOtherUser && isUnread) {
          unread.set(comment.item_id, (unread.get(comment.item_id) || 0) + 1);
          console.log('🔔 Added unread comment for item:', comment.item_id);
        }
      });

      console.log('🔔 Final unread counts:', Array.from(unread.entries()));
      setCommentCounts(counts);
      setUnreadComments(unread);
    } catch (error) {
      console.error('Error loading comment counts:', error);
      setCommentCounts(new Map());
      setUnreadComments(new Map());
    }
  };

  const getCommentCount = (itemId: string): number => {
    return commentCounts.get(itemId)?.comment_count || 0;
  };

  const getUnreadCount = (itemId: string): number => {
    return unreadComments.get(itemId) || 0;
  };

  const hasNewComments = (itemId: string): boolean => {
    return getUnreadCount(itemId) > 0;
  };

  const getTotalUnreadCount = (): number => {
    const total = Array.from(unreadComments.values()).reduce((sum, count) => sum + count, 0);
    console.log('🔔 useItemComments - Unread comments map:', unreadComments);
    console.log('🔔 useItemComments - Total unread count:', total);
    return total;
  };

  const markAsRead = async (itemId: string) => {
    if (!userId) return;
    
    try {
      console.log('🔔 Marking comments as read for item:', itemId);
      
      // Get all unread comments for this item
      const { data: comments, error: commentsError } = await supabase
        .from('item_comments')
        .select('id')
        .eq('item_id', itemId)
        .neq('user_id', userId); // Only comments from other users

      if (commentsError) {
        console.error('Error getting comments to mark as read:', commentsError);
        return;
      }

      if (!comments || comments.length === 0) {
        console.log('🔔 No comments found to mark as read');
        return;
      }

      // Mark all comments from other users as read
      const readStatusInserts = comments.map(comment => ({
        user_id: userId,
        comment_id: comment.id,
        item_id: itemId
      }));

      const { error: insertError } = await supabase
        .from('comment_read_status')
        .upsert(readStatusInserts, {
          onConflict: 'user_id,comment_id',
          ignoreDuplicates: true
        });

      if (insertError) {
        console.error('Error inserting read status:', insertError);
        return;
      }

      console.log('🔔 Successfully marked comments as read, refreshing counts');
      // Refresh counts to reflect the changes
      loadCommentCounts();
    } catch (error) {
      console.error('Error marking comments as read:', error);
    }
  };

  return {
    getCommentCount,
    getUnreadCount,
    hasNewComments,
    getTotalUnreadCount,
    markAsRead,
    refreshCommentCounts: loadCommentCounts
  };
};