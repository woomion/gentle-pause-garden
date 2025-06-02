
import { ArrowRight } from 'lucide-react';

const InStoreModeButton = () => {
  return (
    <button className="flex items-center justify-center gap-2 w-full text-taupe hover:text-dark-gray transition-colors duration-200 mb-8 py-2 group">
      <span className="text-sm font-medium">Shopping in person? Use In-Store Mode</span>
      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
    </button>
  );
};

export default InStoreModeButton;
