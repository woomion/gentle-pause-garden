
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';

export class CommentNotificationService {
  private static instance: CommentNotificationService;
  private notificationBatch: Map<string, { count: number; lastComment: string; timer: NodeJS.Timeout }> = new Map();

  private constructor() {}

  static getInstance(): CommentNotificationService {
    if (!CommentNotificationService.instance) {
      CommentNotificationService.instance = new CommentNotificationService();
    }
    return CommentNotificationService.instance;
  }

  async setupCommentNotifications(userId: string) {
    console.log('🔔 Setting up comment notifications for user:', userId);
    
    // Set up real-time subscription for comments on items the user can see
    const channel = supabase
      .channel(`comment-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'item_comments'
        },
        async (payload) => {
          console.log('🔔 New comment detected:', payload);
          await this.handleNewComment(payload.new, userId);
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Cleaning up comment notifications');
      supabase.removeChannel(channel);
    };
  }

  private async handleNewComment(comment: any, currentUserId: string) {
    // Don't notify about own comments
    if (comment.user_id === currentUserId) {
      return;
    }

    try {
      // Check if the user can see this item
      const { data: item, error } = await supabase
        .from('paused_items')
        .select('title, shared_with_partners, user_id')
        .eq('id', comment.item_id)
        .single();

      if (error || !item) {
        console.error('Error fetching item for comment notification:', error);
        return;
      }

      // Check if current user has access to this item
      const hasAccess = item.user_id === currentUserId || 
                       (item.shared_with_partners && item.shared_with_partners.includes(currentUserId));

      if (!hasAccess) {
        return;
      }

      // Get commenter info
      const { data: profiles } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', comment.user_id)
        .single();

      const commenterName = profiles?.first_name || 'Partner';

      // Batch notifications to avoid spam
      await this.batchNotification(comment.item_id, {
        itemTitle: item.title,
        commenterName,
        comment: comment.content
      });

    } catch (error) {
      console.error('Error handling new comment notification:', error);
    }
  }

  private async batchNotification(itemId: string, data: { itemTitle: string; commenterName: string; comment: string }) {
    const existing = this.notificationBatch.get(itemId);
    
    if (existing) {
      // Update existing batch
      existing.count += 1;
      existing.lastComment = data.comment;
      clearTimeout(existing.timer);
    } else {
      // Create new batch
      this.notificationBatch.set(itemId, {
        count: 1,
        lastComment: data.comment,
        timer: setTimeout(() => {}, 0) // Will be set below
      });
    }

    const batch = this.notificationBatch.get(itemId)!;
    
    // Set timer to send notification after 3 seconds of inactivity
    batch.timer = setTimeout(() => {
      this.sendBatchedNotification(itemId, data.itemTitle, data.commenterName, batch);
      this.notificationBatch.delete(itemId);
    }, 3000);
  }

  private sendBatchedNotification(itemId: string, itemTitle: string, commenterName: string, batch: { count: number; lastComment: string }) {
    const title = batch.count === 1 
      ? `${commenterName} commented on "${itemTitle}"`
      : `${commenterName} and others commented on "${itemTitle}"`;

    const body = batch.count === 1 
      ? batch.lastComment
      : `${batch.count} new comments`;

    notificationService.showNotification(title, {
      body,
      tag: `comment-${itemId}`,
      icon: '/favicon.ico',
      data: { itemId, action: 'view_comments' }
    });
  }

  async markCommentsAsRead(itemId: string, userId: string) {
    console.log('🔔 Marking comments as read for item:', itemId);
    
    // Clear any pending notifications for this item
    const batch = this.notificationBatch.get(itemId);
    if (batch) {
      clearTimeout(batch.timer);
      this.notificationBatch.delete(itemId);
    }

    // The actual marking as read is handled by useItemComments hook
  }
}

export const commentNotificationService = CommentNotificationService.getInstance();
