'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook for handling async operations with loading state
 * @param asyncFunction - The async function to execute
 * @param immediate - Whether to execute immediately on mount (default: false)
 */
export function useAsyncLoading<T>(
  asyncFunction: () => Promise<T>,
  immediate = false
) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoading, data, error, execute };
}

