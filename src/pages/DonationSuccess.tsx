
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PauseHeader from '../components/PauseHeader';

const DonationSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-md mx-auto px-6 py-8">
        <PauseHeader />
        
        <div className="text-center space-y-6 mt-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
            Thank You! 🙏
          </h1>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>
              Your donation helps keep Pocket Pause ad-free and independent.
            </p>
            <p>
              Every contribution, no matter the size, makes a difference in building something simple and useful.
            </p>
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => navigate('/')}
              className="bg-[#CAB6F7] hover:bg-[#B8A3F5] text-black font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Back to Pocket Pause
            </button>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting automatically in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationSuccess;
