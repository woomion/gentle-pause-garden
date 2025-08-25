import React from 'react';
import { MessageCircle } from 'lucide-react';

interface ItemCommentsThreadProps {
  itemId: string;
  currentUserId?: string;
  autoExpand?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

// Temporarily disabled - requires database tables that don't exist yet
export const ItemCommentsThread: React.FC<ItemCommentsThreadProps> = ({ 
  itemId, 
  currentUserId,
  autoExpand,
  isOpen = false, 
  onToggle 
}) => {
  return (
    <div className="p-4 text-center text-muted-foreground border rounded-lg">
      <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
      <p className="text-sm">Comments feature temporarily disabled</p>
      <p className="text-xs">Will be available in a future update</p>
    </div>
  );
};

export default ItemCommentsThread;