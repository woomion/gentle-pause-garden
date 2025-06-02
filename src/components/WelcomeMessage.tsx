
interface WelcomeMessageProps {
  firstName?: string;
}

const WelcomeMessage = ({ firstName = "Michelle" }: WelcomeMessageProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-normal text-dark-gray leading-tight">
        Hi {firstName} —
        <br />
        Let's check in before you check out
      </h1>
    </div>
  );
};

export default WelcomeMessage;
