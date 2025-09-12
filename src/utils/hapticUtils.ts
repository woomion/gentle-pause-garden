import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Haptic feedback utilities with Capacitor (native on iOS/Android) + web fallback
 */
let pulseTimer: number | undefined;

export const triggerHapticFeedback = async (
  strength: 'soft' | 'medium' | 'strong' = 'soft'
) => {
  try {
    const style =
      strength === 'strong' ? ImpactStyle.Heavy : strength === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch (err) {
    // Web fallback
    if (navigator.vibrate) {
      const pattern = strength === 'strong' ? [30] : strength === 'medium' ? [20] : [10];
      navigator.vibrate(pattern);
    }
  }
};

export const startHapticPulse = async (
  strength: 'soft' | 'medium' | 'strong' = 'soft',
  intervalMs = 280
) => {
  stopHapticPulse();
  // Initial tap
  await triggerHapticFeedback(strength);
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
  if (navigator.vibrate) navigator.vibrate(0);
};
