import { useState, useEffect, useRef } from 'react';
import { suggestCategory } from '../api/ai';

export function useSuggestCategory(debouncedMerchantName: string, setCategory: (c: string) => void) {
  const [loading, setLoading] = useState(false);
  const setCategoryRef = useRef(setCategory);
  setCategoryRef.current = setCategory;

  useEffect(() => {
    if (!debouncedMerchantName) return;
    let cancelled = false;
    setLoading(true);
    suggestCategory(debouncedMerchantName)
      .then(({ category }) => { if (!cancelled) setCategoryRef.current(category); })
      .catch(() => { /* silently ignore AI failures */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedMerchantName]);

  const suggest = async () => {
    if (!debouncedMerchantName) return;
    setLoading(true);
    try {
      const { category } = await suggestCategory(debouncedMerchantName);
      setCategoryRef.current(category);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  return { suggest, loading };
}
