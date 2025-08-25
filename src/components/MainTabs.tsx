import PauseLogSection from './PauseLogSection';
import { useSubscription } from '@/hooks/useSubscription';
import { useItemComments } from '@/hooks/useItemComments';
import { useAuth } from '@/contexts/AuthContext';

const MainTabs = ({ onSectionToggle }: { onSectionToggle?: (isAnyOpen: boolean) => void }) => {
  // My Pauses section has been removed - this component now only shows pause log if needed
  // For now, we'll just return null since the main functionality has been moved to pill mode
  return null;
};

export default MainTabs;