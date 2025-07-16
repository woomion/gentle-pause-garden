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
        
        {/* Course grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Clear the Clutter */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl mb-3 flex items-center justify-center">
              <div className="text-blue-600 dark:text-blue-300 text-2xl">🍂</div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Clear the Clutter</h3>
          </div>

          {/* Autumn Abundance */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="aspect-square bg-gradient-to-br from-orange-100 to-yellow-200 dark:from-orange-900 dark:to-yellow-800 rounded-xl mb-3 flex items-center justify-center">
              <div className="text-orange-600 dark:text-orange-300 text-2xl">🍎</div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Autumn Abundance</h3>
          </div>

          {/* Tend Your Time */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl mb-3 flex items-center justify-center">
              <div className="text-green-600 dark:text-green-300 text-2xl">🌱</div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Tend Your Time</h3>
          </div>

          {/* Pause for Joy */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900 dark:to-pink-800 rounded-xl mb-3 flex items-center justify-center">
              <div className="text-purple-600 dark:text-purple-300 text-2xl">🌈</div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Pause for Joy</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;