
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PauseHeader from './PauseHeader';

interface PauseLogHeaderProps {
  itemCount: number;
}

const PauseLogHeader = ({ itemCount }: PauseLogHeaderProps) => {
  const { user } = useAuth();

  return (
    <>
      <PauseHeader />
      
      <div className="mb-6 mt-8">
        <Link 
          to="/"
          className="inline-flex items-center text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span className="text-sm">Back to home</span>
        </Link>
        
        <h1 className="text-2xl font-semibold text-black dark:text-cream mb-4">Your Paused Decision Log</h1>
        
        {/* Show auth status for debugging */}
        {!user && itemCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm text-center">
              <strong>Guest Mode:</strong> Items stored locally only
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default PauseLogHeader;
