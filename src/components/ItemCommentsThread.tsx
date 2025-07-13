import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
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

export function ItemCommentsThread({ itemId, partners, currentUserId }: ItemCommentsThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get user display info
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

  // Load comments
  const loadComments = async () => {
    if (!itemId) return;
    
    try {
      const { data, error } = await supabase
        .from('item_comments')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error in loadComments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting || !user) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('item_comments')
        .insert({
          item_id: itemId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      // Reload comments to get the fresh data
      await loadComments();
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to send comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    loadComments();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`item-comments-${itemId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
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

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  if (isLoading) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between py-2 text-left hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-muted-foreground" />
              <h3 className="font-medium text-foreground">Reflect together</h3>
              <span className="text-xs text-muted-foreground ml-1">(tap to open)</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="text-sm text-muted-foreground mt-2">Loading conversation...</div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between py-2 text-left hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-muted-foreground" />
            <h3 className="font-medium text-foreground">Reflect together</h3>
            {comments.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {comments.length}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-1">(tap to open)</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
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
                  <Avatar className={`h-8 w-8 flex-shrink-0 ${
                    comment.user_id === currentUserId 
                      ? 'bg-purple-100 border-2 border-purple-300 dark:bg-purple-900 dark:border-purple-600' 
                      : 'bg-gray-200 border-2 border-gray-400 dark:bg-gray-700 dark:border-gray-500'
                  }`}>
                    <AvatarFallback className={`text-xs ${
                      comment.user_id === currentUserId 
                        ? 'text-purple-800 dark:text-purple-200' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
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

          {/* Input Area */}
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts on this pause..."
              className="min-h-[80px] text-sm"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="flex items-center gap-2"
              >
                <Send size={14} />
                {isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
          <div ref={messagesEndRef} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}