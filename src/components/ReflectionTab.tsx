
import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ReflectionTabProps {
  reflection: string;
  setReflection: (value: string) => void;
}

const ReflectionTab = ({ reflection, setReflection }: ReflectionTabProps) => {
  const [isReflectionComplete, setIsReflectionComplete] = useState(false);
  const [isEditingReflection, setIsEditingReflection] = useState(false);

  const handleCompleteReflection = () => {
    if (reflection.trim()) {
      setIsReflectionComplete(true);
      setIsEditingReflection(false);
    }
  };

  const handleEditReflection = () => {
    setIsReflectionComplete(false);
    setIsEditingReflection(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-black dark:text-[#F9F5EB]">
          Your reason for pausing—in your own words
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Use this space to get clear on what matters most to you right now. Let your reasons guide your choices.
        </p>
      </div>
      
      {!isReflectionComplete && !isEditingReflection && (
        <>

          <div className="relative">
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              onFocus={() => setIsEditingReflection(true)}
              placeholder="Write your reflection here. You can keep it short, or let it unfold."
              className="min-h-[100px] rounded-xl border border-gray-200/60 dark:border-gray-600 text-black dark:text-[#F9F5EB] resize-none bg-white/70 dark:bg-white/10"
            />
          </div>
        </>
      )}

      {isEditingReflection && (
        <>

          <div className="space-y-3">
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Write your reflection here. You can keep it short, or let it unfold."
              className="min-h-[100px] rounded-xl border border-gray-200/60 dark:border-gray-600 text-black dark:text-[#F9F5EB] resize-none bg-white/70 dark:bg-white/10"
              autoFocus
            />
            {reflection.trim() && (
              <div className="flex justify-end">
                <Button
                  onClick={handleCompleteReflection}
                  className="bg-lavender hover:bg-lavender/90 text-black font-medium px-6 py-2 rounded-2xl"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {isReflectionComplete && (
        <div className="relative">
          <div className="flex items-start gap-2">
            <p className="text-black dark:text-[#F9F5EB] leading-relaxed flex-1">
              {reflection}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditReflection}
              className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB] h-8 w-8 bg-transparent hover:bg-transparent"
            >
              <Edit2 size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReflectionTab;
