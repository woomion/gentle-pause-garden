import PauseHeader from '@/components/PauseHeader';

const Courses = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-gray text-black dark:text-[#F9F5EB] font-light">
      <div className="max-w-md mx-auto px-6 py-8">
        <PauseHeader />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light mb-3 tracking-wide">
            Pocket Wisdom
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Small lessons for intentional living and spending
          </p>
        </div>
        
        {/* Course content will go here */}
        <div className="space-y-6">
          {/* Placeholder for now - you can add course cards here later */}
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            Coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;