/**
 * Haptic feedback utilities for PWA using Web Vibration API
 * Works great on Android PWAs, limited on iOS
 */

export const triggerHapticFeedback = (
  type: 'tap' | 'success' | 'warning' | 'heavy' | 'soft' | 'medium' | 'strong' = 'tap'
) => {
  if (!navigator.vibrate) {
    console.log('Vibration API not supported');
    return;
  }

  try {
    // Different haptic patterns for different feedback types
    const patterns: Record<string, number | number[]> = {
      // Light tap - single short vibration
      tap: 10,
      // Soft - gentle feedback
      soft: 15,
      // Medium - standard feedback
      medium: 25,
      // Strong/Heavy - impactful feedback
      strong: 40,
      heavy: 50,
      // Success - satisfying double-tap pattern (vibrate, pause, vibrate)
      success: [20, 80, 30],
      // Warning - attention-getting pattern
      warning: [30, 50, 30, 50, 30],
    };

    const pattern = patterns[type] || patterns.tap;
    navigator.vibrate(pattern);
  } catch (error) {
    console.error('Haptic feedback failed:', error);
  }
};

/**
 * Elegant "processing" haptic - a single satisfying thud at the start
 * No repeating clicks, just a nice tactile confirmation that action started
 */
export const triggerProcessingHaptic = () => {
  if (!navigator.vibrate) return;
  
  try {
    // Single smooth "thud" - longer duration feels more premium
    navigator.vibrate(35);
  } catch (error) {
    console.error('Processing haptic failed:', error);
  }
};

/**
 * Success haptic - a gentle, satisfying confirmation
 * Called when an action completes successfully
 */
export const triggerSuccessHaptic = () => {
  if (!navigator.vibrate) return;
  
  try {
    // Double-tap pattern: short vibration, brief pause, slightly longer vibration
    // Creates a satisfying "done" feeling
    navigator.vibrate([15, 100, 25]);
  } catch (error) {
    console.error('Success haptic failed:', error);
  }
};

// Legacy functions for backward compatibility - now simplified
let pulseTimer: number | undefined;

export const startHapticPulse = (
  _strength: 'soft' | 'medium' | 'strong' = 'soft',
  _intervalMs = 300
) => {
  // Instead of annoying repeated clicks, just do one nice initial feedback
  triggerProcessingHaptic();
  // Clear any existing timer
  stopHapticPulse();
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
