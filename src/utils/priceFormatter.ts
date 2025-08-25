
export const formatPrice = (price?: string): string => {
  if (!price) return '';
  
  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) return '';
  
  // Show two decimal places
  return `$${priceNum.toFixed(2)}`;
};
