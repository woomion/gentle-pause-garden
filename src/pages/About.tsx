
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
          
          <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6 space-y-6">
            <p className="text-black dark:text-[#F9F5EB] leading-relaxed">
              Pocket Pause is your conscious spending companion. It helps you create a pause — a breath — between impulse and action.
            </p>
            
            <p className="text-black dark:text-[#F9F5EB] leading-relaxed">
              We're not here to guilt you into saving. We're not anti-shopping. We simply believe that awareness is powerful, and that mindful choices, whether big or small, can create more alignment, ease, and joy in your life.
            </p>
            
            <p className="text-black dark:text-[#F9F5EB] leading-relaxed">
              Whether you're feeling tempted, burnt out, curious, or celebratory — Pocket Pause offers a soft moment to ask:
            </p>
            
            <p className="text-black dark:text-[#F9F5EB] leading-relaxed italic text-center">
              "What am I truly reaching for?"
            </p>
            
            <p className="text-black dark:text-[#F9F5EB] leading-relaxed">
              You can pause an item you're considering, tag how you're feeling, and track your choices inside your Greater Joy Fund — a space to reflect on what matters most to you.
            </p>
            
            <p className="text-black dark:text-[#F9F5EB] leading-relaxed">
              There's no right or wrong outcome. You can let something go. You can come back later. Or you can decide that yes, this purchase feels aligned — and go forward with clarity.
            </p>
            
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">What Pocket Pause encourages:</h3>
              <div className="space-y-2 text-black dark:text-[#F9F5EB]">
                <p>Presence over perfection</p>
                <p>Emotional honesty over avoidance</p>
                <p>Self-trust over impulse</p>
                <p>Sustainable joy over quick dopamine</p>
              </div>
            </div>
            
            <p className="text-black dark:text-[#F9F5EB] leading-relaxed">
              We believe there's power in paying attention — and beauty in slowing down, even just for a moment.
            </p>
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
