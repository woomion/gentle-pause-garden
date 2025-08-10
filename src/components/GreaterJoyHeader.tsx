
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const GreaterJoyHeader = () => {
  return (
    <header className="relative mb-8">
      <Link 
        to="/"
        className="absolute left-0 top-6 p-2 text-foreground hover:text-muted-foreground transition-colors"
      >
        <ArrowLeft size={24} />
      </Link>
      
      <div className="text-center">
        <Link 
          to="/"
          className="text-foreground font-medium text-lg tracking-wide mb-2 hover:text-muted-foreground transition-colors"
        >
          Pocket Pause
        </Link>
      </div>
    </header>
  );
};

export default GreaterJoyHeader;
