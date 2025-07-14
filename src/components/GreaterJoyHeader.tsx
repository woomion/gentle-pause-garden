
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const GreaterJoyHeader = () => {
  return (
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
          POCKET <span className="inline-block px-1 text-shadow-sm shadow-inner bg-black/5 dark:bg-white/5 rounded-sm border border-black/10 dark:border-white/10 text-black/70 dark:text-[#F9F5EB]/70">||</span> PAUSE
        </Link>
      </div>
    </header>
  );
};

export default GreaterJoyHeader;
