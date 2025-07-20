
import { useDynamicGreeting } from '@/hooks/useDynamicGreeting';

interface WelcomeMessageProps {
  firstName?: string;
}

const WelcomeMessage = ({ firstName }: WelcomeMessageProps) => {
  const displayName = firstName?.trim() || "there";
  const dynamicGreeting = useDynamicGreeting();
  
  return (
    <div className="mb-8 mt-16">
      <h1 className="text-3xl md:text-4xl font-bold font-inter text-foreground leading-tight">
        Hi {displayName}!
      </h1>
      <p className="text-xl md:text-xl font-domine font-light text-foreground leading-relaxed mt-1 italic">
        {dynamicGreeting}
      </p>
    </div>
  );
};

export default WelcomeMessage;
