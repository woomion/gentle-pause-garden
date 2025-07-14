
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
          POCKET || PAUSE
        </Link>
      </div>
    </header>
  );
};

export default GreaterJoyHeader;
