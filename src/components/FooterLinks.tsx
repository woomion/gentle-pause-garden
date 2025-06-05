
import { Link } from 'react-router-dom';

const FooterLinks = () => {
  return (
    <div className="space-y-4 mb-8 mt-8">
      <div className="text-center text-xs space-y-1 mt-16" style={{ color: '#A6A1AD' }}>
        <p>|| Pocket Pause—your conscious spending companion</p>
        <div className="flex justify-center gap-4">
          <Link 
            to="/privacy-policy" 
            className="hover:text-taupe transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/about" 
            className="hover:text-taupe transition-colors"
          >
            About
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FooterLinks;
