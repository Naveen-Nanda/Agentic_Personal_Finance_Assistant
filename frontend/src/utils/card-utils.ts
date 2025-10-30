import { CardNetwork } from "../types";

export function detectCardNetwork(cardNumber: string): CardNetwork {
  // Remove any spaces or dashes
  const number = cardNumber.replace(/[\s-]/g, '');
  
  // Visa: Starts with 4
  if (/^4/.test(number)) {
    return 'visa';
  }
  
  // Mastercard: Starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(number) || /^2[2-7][2-7]\d{2}/.test(number)) {
    return 'mastercard';
  }
  
  // American Express: Starts with 34 or 37
  if (/^3[47]/.test(number)) {
    return 'amex';
  }
  
  // Discover: Starts with 6011, 622126-622925, 644-649, 65
  if (/^6011/.test(number) || /^622(12[6-9]|1[3-9]|[2-8]|9[0-1][0-9]|92[0-5])/.test(number) ||
      /^6[44-49]/.test(number) || /^65/.test(number)) {
    return 'discover';
  }
  
  return 'unknown';
}