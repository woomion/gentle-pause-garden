
import { getEmotionColor, getEmotionColorDark } from '../utils/emotionColors';
import { useTheme } from './ThemeProvider';

interface EmotionBadgeProps {
  emotion: string;
  size?: 'sm' | 'default';
}

const EmotionBadge = ({ emotion, size = 'default' }: EmotionBadgeProps) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  
  // Small inline emotion badge for card view
  if (size === 'sm') {
    return (
      <span 
        className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
        style={{ 
          backgroundColor: isDark ? getEmotionColorDark(emotion) : getEmotionColor(emotion),
          color: isDark ? '#ffffff' : '#000000'
        }}
      >
        {emotion}
      </span>
    );
  }
  
  // Default larger badge with label
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Paused while feeling</span>
      <span 
        className="inline-block px-4 py-2 rounded-full text-sm font-medium"
        style={{ 
          backgroundColor: isDark ? getEmotionColorDark(emotion) : getEmotionColor(emotion),
          color: isDark ? '#ffffff' : '#000000'
        }}
      >
        {emotion}
      </span>
    </div>
  );
};

export default EmotionBadge;
