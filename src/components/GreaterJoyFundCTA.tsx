
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';

const GreaterJoyFundCTA = () => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <Link 
        to="/greater-joy-fund"
        className="flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <Heart className="w-4 h-4 text-black" />
          </div>
          <div className="max-w-32 sm:max-w-none">
            <h3 className="text-sm font-medium text-gray-900">Greater Joy Fund</h3>
            <p className="text-xs text-gray-500">See the impact of your mindful choices</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-black hover:text-gray-700 transition-colors text-sm font-medium">
          View Fund
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
};

export default GreaterJoyFundCTA;
