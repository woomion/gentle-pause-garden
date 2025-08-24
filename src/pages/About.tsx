
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-taupe dark:text-[#F9F5EB] hover:text-black dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-[#F9F5EB] mb-2">About Pocket Pause</h1>
        </div>

        {/* Content */}
        <div className="space-y-6 text-dark-gray dark:text-cream">
          <div className="p-6">
            <p className="mb-4 text-lg">
              Pocket Pause is your shopping clarity companion.
            </p>
            <p className="mb-4">
              Instead of clicking "buy now" in the moment, drop the link into Pocket Pause. Choose how long you want to wait — a day, a week, or more. The item will quietly rest on your Pause List, then return when the time is up.
            </p>
            <p className="mb-4">
              No judgment. No hard rules. Just a pause.
            </p>
            <p className="mb-6">
              Because sometimes the difference between a purchase that feels good and one that feels empty is a little space in between.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-cream">Pocket Pause helps you:</h2>
            <ul className="space-y-2 mb-6">
              <li>• Create breathing room before you buy</li>
              <li>• Separate impulse from intention</li>
              <li>• Build a list of what truly matters to you</li>
            </ul>
            
            <p className="text-lg font-medium text-black dark:text-cream">
              It's not about saying no — it's about saying yes with clarity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
