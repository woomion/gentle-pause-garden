
import { Settings } from 'lucide-react';

const PauseHeader = () => {
  return (
    <header className="flex justify-between items-start mb-8">
      <div className="flex flex-col items-center flex-1">
        <div className="text-black font-medium text-lg tracking-wide mb-6">
          POCKET || PAUSE
        </div>
      </div>
      
      <button className="p-2 text-black hover:text-taupe transition-colors">
        <Settings size={24} />
      </button>
    </header>
  );
};

export default PauseHeader;
