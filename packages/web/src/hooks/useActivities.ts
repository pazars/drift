import { useState, useEffect, useCallback } from 'react';
import type { Activity } from '../types';

interface ActivitiesResponse {
  activities: Activity[];
}

export interface UseActivitiesReturn {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useActivities(url: string | undefined): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(url !== undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.statusText}`);
      }

      const data = (await response.json()) as ActivitiesResponse;
      setActivities(data.activities);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void fetchActivities();
  }, [fetchActivities]);

  const refetch = useCallback(async () => {
    await fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    refetch,
  };
}
