export const isValidMRN = (mrn: string): boolean => {
  return /^MRN-\d{6}$/.test(mrn);
};

export const formatVitalValue = (value: number, unit: string): string => {
  return `${value.toFixed(1)} ${unit}`;
};
