interface WelcomeMessageProps {
  firstName?: string;
}

const getTimeBasedMessage = () => {
  const hour = new Date().getHours();
  
  // Select message based on time of day
  if (hour >= 6 && hour < 12) {
    return "Start the day with clarity.";
  } else if (hour >= 12 && hour < 15) {
    return "Even small pauses ripple outward.";
  } else if (hour >= 15 && hour < 20) {
    return "Pause for presence.";
  } else {
    return "Tomorrow's choices begin here.";
  }
};

const WelcomeMessage = ({ firstName }: WelcomeMessageProps) => {
  const displayName = firstName?.trim() || "there";
  const timeBasedMessage = getTimeBasedMessage();
  
  return (
    <div className="mb-4 mt-2 text-center">
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