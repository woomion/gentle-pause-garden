
import { useItemNavigation } from './useItemNavigation';
import { useItemDecisions } from './useItemDecisions';

export const useItemActions = () => {
  const { handleViewItem } = useItemNavigation();
  const { handleLetGo, handleBought } = useItemDecisions();

  return {
    handleViewItem,
    handleLetGo,
    handleBought
  };
};
