
import { ArrowRight } from 'lucide-react';

const MindfulWinsSection = () => {
  return (
    <div className="mb-16">
      
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
    </div>
  );
};

export default MindfulWinsSection;
