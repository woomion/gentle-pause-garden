/**
 * Haptic feedback utilities for enhanced user experience
 */

export const triggerHapticFeedback = (pattern: 'soft' | 'medium' | 'strong' | number[] = 'soft') => {
  // Check if vibration API is available
  if (!navigator.vibrate) {
    console.log('Vibration API not supported');
    return;
  }

  let vibrationPattern: number[];

  switch (pattern) {
    case 'soft':
      // Soft pulsing pattern - gentle vibrations while pausing
      vibrationPattern = [100, 50, 100, 50, 100];
      break;
    case 'medium':
      vibrationPattern = [200, 100, 200];
      break;
    case 'strong':
      vibrationPattern = [300];
      break;
    default:
      // Custom pattern provided
      vibrationPattern = Array.isArray(pattern) ? pattern : [100];
  }

  try {
    navigator.vibrate(vibrationPattern);
  } catch (error) {
    console.error('Haptic feedback failed:', error);
  }
};

export const stopHapticFeedback = () => {
  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
};