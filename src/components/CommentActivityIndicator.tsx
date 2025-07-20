
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommentActivityIndicatorProps {
  commentCount: number;
  unreadCount: number;
  hasNewActivity: boolean;
  lastComment?: string;
  className?: string;
}

export function CommentActivityIndicator({ 
  commentCount, 
  unreadCount, 
  hasNewActivity, 
  lastComment,
  className = "" 
}: CommentActivityIndicatorProps) {
  if (commentCount === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center">
        <MessageCircle 
          size={16} 
          className={`text-muted-foreground ${hasNewActivity ? 'animate-pulse' : ''}`} 
        />
        {hasNewActivity && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
        )}
      </div>
      
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="h-5 min-w-5 px-1.5 text-xs animate-scale-in"
        >
          {unreadCount}
        </Badge>
      )}
      
      {lastComment && unreadCount > 0 && (
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            "{lastComment}"
          </p>
        </div>
      )}
    </div>
  );
}
