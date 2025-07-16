
import { Link } from 'react-router-dom';

const FooterLinks = () => {
  return (
    <div className="space-y-4 mb-8 mt-8">
      <div className="text-center text-[10px] space-y-1 mt-16" style={{ color: '#A6A1AD' }}>
        <p>|| Pocket Pause—your conscious spending companion</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link 
            to="/about" 
            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline"
          >
            About
          </Link>
          <Link 
            to="/privacy-policy" 
            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline"
          >
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FooterLinks;
