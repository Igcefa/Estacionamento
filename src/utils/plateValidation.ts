// License plate validation for Brazilian formats
export function validateBrazilianPlate(plate: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanPlate = plate.replace(/\s/g, '').toUpperCase();
  
  // Old format: ABC-1234
  const oldFormat = /^[A-Z]{3}-\d{4}$/;
  
  // Old format without hyphen: ABC1234
  const oldFormatNoHyphen = /^[A-Z]{3}\d{4}$/;
  
  // Mercosul format: ABC1D23
  const mercosulFormat = /^[A-Z]{3}\d[A-Z]\d{2}$/;
  
  return oldFormat.test(cleanPlate) || oldFormatNoHyphen.test(cleanPlate) || mercosulFormat.test(cleanPlate);
}

export function formatPlate(plate: string): string {
  const cleanPlate = plate.replace(/\s/g, '').toUpperCase();
  
  // If it's old format, ensure it has the dash
  if (/^[A-Z]{3}\d{4}$/.test(cleanPlate)) {
    return `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3)}`;
  }
  
  // If it already has the dash, keep it
  if (/^[A-Z]{3}-\d{4}$/.test(cleanPlate)) {
    return cleanPlate;
  }
  
  // Return as-is for Mercosul format or if already formatted
  return cleanPlate;
}

export function getPlateType(plate: string): 'old' | 'mercosul' | 'invalid' {
  const cleanPlate = plate.replace(/\s/g, '').toUpperCase();
  
  if (/^[A-Z]{3}-\d{4}$/.test(cleanPlate) || /^[A-Z]{3}\d{4}$/.test(cleanPlate)) {
    return 'old';
  }
  
  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleanPlate)) {
    return 'mercosul';
  }
  
  return 'invalid';
}