import { useState, useEffect } from 'react';

export function useExchangeRates() {
  const [rates, setRates] = useState<Record<string, number>>({
    ZAR: 1,
    USD: 0.053, // Fallback rates
    GBP: 0.042,
    EUR: 0.049,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRates() {
      try {
        // Using a free API for exchange rates
        const res = await fetch('https://open.er-api.com/v6/latest/ZAR');
        const data = await res.json();
        if (data && data.rates) {
          setRates(data.rates);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRates();
  }, []);

  const convertToZAR = (amount: number, fromCurrency: string) => {
    if (fromCurrency === 'ZAR') return amount;
    const rate = rates[fromCurrency];
    if (!rate) return amount;
    return amount / rate;
  };

  const convertFromZAR = (amount: number, toCurrency: string) => {
    if (toCurrency === 'ZAR') return amount;
    const rate = rates[toCurrency];
    if (!rate) return amount;
    return amount * rate;
  };

  return { rates, loading, convertToZAR, convertFromZAR };
}
