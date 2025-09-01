interface WelcomeMessageProps {
  firstName?: string;
}

const getTimeBasedMessage = () => {
  const hour = new Date().getHours();
  
  // Select message based on time of day
  if (hour >= 6 && hour < 12) {
    return "Start the day with clarity.\nEvery pause is a fresh choice.";
  } else if (hour >= 12 && hour < 15) {
    return (
      <>
        A breath before you buy.
        <br />
        Even small pauses ripple outward.
      </>
    );
  } else if (hour >= 15 && hour < 20) {
    return "Presence belongs in your pocket — right when you need it most.";
  } else {
    return "Slow down. Reflect. Tomorrow's choices begin here.";
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