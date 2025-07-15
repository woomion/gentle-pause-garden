
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
                  <p>When you feel the pull to buy something (or say yes to something, or reach for something), open Pocket Pause. Instead of acting on impulse, you log the item, name the emotion, and take a breath.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-black dark:text-cream mb-2">2. Set a Soft Intention</h3>
                  <p>Write a quiet note to yourself—a reason, a reminder, or a simple reflection. This helps root the moment in awareness instead of automaticity.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-black dark:text-cream mb-2">3. Come Back Later</h3>
                  <p>Return when you're ready. Whether you buy the item or not, you'll do it with clarity. Each decision adds to your Greater Joy Fund—a gentle log of the mindful, aligned choices you've made.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-black dark:text-cream mb-2">4. See the Patterns</h3>
                  <p>Over time, you'll notice trends: what emotions often lead to impulse, what kinds of things you pass on, and what you truly value. Awareness becomes your compass.</p>
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
