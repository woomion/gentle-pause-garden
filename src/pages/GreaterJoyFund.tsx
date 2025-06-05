
import { useState } from 'react';
import { ArrowLeft, Heart, Gift, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import DonationModal from '../components/DonationModal';
import GreaterJoyHeader from '../components/GreaterJoyHeader';

const GreaterJoyFund = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);

  const handleDonateClick = () => {
    setShowDonationModal(true);
  };

  return (
    <>
      <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center mb-6">
            <Link to="/" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-taupe dark:text-cream" />
            </Link>
            <h1 className="text-2xl font-semibold text-taupe dark:text-cream">Greater Joy Fund</h1>
          </div>

          <GreaterJoyHeader />

          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-purple" />
                <h2 className="text-xl font-semibold text-taupe dark:text-cream">What is the Greater Joy Fund?</h2>
              </div>
              <p className="text-dark-gray dark:text-cream mb-4">
                The Greater Joy Fund transforms your paused purchases into meaningful impact. Instead of buying 
                something you've decided you don't truly need, you can redirect that money toward causes that 
                create lasting joy in the world.
              </p>
              <p className="text-dark-gray dark:text-cream">
                It's about turning moments of conscious choice into ripples of positive change—for both 
                yourself and others.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="w-6 h-6 text-purple" />
                <h2 className="text-xl font-semibold text-taupe dark:text-cream">How it works</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-lavender text-lg">1️⃣</span>
                  <div className="text-dark-gray dark:text-cream">
                    <strong>Pause & Reflect:</strong> You decide not to purchase something after your pause period.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lavender text-lg">2️⃣</span>
                  <div className="text-dark-gray dark:text-cream">
                    <strong>Choose Joy:</strong> Donate all or part of what you would have spent to meaningful causes.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lavender text-lg">3️⃣</span>
                  <div className="text-dark-gray dark:text-cream">
                    <strong>Feel the Impact:</strong> Experience the unique satisfaction of conscious choice and generosity.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-purple" />
                <h2 className="text-xl font-semibold text-taupe dark:text-cream">Where your donations go</h2>
              </div>
              <p className="text-dark-gray dark:text-cream mb-4">
                We partner with carefully selected organizations that create meaningful, lasting impact:
              </p>
              <div className="space-y-3 text-dark-gray dark:text-cream">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-lavender rounded-full"></span>
                  <span><strong>Mental Health Support:</strong> Organizations providing accessible therapy and wellness resources</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-lavender rounded-full"></span>
                  <span><strong>Environmental Protection:</strong> Projects focused on sustainability and climate action</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-lavender rounded-full"></span>
                  <span><strong>Education Access:</strong> Programs that provide learning opportunities to underserved communities</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-lavender rounded-full"></span>
                  <span><strong>Local Community Support:</strong> Grassroots organizations creating positive change</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-lavender/20 to-purple/20 dark:from-lavender/10 dark:to-purple/10 rounded-lg p-6 border border-lavender/30">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-purple" />
                <h2 className="text-xl font-semibold text-taupe dark:text-cream">Ready to create greater joy?</h2>
              </div>
              <p className="text-dark-gray dark:text-cream mb-6">
                Transform your mindful spending choices into positive impact. Every donation, no matter the size, 
                creates ripples of change and contributes to a more joyful world.
              </p>
              <button
                onClick={handleDonateClick}
                className="w-full bg-purple hover:bg-purple/90 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Make a Donation
              </button>
            </div>

            <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The Greater Joy Fund is managed transparently. You'll receive updates on how your contributions 
                are making a difference in the world.
              </p>
            </div>
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

export default GreaterJoyFund;
