
export const formatPrice = (price?: string): string => {
  if (!price) return '';
  
  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) return '';
  
  // Always show two decimal places
  return `$${priceNum.toFixed(2)}`;
};
