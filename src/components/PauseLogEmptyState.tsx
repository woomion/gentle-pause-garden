
const PauseLogEmptyState = () => {
  return (
    <div className="text-center py-12">
      <p className="text-taupe dark:text-cream mb-2">No items found</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Try adjusting your filters or add some paused items first
      </p>
    </div>
  );
};

export default PauseLogEmptyState;
