import { useState, useRef, useEffect } from 'react';
import { Check, MessageCircle, Lock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface NotesProps {
  notes?: string;
  onSave: (notes: string) => void;
  className?: string;
}

const Notes = ({ notes, onSave, className = "" }: NotesProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(notes || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isPremiumUser } = useSubscription();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(currentNotes.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentNotes(notes || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleClickOutside = () => {
    // Save when clicking outside
    handleSave();
  };

  if (!isEditing && !notes?.trim()) {
    if (!isPremiumUser()) {
      return (
        <div className={`flex items-center gap-2 text-muted-foreground text-sm py-2 ${className}`}>
          <Lock size={16} />
          <span>Thoughts feature (Premium)</span>
        </div>
      );
    }
    
    return (
      <button
        onClick={() => setIsEditing(true)}
        className={`flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm py-2 ${className}`}
      >
        <MessageCircle size={16} />
        Add thoughts...
      </button>
    );
  }

  if (!isEditing && notes?.trim()) {
    return (
      <div className={`${className}`}>
        <button
          onClick={() => isPremiumUser() && setIsEditing(true)}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            isPremiumUser() 
              ? 'bg-muted/50 hover:bg-muted' 
              : 'bg-muted/30 cursor-not-allowed'
          }`}
        >
          <div className="flex items-start gap-2 mb-2">
            {isPremiumUser() ? (
              <MessageCircle size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            ) : (
              <Lock size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-foreground">
              {isPremiumUser() ? 'Your thoughts:' : 'Your thoughts (Premium):'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6">
            {notes}
          </p>
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Your thoughts:</span>
        </div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            onBlur={handleClickOutside}
            onKeyDown={handleKeyDown}
            placeholder="What are you thinking about this item? Any reflections or considerations..."
            className="w-full p-3 rounded-lg bg-background border border-border resize-none min-h-[80px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3}
          />
          <button
            onClick={handleSave}
            className="absolute bottom-3 right-3 p-2 rounded-md bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700 transition-colors border border-purple-200"
            title="Save notes (⌘+Enter)"
          >
            <Check size={14} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Press ⌘+Enter to save, Escape to cancel
        </p>
      </div>
    </div>
  );
};

export default Notes;