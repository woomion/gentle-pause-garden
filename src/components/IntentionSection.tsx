
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, useRef, useEffect } from 'react';

interface IntentionSectionProps {
  intention: string;
  onSave: (intention: string) => void;
}

const IntentionSection = ({ intention, onSave }: IntentionSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(intention);
  const [inspirationOpen, setInspirationOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const displayText = intention || 'Give your Joy Fund a name — like "More calm, less clutter" or "Aligned with my values"';
  const isPlaceholder = !intention;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditValue(intention);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(editValue.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(intention);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  return (
    <div className="mb-8">
      <div className="mb-2">
        {isEditing ? (
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Give your Joy Fund a name — like "More calm, less clutter" or "Aligned with my values"'
                className="text-xl font-bold leading-relaxed resize-none min-h-[60px] bg-transparent border-2 border-gray-300 dark:border-gray-600 focus:border-[#CAB6F7] dark:focus:border-[#CAB6F7] text-black dark:text-[#F9F5EB] pr-12"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB] h-8 w-8 bg-transparent hover:bg-transparent flex-shrink-0"
                disabled
              >
                <Edit2 size={16} />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-[#CAB6F7] hover:bg-[#B8A3F5] text-black font-medium"
              >
                <Check size={14} className="mr-1" />
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB]"
              >
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <h2 
              className={`text-xl font-bold leading-relaxed cursor-pointer pr-10 ${
                isPlaceholder 
                  ? 'text-gray-400 dark:text-gray-500 italic' 
                  : 'text-black dark:text-[#F9F5EB]'
              }`}
              onClick={handleEdit}
            >
              {displayText}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="absolute right-0 top-0 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB] h-8 w-8 bg-transparent hover:bg-transparent flex-shrink-0"
            >
              <Edit2 size={16} />
            </Button>
          </div>
        )}
      </div>
      
      {/* Only show helper text and inspiration when no intention is set */}
      {!intention && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">
            A phrase to come back to, to help you choose with clarity and care.
          </p>
          <Dialog open={inspirationOpen} onOpenChange={setInspirationOpen}>
            <DialogTrigger asChild>
              <button className="text-sm text-[#8B5A96] hover:text-[#6B4C9A] underline">
                Need inspiration?
              </button>
            </DialogTrigger>
            <DialogContent className="bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-gray-700 max-w-xs sm:max-w-sm">
              <DialogHeader className="pt-4">
                <DialogTitle className="text-black dark:text-[#F9F5EB] text-lg leading-relaxed">
                  Here are a few ways other people have named their Joy Fund:
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-black dark:text-[#F9F5EB] pb-2">
                <p>&quot;More calm in my day&quot;</p>
                <p>&quot;Presence &gt; pressure&quot;</p>
                <p>&quot;One good choice at a time&quot;</p>
                <p>&quot;Peace over urgency&quot;</p>
                <p>&quot;More walks, fewer carts&quot;</p>
                <p>&quot;Rooted, not rushed&quot;</p>
                <p>&quot;Space to choose what matters&quot;</p>
                <p>&quot;Trusting myself again&quot;</p>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default IntentionSection;
