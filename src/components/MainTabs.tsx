import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PausedSection from './PausedSection';
import PauseLogSection from './PauseLogSection';

import StatsTab from './StatsTab';
import { useSubscription } from '@/hooks/useSubscription';
import { useItemComments } from '@/hooks/useItemComments';
import { useAuth } from '@/contexts/AuthContext';

const MainTabs = ({ onSectionToggle }: { onSectionToggle?: (isAnyOpen: boolean) => void }) => {
  const [showMyPauses, setShowMyPauses] = useState(false);

  return (
    <div className="w-full mt-4 sm:mt-8">
      <div className="flex w-full gap-1 mb-2 sm:mb-12 h-16 sm:h-10">
        <Button 
          variant="ghost"
          onClick={() => {
            const newState = !showMyPauses;
            setShowMyPauses(newState);
            onSectionToggle?.(newState);
          }}
          className="w-full flex flex-col sm:flex-row items-center gap-0 rounded-full border-0 font-normal shadow-none px-0.5 sm:px-2 h-auto hover:bg-transparent focus:bg-transparent active:bg-transparent"
        >
          <div className="flex flex-col items-center gap-0">
            <span className={`text-base sm:text-base ${showMyPauses ? 'text-purple-600 font-medium' : ''}`}>
              My Pauses
            </span>
            {showMyPauses ? (
              <ChevronUp className="h-3 w-3 mt-0.5 text-purple-600" strokeWidth={3} />
            ) : (
              <ChevronDown className="h-3 w-3 mt-0.5" strokeWidth={3} />
            )}
          </div>
        </Button>
      </div>

      {showMyPauses && (
        <div className="mt-0 mb-6">
          <PausedSection />
        </div>
      )}
    </div>
  );
};

export default MainTabs;