
import { useState } from 'react';
import { Star } from 'lucide-react';
import DonationModal from './DonationModal';

const GreaterJoyDonation = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);

  return (
    <>
      <div className="mt-12 pt-8">
        <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-6 border border-lavender/30 dark:border-gray-600 max-w-sm mx-auto md:mx-0">
          <div className="space-y-1 text-left">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Pocket Pause is independently made and still growing.
              If it's helped you take a breath or shift a habit, you can support its next chapter:
            </p>
            
            <button 
              onClick={() => setShowDonationModal(true)}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#CAB6F7] dark:hover:text-[#CAB6F7] transition-colors underline decoration-dotted underline-offset-4 inline-flex items-center gap-2 mt-2"
            >
              <Star size={14} />
              <span>Make a one-time gift</span>
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pt-1">
              Your support helps bring new features to life — and helps keep the pause gentle, clear, and useful for more people.
            </p>
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
