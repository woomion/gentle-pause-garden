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
    
    // Set up real-time subscription for comment changes
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

      // Get comment counts and latest comment dates for these items
      const { data: comments, error: commentsError } = await supabase
        .from('item_comments')
        .select('item_id, created_at, user_id')
        .in('item_id', itemIds);

      if (commentsError) {
        console.error('Error loading comments:', commentsError);
        return;
      }

      console.log('🔔 loadCommentCounts - Found comments:', comments?.length || 0);

      // Process comment data
      const counts = new Map<string, CommentCount>();
      const unread = new Map<string, number>();

      comments?.forEach(comment => {
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

        // Count unread comments (comments from other users in last 24 hours)
        const isRecent = commentTime > new Date(Date.now() - 24 * 60 * 60 * 1000);
        const isFromOtherUser = comment.user_id !== userId;
        
        console.log('🔔 Comment analysis:', {
          comment_id: comment.item_id,
          commentTime: commentTime.toISOString(),
          isRecent,
          isFromOtherUser,
          comment_user_id: comment.user_id,
          current_user_id: userId
        });
        
        if (isRecent && isFromOtherUser) {
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
      // For now, simply remove from unread count
      // In a more sophisticated system, you'd track read status in the database
      setUnreadComments(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
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