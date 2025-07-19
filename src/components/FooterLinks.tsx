
import { Link } from 'react-router-dom';

const FooterLinks = () => {
  return (
    <div className="pt-4">
      <div className="text-center text-[10px]" style={{ color: '#A6A1AD' }}>
        <p className="mb-2">|| Pocket Pause—your conscious spending companion</p>
        <div className="flex justify-center gap-4">
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
