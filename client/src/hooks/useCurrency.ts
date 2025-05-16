import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { CURRENCIES } from '@shared/schema';

export function useCurrency() {
  const { user } = useAuth();
  
  // Fetch exchange rates
  const { data: exchangeRates } = useQuery({
    queryKey: ['/api/currency/exchange-rates'],
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  
  /**
   * Format a currency amount with the appropriate symbol
   * @param amount - The amount to format
   * @param currencyCode - Optional currency code, defaults to user's preferred currency
   * @param abbreviated - Whether to show abbreviated amounts for large numbers
   */
  const formatCurrency = (
    amount: number, 
    currencyCode?: string,
    abbreviated = false
  ): string => {
    const code = currencyCode || user?.preferredCurrency || 'USD';
    const currency = CURRENCIES.find(c => c.code === code);
    const symbol = currency?.symbol || '$';
    
    // For Japanese Yen, no decimal places
    const maximumFractionDigits = code === 'JPY' ? 0 : 2;
    
    // For abbreviated large numbers
    if (abbreviated && amount >= 1000) {
      if (amount >= 1000000) {
        return `${symbol}${(amount / 1000000).toFixed(1)}M`;
      }
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    }
    
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: maximumFractionDigits,
      maximumFractionDigits
    })}`;
  };
  
  /**
   * Convert an amount from one currency to another
   * @param amount - The amount to convert
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   */
  const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    if (!exchangeRates || fromCurrency === toCurrency) {
      return amount;
    }
    
    const rates = exchangeRates.rates as Record<string, number>;
    
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      return amount;
    }
    
    // Convert to USD first (base currency), then to target currency
    const amountInUSD = amount / rates[fromCurrency];
    const convertedAmount = amountInUSD * rates[toCurrency];
    
    // Round to 2 decimal places
    return Math.round(convertedAmount * 100) / 100;
  };
  
  return {
    formatCurrency,
    convertCurrency,
    exchangeRates
  };
}
