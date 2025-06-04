
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState, useRef, useEffect } from 'react';

interface IntentionSectionProps {
  intention: string;
  onSave: (intention: string) => void;
}

const IntentionSection = ({ intention, onSave }: IntentionSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(intention);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const displayText = intention || "Enter a title for your joy fund (ex: More peace in my day)";
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
    <div className="mb-8 mt-12">
      <h1 className="text-xl font-medium text-black dark:text-[#F9F5EB] mb-2">
        Your Greater Joy Fund
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-8">
        A growing reflection of your mindful choices
      </p>
      
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a title for your joy fund (ex: More peace in my day)"
              className="text-xl font-bold leading-relaxed resize-none min-h-[60px] bg-transparent border-2 border-gray-300 dark:border-gray-600 focus:border-[#CAB6F7] dark:focus:border-[#CAB6F7] text-black dark:text-[#F9F5EB]"
            />
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
          <div className="flex items-center gap-2">
            <h2 
              className={`text-xl font-bold leading-relaxed cursor-pointer ${
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
              className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB] h-8 w-8 bg-transparent hover:bg-transparent flex-shrink-0"
            >
              <Edit2 size={16} />
            </Button>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
        A place to remember what you're reaching for
      </p>
    </div>
  );
};

export default IntentionSection;
