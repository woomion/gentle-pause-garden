
import { getEmotionColor } from '../utils/emotionColors';

interface EmotionBadgeProps {
  emotion: string;
}

const EmotionBadge = ({ emotion }: EmotionBadgeProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 text-sm">Paused while feeling</span>
      <span 
        className="inline-block px-4 py-2 rounded-full text-sm font-medium"
        style={{ 
          backgroundColor: getEmotionColor(emotion, false),
          color: '#000'
        }}
      >
        {emotion}
      </span>
    </div>
  );
};

export default EmotionBadge;
