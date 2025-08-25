import { useState } from 'react';

interface CommentCount {
  item_id: string;
  comment_count: number;
  last_comment_at: string;
}

// Temporarily disabled - requires database tables that don't exist yet
export const useItemComments = (userId: string | null) => {
  const [commentCounts] = useState<Map<string, CommentCount>>(new Map());
  const [unreadComments] = useState<Map<string, number>>(new Map());

  return {
    commentCounts,
    unreadComments,
    refreshCommentCounts: async () => {},
    markCommentsAsRead: async () => {},
    markAsRead: async () => {}, // Added for compatibility
    getUnreadCount: () => 0,
    getTotalComments: () => 0,
    hasUnreadComments: () => false,
  };
};