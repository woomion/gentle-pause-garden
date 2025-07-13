import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface Partner {
  partner_id: string;
  partner_email: string;
  partner_name: string;
}

interface ItemCommentsThreadProps {
  itemId: string;
  partners: Partner[];
  currentUserId: string;
}

export const ItemCommentsThread = ({ itemId, partners, currentUserId }: ItemCommentsThreadProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load comments
  useEffect(() => {
    loadComments();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`item-comments-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'item_comments',
          filter: `item_id=eq.${itemId}`
        },
        (payload) => {
          console.log('🔔 New comment received:', payload);
          // Add the new comment immediately to the state
          const newComment = payload.new as Comment;
          setComments(prev => [...prev, newComment]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'item_comments',
          filter: `item_id=eq.${itemId}`
        },
        () => {
          loadComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'item_comments',
          filter: `item_id=eq.${itemId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('item_comments')
        .select('id, content, created_at, user_id')
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('item_comments')
        .insert({
          item_id: itemId,
          user_id: currentUserId,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      toast({
        title: "Message sent",
        description: "Your reflection has been shared with your partner.",
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  const getUserDisplayName = (userId: string) => {
    if (userId === currentUserId) {
      return 'You';
    }
    
    const partner = partners.find(p => p.partner_id === userId);
    return partner?.partner_name || 'Partner';
  };

  const getUserInitials = (userId: string) => {
    if (userId === currentUserId) {
      return 'Y';
    }
    
    const partner = partners.find(p => p.partner_id === userId);
    const name = partner?.partner_name || 'Partner';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-muted-foreground" />
          <h3 className="font-medium text-foreground">Reflect together</h3>
        </div>
        <div className="text-sm text-muted-foreground">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-muted-foreground" />
          <h3 className="font-medium text-foreground">Reflect together</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          You can reflect together now, or wait until the timer ends — whatever feels right.
        </p>
      </div>

      {/* Comments Thread */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-muted">
                  {getUserInitials(comment.user_id)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {getUserDisplayName(comment.user_id)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share your thoughts here..."
          className="min-h-[80px] resize-none"
          disabled={isSubmitting}
        />
        <div className="flex justify-end">
          <Button
            onClick={submitComment}
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
            className="flex items-center gap-2"
          >
            <Send size={14} />
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};