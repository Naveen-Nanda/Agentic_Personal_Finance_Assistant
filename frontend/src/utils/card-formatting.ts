/**
 * Format a card number string with spaces
 * @param number The raw card number
 * @returns Formatted card number with spaces
 */
export function formatCardNumber(number: string): string {
  const clean = number.replace(/\s/g, '');
  const parts = clean.match(/.{1,4}/g) || [];
  return parts.join(' ');
}

/**
 * Check if a card number is valid using the Luhn algorithm
 * @param number The card number to validate
 * @returns true if the card number is valid
 */
export function isValidCardNumber(number: string): boolean {
  const clean = number.replace(/\s/g, '');
  if (!/^\d+$/.test(clean)) return false;
  
  // Luhn algorithm
  const digits = clean.split('').map(Number).reverse();
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}