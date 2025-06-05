
import { useState } from 'react';
import { Star } from 'lucide-react';
import DonationModal from './DonationModal';

const GreaterJoyDonation = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);

  return (
    <>
      <div className="mt-12 pt-8">
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl p-6 border border-lavender/30 dark:border-gray-600 max-w-sm mx-auto md:mx-0">
          <div className="space-y-1 text-left">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Pocket Pause is independently made and still growing. To help support its next chapter:
            </p>
            
            <button 
              onClick={() => setShowDonationModal(true)}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#CAB6F7] dark:hover:text-[#CAB6F7] transition-colors underline decoration-dotted underline-offset-4 inline-flex items-center gap-2 mt-2"
            >
              <Star size={14} />
              <span>Make a one-time gift</span>
            </button>
          </div>
        </div>
      </div>

      <DonationModal 
        open={showDonationModal} 
        onOpenChange={setShowDonationModal} 
      />
    </>
  );
};

export default GreaterJoyDonation;
