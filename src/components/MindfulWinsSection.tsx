
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MindfulWinsSection = () => {
  return (
    <div className="mb-16">
      <Link 
        to="/mindful-wins"
        className="flex items-center justify-center gap-2 w-full text-black hover:text-taupe transition-colors duration-200 py-2 group"
      >
        <span className="text-sm font-medium relative">
          See your Pause Log
          <div 
            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
            style={{ backgroundColor: '#DFCBFC' }}
          ></div>
        </span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
      </Link>
    </div>
  );
};

export default MindfulWinsSection;
