
import { useState } from 'react';
import { Heart } from 'lucide-react';
import DonationModal from './DonationModal';

const GreaterJoyDonation = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);

  return (
    <>
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-600 text-center">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Pocket Pause is independently made and still growing.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            If it's helped you take a breath or shift a habit, you can support its next chapter:
          </p>
          
          <button 
            onClick={() => setShowDonationModal(true)}
            className="inline-flex items-center gap-2 bg-[#CAB6F7] hover:bg-[#B8A3F5] text-black font-medium px-6 py-3 rounded-lg transition-colors mt-4"
          >
            <Heart size={16} />
            Make a one-time gift
          </button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
            Your support helps bring new features to life — and helps keep the pause gentle, clear, and useful for more people.
          </p>
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
