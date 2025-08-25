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
      let events = [];
      let sources = [];
      let lastError = null;

      // Step 1: Try enhanced event service first
      try {
        console.log('🚀 Attempting enhanced event collection...');
        const result = await enhancedEventService.fetchIwateEvents();
        events = result.events;
        sources = result.sources;
        console.log(`✅ Enhanced service returned ${events.length} events`);
        
        if (events.length > 0) {
          setEvents(events);
          setSources(sources);
          return;
        } else {
          console.warn('⚠️ Enhanced service returned no events');
        }
      } catch (enhancedError) {
        console.warn('❌ Enhanced service failed:', enhancedError);
        lastError = enhancedError;
      }

      // Step 2: Try original service as fallback
      try {
        console.log('🔄 Falling back to original service...');
        const result = await fetchIwateEvents();
        events = result.events;
        sources = result.sources;
        console.log(`✅ Original service returned ${events.length} events`);
        
        if (events.length > 0) {
          setEvents(events);
          setSources(sources);
          return;
        } else {
          console.warn('⚠️ Original service returned no events');
        }
      } catch (originalError) {
        console.warn('❌ Original service also failed:', originalError);
        lastError = originalError;
      }

      // Step 3: Provide sample data if all services fail
      console.log('🔧 Providing sample events as final fallback...');
      const sampleEvents = [
        {
          id: 'sample-1',
          title: '盛岡さんさ踊り（サンプル）',
          description: 'APIキー設定後に実際のイベント情報が表示されます',
          date: '2024-08-01',
          locationName: '盛岡市中央通',
          latitude: 39.7036,
          longitude: 141.1526,
          category: '祭り',
          officialUrl: 'https://www.sansaodori.jp'
        }
      ];
      
      setEvents(sampleEvents);
      setSources([]);
      setError('APIキーが設定されていません。実際のイベント情報を表示するにはGemini APIキーが必要です。');
      
    } catch (err) {
      console.error('💥 Complete failure in event loading:', err);
      setError('イベント情報の取得に失敗しました。APIキーの設定を確認してください。');
      setEvents([]);
      setSources([]);
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