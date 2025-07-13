import React from 'react';

const Snowfall: React.FC = () => {
  // Create 50 snowflakes with random properties
  const snowflakes = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 10,
    animationDuration: 8 + Math.random() * 12,
    size: 4 + Math.random() * 8,
    opacity: 0.3 + Math.random() * 0.7,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute animate-bounce"
          style={{
            left: `${flake.left}%`,
            animationDelay: `${flake.animationDelay}s`,
            animationDuration: `${flake.animationDuration}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            backgroundColor: 'white',
            borderRadius: '50%',
            opacity: flake.opacity,
            transform: 'translateY(-100vh)',
            animation: `snowfall ${flake.animationDuration}s ${flake.animationDelay}s infinite linear`,
          }}
        />
      ))}
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-100vh) translateX(0px);
          }
          100% {
            transform: translateY(100vh) translateX(100px);
          }
        }
      `}</style>
    </div>
  );
};

export default Snowfall;