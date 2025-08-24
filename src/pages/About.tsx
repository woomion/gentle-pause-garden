
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
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-cream">Pocket Pause: <i>A gentle practice for navigating the noise</i></h2>
            <p className="mb-4">
              In a world of endless scrolls, constant offers, and split-second decisions, Pocket Pause invites you to do something revolutionary: slow down. This is a space to notice what you're reaching for — and why.
            </p>
            <p className="mb-4">
              Here, small pauses become portals. You track not just what you chose or passed on, but what moved you in the moment — emotions, impulses, longing, joy. Over time, a pattern begins to emerge. A rhythm that's more yours than the one the world tries to impose.
            </p>
            <p className="mb-4">
              Pocket Pause isn't about perfection or rigid budgeting. It's about presence. About making room for intention, reflection, and the clarity that emerges when you're not rushed.
            </p>
            <p className="mb-4">
              It's a tool. A mirror. A friend in your pocket.
            </p>
            <p>
              And maybe, a tiny rebellion in the direction of your truest self.
            </p>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-cream">How it works</h2>
            <div className="space-y-4">
              <p className="mb-4">
                Pocket Pause is a gentle space to notice the moment before a decision—especially the kind that asks:
              </p>
              <div className="pl-4 border-l-2 border-lavender/30 dark:border-gray-600">
                <p className="italic text-[#6B4C9A] dark:text-cream">Do I really need this?</p>
                <p className="italic text-[#6B4C9A] dark:text-cream">Will this bring me closer to who I want to be?</p>
                <p className="italic text-[#6B4C9A] dark:text-cream">What am I feeling right now?</p>
              </div>
              
              <p className="font-medium text-black dark:text-cream mt-6 mb-4">Here's how it flows:</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-black dark:text-cream mb-2">1. Add a Pause</h3>
                  <p>When you feel the pull to buy something, open Pocket Pause. Add the item with its link, name the emotion you're feeling, and choose which store or category it's from. Take a moment to reflect on why this caught your attention.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-black dark:text-cream mb-2">2. Set Your Pause Duration</h3>
                  <p>Choose how long you want to pause—from a few hours to several weeks. This gives your impulse time to settle and lets you revisit the decision with fresh perspective.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-black dark:text-cream mb-2">3. Reflect and Decide</h3>
                  <p>When your pause period ends, you'll get a gentle notification to review the item. Look at the details, remember why you wanted it, and make a conscious choice: "Take me to the link" to purchase, or "Mark as purchased" if you bought it elsewhere, or "Let it go" if you've moved on.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-black dark:text-cream mb-2">4. Track Your Journey</h3>
                  <p>Every decision—whether you purchase or let go—gets logged in your Pause Log. Over time, you'll see patterns in your emotions, spending triggers, and what truly brings you joy versus what was just a passing impulse.</p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-lavender/30 dark:border-gray-600">
                <p className="mb-4">
                  Pocket Pause isn't here to shame or restrict you. It's here to return your choices to you—softly, quietly, with care.
                </p>
                <div className="pl-4 border-l-2 border-lavender/30 dark:border-gray-600">
                  <p className="italic text-[#6B4C9A] dark:text-cream">Let it be a pocket-sized practice in remembering:</p>
                  <p className="italic text-[#6B4C9A] dark:text-cream">You already have enough. You already are enough.</p>
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
