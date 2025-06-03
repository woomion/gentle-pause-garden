
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header with back button */}
        <header className="relative mb-8">
          <Link 
            to="/"
            className="absolute left-0 top-6 p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          
          <div className="text-center">
            <Link 
              to="/"
              className="text-black dark:text-[#F9F5EB] font-medium text-lg tracking-wide mb-2 hover:text-taupe transition-colors"
            >
              POCKET || PAUSE
            </Link>
          </div>
        </header>

        {/* About content */}
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] text-center">
            About Pocket Pause
          </h1>
          
          <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6">
            <p className="text-black dark:text-[#F9F5EB] leading-relaxed">
              Pocket Pause is your conscious spending companion. We help you pause, reflect, and make mindful purchasing decisions that align with your values and goals.
            </p>
            
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">How it works</h3>
              <ul className="space-y-2 text-black dark:text-[#F9F5EB]">
                <li>• Pause before purchasing items that catch your eye</li>
                <li>• Reflect on your emotions and motivations</li>
                <li>• Give yourself time to make conscious decisions</li>
                <li>• Review your pause log to understand your spending patterns</li>
              </ul>
            </div>
            
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">Benefits</h3>
              <ul className="space-y-2 text-black dark:text-[#F9F5EB]">
                <li>• Reduce impulse purchases</li>
                <li>• Increase mindful spending</li>
                <li>• Better align purchases with your values</li>
                <li>• Save money for things that truly matter</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs space-y-1" style={{ color: '#A6A1AD' }}>
          <p>|| Pocket Pause—your conscious spending companion</p>
        </div>
      </div>
    </div>
  );
};

export default About;
