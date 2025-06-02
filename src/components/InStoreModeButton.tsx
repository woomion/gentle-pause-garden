
import { ArrowRight } from 'lucide-react';

const InStoreModeButton = () => {
  return (
    <button className="flex items-center justify-center gap-2 w-full text-black hover:text-taupe transition-colors duration-200 mb-8 py-2 group">
      <span className="text-sm font-medium relative">
        Shopping in person? Use In-Store Mode
        <div 
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
          style={{ backgroundColor: '#DFCBFC' }}
        ></div>
      </span>
      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
    </button>
  );
};

export default InStoreModeButton;
