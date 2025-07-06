
export const getEmotionColor = (emotion: string, isDarkMode: boolean = false): string => {
  const lightModeColors: { [key: string]: string } = {
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
  
  const darkModeColors: { [key: string]: string } = {
    'bored': '#D4A574',
    'overwhelmed': '#B399E6',
    'burnt out': '#E6D85A',
    'sad': '#7BA3D9',
    'inspired': '#E6A5A3',
    'deserving': '#C9A8E6',
    'curious': '#8FBF94',
    'anxious': '#C7C2B8',
    'lonely': '#8BADC7',
    'celebratory': '#E6C273',
    'resentful': '#D19B8F',
    'something else': '#B8B8B0'
  };
  
  const colors = isDarkMode ? darkModeColors : lightModeColors;
  return colors[emotion] || (isDarkMode ? '#B8B8B0' : '#F0F0EC');
};
