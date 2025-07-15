import { RotateCcw } from 'lucide-react';

interface ExtendPauseCTAProps {
  onExtend: () => void;
}

const ExtendPauseCTA = ({ onExtend }: ExtendPauseCTAProps) => {
  return (
    <div className="flex justify-center mt-4">
      <button
        onClick={onExtend}
        className="group flex items-center gap-1.5 text-sm font-crimson text-muted-foreground hover:text-foreground transition-colors duration-300 relative"
      >
        <span className="relative">
          Not ready yet? Extend this pause
          {/* Hand-drawn style underline */}
          <svg
            className="absolute -bottom-0.5 left-0 w-full h-1 opacity-60 group-hover:opacity-80 transition-opacity duration-300"
            viewBox="0 0 120 3"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 1.5C15 0.8 25 2.2 40 1.5C55 0.8 65 2.2 80 1.5C95 0.8 105 2.2 118 1.5"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              className="opacity-70"
            />
          </svg>
        </span>
        <RotateCcw 
          size={14} 
          className="opacity-60 group-hover:opacity-80 transition-opacity duration-300 mt-0.5" 
        />
      </button>
    </div>
  );
};

export default ExtendPauseCTA;