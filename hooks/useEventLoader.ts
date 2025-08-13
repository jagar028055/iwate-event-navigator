import { useCallback } from 'react';
import { fetchIwateEvents } from '../services/geminiService';
import { enhancedEventService } from '../services/eventCollector';
import { useAppStore } from '../store/appStore';

export const useEventLoader = () => {
  const {
    setEvents,
    setSources,
    setLoading,
    setError,
    loading: isLoading,
    error
  } = useAppStore();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try enhanced event service first, fallback to original if needed
      let events, sources;
      try {
        console.log('Attempting enhanced event collection...');
        const result = await enhancedEventService.fetchIwateEvents();
        events = result.events;
        sources = result.sources;
        console.log(`Enhanced service returned ${events.length} events`);
      } catch (enhancedError) {
        console.warn('Enhanced service failed, falling back to original service:', enhancedError);
        const result = await fetchIwateEvents();
        events = result.events;
        sources = result.sources;
      }
      
      setEvents(events);
      setSources(sources);
    } catch (err) {
      console.error(err);
      setError('イベント情報の取得に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setEvents, setSources]);

  return {
    loadEvents,
    isLoading,
    error
  };
};