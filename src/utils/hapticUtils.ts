/**
 * Haptic feedback utilities for PWA using Web Vibration API
 * Works great on Android PWAs, limited on iOS
 */
let pulseTimer: number | undefined;

export const triggerHapticFeedback = (
  strength: 'soft' | 'medium' | 'strong' = 'soft'
) => {
  if (!navigator.vibrate) {
    console.log('Vibration API not supported');
    return;
  }

  try {
    const pattern = strength === 'strong' ? [50] : strength === 'medium' ? [30] : [15];
    navigator.vibrate(pattern);
  } catch (error) {
    console.error('Haptic feedback failed:', error);
  }
};

export const startHapticPulse = (
  strength: 'soft' | 'medium' | 'strong' = 'soft',
  intervalMs = 300
) => {
  stopHapticPulse();
  
  // Initial vibration
  triggerHapticFeedback(strength);
  
  // Repeating pulse while an operation is ongoing
  pulseTimer = window.setInterval(() => {
    triggerHapticFeedback(strength);
  }, intervalMs);
};

export const stopHapticPulse = () => {
  if (pulseTimer) {
    clearInterval(pulseTimer);
    pulseTimer = undefined;
  }
  // Stop any ongoing vibration
  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
};