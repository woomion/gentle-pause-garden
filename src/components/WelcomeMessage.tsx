interface WelcomeMessageProps {
  firstName?: string;
}

const getTimeBasedMessage = (): string => {
  const hour = new Date().getHours();
  
  const morningMessages = [
    "What's calling for your attention this morning?",
    "What would you like to mindfully pause on today?",
    "What's on your mind to explore this morning?"
  ];
  
  const afternoonMessages = [
    "What are you feeling called to pause on today?",
    "What deserves your mindful attention right now?",
    "What would you like to reflect on this afternoon?"
  ];
  
  const eveningMessages = [
    "What would you like to reflect on this evening?",
    "What's worth pausing to consider tonight?",
    "What's been on your mind today?"
  ];
  
  const nightMessages = [
    "What's on your mind tonight?",
    "What would you like to pause and reflect on?",
    "What deserves your quiet attention right now?"
  ];
  
  // Select message array based on time of day
  let messages: string[];
  if (hour >= 6 && hour < 12) {
    messages = morningMessages;
  } else if (hour >= 12 && hour < 18) {
    messages = afternoonMessages;
  } else if (hour >= 18 && hour < 24) {
    messages = eveningMessages;
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
        Hi {displayName}!
      </h1>
      <p className="text-sm md:text-base font-domine font-light text-foreground leading-relaxed mt-1 italic">
        {timeBasedMessage}
      </p>
    </div>
  );
};

export default WelcomeMessage;