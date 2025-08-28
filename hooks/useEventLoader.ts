import { useCallback } from 'react';
import { hybridETLService } from '../services/hybridETLService';
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

      // Step 1: Try Hybrid ETL service first (new primary method)
      try {
        console.log('🚀 Attempting Hybrid ETL collection...');
        const result = await hybridETLService.fetchIwateEvents();
        events = result.events;
        sources = result.sources;
        console.log(`✅ Hybrid ETL service returned ${events.length} events`);
        
        if (events.length > 0) {
          setEvents(events);
          setSources(sources);
          return;
        } else {
          console.warn('⚠️ Hybrid ETL service returned no events, trying fallback...');
        }
      } catch (hybridError) {
        console.warn('❌ Hybrid ETL service failed:', hybridError);
      }

      // Step 2: Try enhanced event service as backup
      try {
        console.log('🔄 Trying enhanced event collection as backup...');
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
        console.warn('❌ Enhanced service also failed:', enhancedError);
      }

      // Step 3: Try original service as final fallback
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
      }

      // Step 4: Provide sample data if all services fail
      console.log('🔧 Providing sample events as final fallback...');
      const sampleEvents = [
        {
          id: 'sample-1',
          title: '盛岡さんさ踊り（サンプル）',
          description: 'ハイブリッドETLシステムが初期化中です。実際のイベント情報は準備完了後に表示されます。',
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
      setError('イベント情報システムが初期化中です。しばらくお待ちください。');
      
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