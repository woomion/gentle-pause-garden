
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
            <h2 className="text-xl font-semibold mb-4 text-taupe dark:text-cream">Pocket Pause: <i>A gentle practice for navigating the noise</i></h2>
            <p className="mb-4">
              In a world of endless scrolls, constant offers, and split-second decisions, Pocket Pause invites you to do something revolutionary: slow down. This is a space to notice what you’re reaching for — and why.
            </p>
            <p>
              Here, small pauses become portals. You track not just what you chose or passed on, but what moved you in the moment — emotions, impulses, longing, joy. Over time, a pattern begins to emerge. A rhythm that’s more yours than the one the world tries to impose.
            </p>
            <p>
              Pocket Pause isn’t about perfection or rigid budgeting. It’s about presence. About making room for intention, reflection, and the clarity that emerges when you’re not rushed.
            </p>
            <p>
              It’s a tool. A mirror. A friend in your pocket.
And maybe, a tiny rebellion in the direction of your truest self.
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
        </div>
      </div>
    </div>
  );
};

export default About;
