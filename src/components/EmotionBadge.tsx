
import { getEmotionColor, getEmotionColorDark } from '../utils/emotionColors';
import { useTheme } from './ThemeProvider';

interface EmotionBadgeProps {
  emotion: string;
}

const EmotionBadge = ({ emotion }: EmotionBadgeProps) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  
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
