
export const getEmotionColor = (emotion: string): string => {
  const emotionColors: { [key: string]: string } = {
    'bored': '#F6E3D5',
    'overwhelmed': '#E9E2F7',
    'burnt out': '#FBF3C2',
    'sad': '#DCE7F5',
    'inspired': '#FBE7E6',
    'deserving': '#E7D8F3',
    'curious': '#DDEEDF',
    'anxious': '#EDEAE5',
    'lonely': '#CED8E3',
    'celebratory': '#FAEED6',
    'resentful': '#EAC9C3',
    'something else': '#F0F0EC'
  };
  
  return emotionColors[emotion] || '#F0F0EC';
};

export const getEmotionColorDark = (emotion: string): string => {
  const emotionColorsDark: { [key: string]: string } = {
    'bored': '#8B4513',
    'overwhelmed': '#6A5ACD',
    'burnt out': '#DAA520',
    'sad': '#4682B4',
    'inspired': '#DC143C',
    'deserving': '#9370DB',
    'curious': '#228B22',
    'anxious': '#CD853F',
    'lonely': '#708090',
    'celebratory': '#FF8C00',
    'resentful': '#A0522D',
    'something else': '#696969'
  };
  
  return emotionColorsDark[emotion] || '#696969';
};
