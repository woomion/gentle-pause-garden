import { Settings } from 'lucide-react';

const PauseHeader = () => {
  return (
    <header className="relative mb-24">
      <div className="text-center">
        <div className="text-black font-medium text-lg tracking-wide mb-2">
          POCKET || PAUSE
        </div>
      </div>
      
      <button className="absolute top-6 right-0 p-2 text-black hover:text-taupe transition-colors">
        <Settings size={24} />
      </button>
    </header>
  );
};

export default PauseHeader;
