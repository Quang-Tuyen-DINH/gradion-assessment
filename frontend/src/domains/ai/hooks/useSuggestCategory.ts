import { useState, useEffect } from 'react';
import { suggestCategory } from '../api/ai';

export function useSuggestCategory(debouncedMerchantName: string, setCategory: (c: string) => void) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedMerchantName) return;
    setLoading(true);
    suggestCategory(debouncedMerchantName)
      .then(({ category }) => setCategory(category))
      .catch(() => { /* silently ignore AI failures */ })
      .finally(() => setLoading(false));
  }, [debouncedMerchantName, setCategory]);

  const suggest = async () => {
    if (!debouncedMerchantName) return;
    setLoading(true);
    try {
      const { category } = await suggestCategory(debouncedMerchantName);
      setCategory(category);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  return { suggest, loading };
}
