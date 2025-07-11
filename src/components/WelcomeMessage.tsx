
import { useDynamicGreeting } from '@/hooks/useDynamicGreeting';

interface WelcomeMessageProps {
  firstName?: string;
}

const WelcomeMessage = ({ firstName }: WelcomeMessageProps) => {
  const displayName = firstName?.trim() || "there";
  const dynamicGreeting = useDynamicGreeting();
  
  return (
    <div className="mb-8 mt-16">
      <h1 className="text-3xl md:text-4xl font-bold text-black leading-tight">
        Hi {displayName}!
        <br />
        {dynamicGreeting}
      </h1>
    </div>
  );
};

export default WelcomeMessage;
