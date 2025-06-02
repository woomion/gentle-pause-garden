
import { Settings } from 'lucide-react';

const PauseHeader = () => {
  return (
    <header className="flex justify-between items-start mb-8">
      <div className="flex flex-col items-center flex-1">
        <div className="text-dark-gray font-medium text-lg tracking-wide mb-4">
          POCKET || PAUSE
        </div>
        
        {/* Sun ray decoration */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Center circle */}
            <div className="w-2 h-2 bg-dark-gray rounded-full"></div>
            
            {/* Rays */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-8 h-0.5 bg-dark-gray origin-left"
                  style={{
                    transform: `rotate(${i * 30}deg) translateX(8px)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <button className="p-2 text-dark-gray hover:text-taupe transition-colors">
        <Settings size={24} />
      </button>
    </header>
  );
};

export default PauseHeader;
