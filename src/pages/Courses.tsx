import PauseHeader from '@/components/PauseHeader';

const Courses = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-sm md:max-w-lg lg:max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <PauseHeader />
        
        <div className="text-center mb-8 mt-12">
          <h1 className="text-black dark:text-[#F9F5EB] font-medium text-3xl tracking-wide mb-0">
            Pocket Wisdom
          </h1>
          <p className="text-base mb-3" style={{ color: '#6b6b6b' }}>
            Small lessons for intentional living and spending
          </p>
        </div>
        
        {/* Course content will go here */}
        <div className="space-y-6">
          {/* Placeholder for now - you can add course cards here later */}
          <div className="text-center text-gray-500 dark:text-gray-400 py-12 font-light">
            Coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;