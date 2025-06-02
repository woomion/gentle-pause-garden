
import { ArrowRight } from 'lucide-react';

const FooterLinks = () => {
  return (
    <div className="space-y-4 mb-8">
      <button className="flex items-center justify-center gap-2 w-full text-taupe hover:text-dark-gray transition-colors duration-200 py-2 group">
        <span className="text-sm font-medium">See your mindful wins</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
      </button>
      
      <div className="text-center text-taupe text-xs space-y-1">
        <p>|| Pocket Pause—your conscious spending companion</p>
        <div className="flex justify-center gap-4">
          <button className="hover:text-dark-gray transition-colors">Privacy Policy</button>
          <button className="hover:text-dark-gray transition-colors">About</button>
        </div>
      </div>
    </div>
  );
};

export default FooterLinks;
