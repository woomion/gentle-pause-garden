interface WelcomeMessageProps {
  firstName?: string;
}

const getTimeBasedMessage = (): string => {
  const hour = new Date().getHours();
  
  const morningMessages = [
    "Start the day with clarity.\nEvery pause is a fresh choice."
  ];
  
  const middayMessages = [
    "A breath before you buy. Even small pauses ripple outward."
  ];
  
  const afternoonMessages = [
    "Presence belongs in your pocket — right when you need it most."
  ];
  
  const nightMessages = [
    "Slow down. Reflect. Tomorrow's choices begin here."
  ];
  
  // Select message array based on time of day
  let messages: string[];
  if (hour >= 6 && hour < 12) {
    messages = morningMessages;
  } else if (hour >= 12 && hour < 15) {
    messages = middayMessages;
  } else if (hour >= 15 && hour < 20) {
    messages = afternoonMessages;
  } else {
    messages = nightMessages;
  }
  
  // Select a consistent message for the current hour to avoid rapid changes
  const messageIndex = hour % messages.length;
  return messages[messageIndex];
};

const WelcomeMessage = ({ firstName }: WelcomeMessageProps) => {
  const displayName = firstName?.trim() || "there";
  const timeBasedMessage = getTimeBasedMessage();
  
  return (
    <div className="mb-6 mt-6 sm:mt-8 text-center">
      <h1 className="text-2xl md:text-3xl font-bold font-inter text-foreground leading-tight">
        Hi {displayName}
      </h1>
      <p className="text-sm md:text-base font-domine font-light text-foreground leading-relaxed mt-1 italic">
        {timeBasedMessage}
      </p>
    </div>
  );
};

export default WelcomeMessage;