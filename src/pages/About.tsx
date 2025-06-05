
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center mb-6">
          <Link to="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-taupe dark:text-cream" />
          </Link>
          <h1 className="text-2xl font-semibold text-taupe dark:text-cream">About Pocket Pause</h1>
        </div>

        <div className="space-y-6 text-dark-gray dark:text-cream">
          <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-taupe dark:text-cream">What is Pocket Pause?</h2>
            <p className="mb-4">
              Pocket Pause is your gentle companion for more conscious spending. Instead of rushing into purchases, 
              we help you create space—a pause—to reflect on what truly matters to you.
            </p>
            <p>
              Think of it as a digital garden where your wants can grow into deeper understanding about your 
              values, needs, and what brings you genuine joy.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-taupe dark:text-cream">How it works</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lavender text-lg">🛍️</span>
                <div>
                  <strong>Pause:</strong> When you feel the urge to buy something, pause and add it to your garden instead.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lavender text-lg">🌱</span>
                <div>
                  <strong>Reflect:</strong> Set an intention and let time pass. What emotions are driving this want?
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lavender text-lg">🌸</span>
                <div>
                  <strong>Decide:</strong> When you're ready, revisit with fresh perspective and make a conscious choice.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-taupe dark:text-cream">Our Philosophy</h2>
            <p className="mb-4">
              We believe that the most beautiful purchases are the ones that align with who you truly are. 
              By creating space between impulse and action, you give yourself the gift of clarity.
            </p>
            <p>
              This isn't about restriction or deprivation—it's about intention and joy. When you do choose 
              to buy something after a pause, it often feels more meaningful and satisfying.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-taupe dark:text-cream">Privacy & Your Data</h2>
            <p className="mb-4">
              Your pause journey is deeply personal. We use minimal data collection and never sell your information. 
              Everything you share stays private and is used only to help you reflect and grow.
            </p>
            <p>
              You can view our full <Link to="/privacy-policy" className="text-purple hover:underline">Privacy Policy</Link> for complete details.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-taupe dark:text-cream">Made with 💜</h2>
            <p>
              Pocket Pause was created with love for anyone seeking a more mindful relationship with their purchases. 
              We hope it brings you clarity, peace, and joy in your journey toward conscious living.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
