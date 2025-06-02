
import { ArrowRight } from 'lucide-react';

const FooterLinks = () => {
  return (
    <div className="space-y-4 mb-8 mt-12">
      <button className="flex items-center justify-center gap-2 w-full text-black hover:text-taupe transition-colors duration-200 py-2 group">
        <span className="text-sm font-medium relative">
          See your mindful wins
          <div 
            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
            style={{ backgroundColor: '#DFCBFC' }}
          ></div>
        </span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
      </button>
      
      <div className="text-center text-xs space-y-1" style={{ color: '#A6A1AD' }}>
        <p>|| Pocket Pause—your conscious spending companion</p>
        <div className="flex justify-center gap-4">
          <button className="hover:text-taupe transition-colors">Privacy Policy</button>
          <button className="hover:text-taupe transition-colors">About</button>
        </div>
      </div>
    </div>
  );
};

export default FooterLinks;
