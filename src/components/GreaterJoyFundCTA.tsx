
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const GreaterJoyFundCTA = () => {
  return (
    <div className="mb-8">
      <Link 
        to="/greater-joy-fund"
        className="block w-full p-4 bg-white/60 dark:bg-white/10 rounded-lg hover:bg-white/80 dark:hover:bg-white/20 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB] mb-1">
              Your Greater Joy Fund
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              See the impact of your mindful choices
            </p>
          </div>
          <ArrowRight 
            size={20} 
            className="text-taupe dark:text-[#C8B6E2] group-hover:translate-x-1 transition-transform" 
          />
        </div>
      </Link>
    </div>
  );
};

export default GreaterJoyFundCTA;
