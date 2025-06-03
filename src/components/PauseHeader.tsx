
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import SettingsSidebar from './SettingsSidebar';

const PauseHeader = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="relative mb-18">
        <div className="text-center">
          <Link to="/" className="text-black font-medium text-lg tracking-wide mb-2 hover:text-gray-600 transition-colors inline-block">
            POCKET || PAUSE
          </Link>
        </div>
        
        <button 
          className="absolute top-6 right-0 p-2 text-black hover:text-taupe transition-colors"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={24} />
        </button>
      </header>
      
      <SettingsSidebar open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default PauseHeader;
