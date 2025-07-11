
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';

const GreaterJoyFundCTA = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <Link 
        to="/greater-joy-fund"
        className="flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Greater Joy Fund</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">See the impact of your mindful choices</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors text-sm font-medium">
          View Fund
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
};

export default GreaterJoyFundCTA;
