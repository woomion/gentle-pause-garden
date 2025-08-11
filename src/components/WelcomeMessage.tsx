
import { useDynamicGreeting } from '@/hooks/useDynamicGreeting';

interface WelcomeMessageProps {
  firstName?: string;
}

const WelcomeMessage = ({ firstName }: WelcomeMessageProps) => {
  const displayName = firstName?.trim() || "there";
  const dynamicGreeting = useDynamicGreeting();
  
  return (
    <div className="mb-6 mt-6 sm:mt-8 text-center">
      <h1 className="text-2xl md:text-3xl font-bold font-inter text-foreground leading-tight">
        Hi {displayName}!
      </h1>
      <p className="text-sm md:text-base font-domine font-light text-foreground leading-relaxed mt-1 italic">
        {dynamicGreeting}
      </p>
    </div>
  );
};

export default WelcomeMessage;
