
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
          <h1 className="text-3xl font-bold text-black dark:text-[#F9F5EB] mb-2">The Pocket Pause Manifesto</h1>
        </div>

        {/* Content */}
        <div className="space-y-6 text-dark-gray dark:text-cream">
          <div className="p-6">
            <div className="space-y-4 text-lg leading-relaxed">
              <p>We live in a world designed for speed.</p>
              <p>One-click checkouts. Next-day shipping. Endless scrolling.</p>
              
              <p>But speed isn't always clarity.</p>
              <p>And more isn't always better.</p>
              
              <p>Pocket Pause was created to bring back something small but powerful: a pause.</p>
              
              <p>A pause before you buy.</p>
              <p>A pause before you let another thing, another expense, another distraction into your life.</p>
              <p>A pause to ask: Do I really want this? Does this align with my values?</p>
              
              <p>We believe presence belongs in your pocket.</p>
              <p>That money decisions are emotional as much as rational.</p>
              <p>That what you choose to buy — or not buy — shapes the life you live.</p>
              
              <p>Pocket Pause isn't about guilt or control.</p>
              <p>It's about freedom, clarity, and enoughness.</p>
              <p>It's about remembering that every "yes" is precious.</p>
              
              <p>We're not building another finance app.</p>
              <p>We're building a practice.</p>
              <p>A movement.</p>
              <p>A gentler way of being with money, time, and attention.</p>
              
              <p>Because every pause matters.</p>
              <p>And small pauses ripple into big change.</p>
              
              <p className="text-2xl">✨</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
