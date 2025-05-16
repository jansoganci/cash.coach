import { storage } from "../storage";

/**
 * Convert currency amount between different currencies
 * @param amount Amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Get exchange rates from storage
  const exchangeRates = await storage.getExchangeRates();
  
  if (!exchangeRates) {
    throw new Error("Exchange rates not found");
  }

  const rates = exchangeRates.rates as Record<string, number>;
  
  // Check if rates exist for the requested currencies
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
  }

  // Convert to USD first (base currency), then to target currency
  const amountInUSD = amount / rates[fromCurrency];
  const convertedAmount = amountInUSD * rates[toCurrency];
  
  // Round to 2 decimal places
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Format currency amount with appropriate symbol
 * @param amount Amount to format
 * @param currencyCode Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥"
  };

  const symbol = currencySymbols[currencyCode] || currencyCode;
  
  // Format based on currency
  if (currencyCode === "JPY") {
    // No decimal places for Yen
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  } else {
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}
