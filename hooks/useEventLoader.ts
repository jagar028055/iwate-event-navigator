import { useCallback } from 'react';
import { hybridETLService } from '../services/hybridETLService';
import { fetchIwateEvents } from '../services/geminiService';
import { enhancedEventService } from '../services/eventCollector';
import { useAppStore } from '../store/appStore';
import { manualEventService } from '../services/manualEventService';

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

      // Step 0: Manual mode (initial release) if enabled
      const getEnv = () => {
        try { return (import.meta as any)?.env || {}; } catch { return {}; }
      };
      const env = getEnv();
      const manualMode =
        String(env?.VITE_MANUAL_EVENTS_ONLY || '') === '1' ||
        String(env?.VITE_EVENTS_MODE || '').toLowerCase() === 'manual' ||
        String((globalThis as any)?.process?.env?.VITE_MANUAL_EVENTS_ONLY || '') === '1' ||
        String((globalThis as any)?.process?.env?.VITE_EVENTS_MODE || '').toLowerCase() === 'manual';

      if (manualMode) {
        console.log('📝 Manual events mode enabled. Loading from JSON...');
        const result = await manualEventService.fetchEvents();
        events = result.events;
        sources = result.sources;
        setEvents(events);
        setSources(sources);
        return;
      }

      // Step 1: Try Hybrid ETL service FIRST (following redesign docs)
      try {
        console.log('🚀 Attempting Hybrid ETL collection (RSS/ICS/API priority)...');
        const result = await hybridETLService.fetchIwateEvents();
        events = result.events;
        sources = result.sources;
        console.log(`✅ Hybrid ETL service returned ${events.length} events`);
        
        if (events.length > 0) {
          setEvents(events);
          setSources(sources);
          console.log('🎉 Success! Using hybrid ETL (NOT Gemini-dependent)');
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

      // Step 3: Try original Gemini service as LAST RESORT (deprecated approach)
      try {
        console.log('🔄 Falling back to original Gemini service (deprecated)...');
        const result = await fetchIwateEvents();
        events = result.events;
        sources = result.sources;
        console.log(`✅ Original Gemini service returned ${events.length} events`);
        
        if (events.length > 0) {
          setEvents(events);
          setSources(sources);
          console.warn('⚠️ Using deprecated Gemini approach - should migrate to hybrid ETL');
          return;
        } else {
          console.warn('⚠️ Original Gemini service returned no events');
        }
      } catch (originalError) {
        console.warn('❌ Original Gemini service also failed:', originalError);
      }

      // Step 4: Try manual data before sample if all services fail
      try {
        console.log('📋 Trying manual events as final functional fallback...');
        const result = await manualEventService.fetchEvents();
        if (result.events.length > 0) {
          setEvents(result.events);
          setSources(result.sources);
          setError('自動収集が不安定のため、手動登録データを表示しています。');
          return;
        }
      } catch (_) {}

      // Step 5: Provide sample data if everything fails
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
