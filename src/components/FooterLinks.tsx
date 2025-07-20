
import { Link } from 'react-router-dom';

const FooterLinks = () => {
  return (
    <div className="pt-4">
      <div className="text-center text-[10px] text-muted-foreground">
        <p className="mb-2">|| Pocket Pause—your conscious spending companion</p>
        <div className="flex justify-center gap-4">
          <Link 
            to="/about" 
            className="hover:text-muted-foreground transition-colors underline"
          >
            About
          </Link>
          <Link 
            to="/privacy-policy" 
            className="hover:text-muted-foreground transition-colors underline"
          >
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FooterLinks;
