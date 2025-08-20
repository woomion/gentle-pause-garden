
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PauseHeader from './PauseHeader';
import { useState } from 'react';
import UserProfileModal from './UserProfileModal';

interface PauseLogHeaderProps {
  itemCount: number;
}

const PauseLogHeader = ({ itemCount }: PauseLogHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUserModal, setShowUserModal] = useState(false);

  const handleBackClick = () => {
    // Always navigate back to the main page (home)
    navigate('/');
  };

  return (
    <>
      <PauseHeader />
      
      <div className="mb-6 mt-8">
        <button 
          onClick={handleBackClick}
          className="inline-flex items-center text-foreground hover:text-muted-foreground transition-colors mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span className="text-sm">Back</span>
        </button>
        
        <h1 className="text-2xl font-semibold text-foreground mb-4">Your Paused Decision Log</h1>
        
        {/* Show auth status for debugging */}
        {!user && itemCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm text-center">
              <strong>Guest Mode:</strong> Items stored locally only
            </p>
          </div>
        )}
      </div>
      
      <UserProfileModal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)} 
      />
    </>
  );
};

export default PauseLogHeader;
