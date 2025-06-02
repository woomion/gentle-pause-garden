
const GreaterJoySection = () => {
  return (
    <div className="mb-8">
      <div className="border-2 border-purple rounded-2xl p-6 text-center">
        <h3 className="text-xl font-medium text-dark-gray mb-2">
          Open your Greater Joy Fund
        </h3>
        <div className="flex items-center justify-center gap-2">
          <span className="text-black">"Peace during my day"</span>
          <button className="text-taupe hover:text-dark-gray transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GreaterJoySection;
