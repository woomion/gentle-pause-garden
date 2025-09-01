
import { Link } from 'react-router-dom';

const FooterLinks = () => {
  return (
    <div className="pt-6 pb-2 sm:pt-4 sm:pb-0 bg-white">
      <div className="text-center text-[10px] text-gray-600">
        <p className="mb-3 sm:mb-2">Pocket Pause—your conscious spending companion</p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/get" 
              className="hover:text-gray-800 transition-colors underline"
            >
              Get the app
            </Link>
            <Link 
              to="/about" 
              className="hover:text-gray-800 transition-colors underline"
            >
              About
            </Link>
            <Link 
              to="/privacy-policy" 
              className="hover:text-gray-800 transition-colors underline"
            >
              Privacy
            </Link>
          </div>
      </div>
    </div>
  );
};

export default FooterLinks;
