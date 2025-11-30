export const roundCurrency = (amount) => {
  const num = Number(amount);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
};

export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return '$0.00';
  return '$' + num.toFixed(2);
};

export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);

  return `${startStr} - ${endStr}`;
};
