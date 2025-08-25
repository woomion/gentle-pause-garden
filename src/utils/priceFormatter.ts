
export const formatPrice = (price?: string): string => {
  if (!price) return '';
  
  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) return '';
  
  // Only show decimals if the number has them
  return priceNum % 1 === 0 ? `$${Math.round(priceNum)}` : `$${priceNum.toFixed(2)}`;
};
