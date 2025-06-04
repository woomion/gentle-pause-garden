
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IntentionSectionProps {
  intention: string;
  onEdit: () => void;
}

const IntentionSection = ({ intention, onEdit }: IntentionSectionProps) => {
  const displayText = intention || "Enter a title for your joy fund (ex: More peace in my day)";
  const isPlaceholder = !intention;
  
  return (
    <div className="mb-8 mt-12">
      <h1 className="text-xl font-medium text-black dark:text-[#F9F5EB] mb-2">
        Your Greater Joy Fund
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-8">
        A growing reflection of your mindful choices
      </p>
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-1">
          <h2 
            className={`text-xl font-bold leading-relaxed flex-1 cursor-pointer ${
              isPlaceholder 
                ? 'text-gray-400 dark:text-gray-500 italic' 
                : 'text-black dark:text-[#F9F5EB]'
            }`}
            onClick={onEdit}
          >
            {displayText}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="ml-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB] h-8 w-8 bg-transparent hover:bg-transparent"
          >
            <Edit2 size={16} />
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
        A place to remember what you're reaching for
      </p>
    </div>
  );
};

export default IntentionSection;
