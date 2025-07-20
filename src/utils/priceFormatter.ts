
export const formatPrice = (price?: string): string => {
  if (!price) return '';
  
  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) return '';
  
  // Show no decimal places
  return `$${Math.round(priceNum)}`;
};
