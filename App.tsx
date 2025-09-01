
import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapPanel } from './components/MapPanel';
import { EventDetailModal } from './components/EventDetailModal';
import { LoadingSpinner } from './components/icons/LoadingSpinner';
import { useAppStore } from './store/appStore';
import { useEventFilters } from './hooks/useEventFilters';
import { useEventLoader } from './hooks/useEventLoader';
import { hybridETLService } from './services/hybridETLService';
import { DATE_FILTERS, IWATE_AREA_KEYS } from './constants';
import type { EventInfo } from './types';


function App() {
  const {
    events,
    sources,
    selectedEvent,
    selectEvent,
  } = useAppStore();
  
  const { loadEvents, isLoading, error } = useEventLoader();
  const {
    categories,
    activeCategory,
    setActiveCategory,
    activeArea,
    setActiveArea,
    activeDateFilter,
    setActiveDateFilter,
    filteredEvents,
    resetFilters
  } = useEventFilters(events);


  const handleLoadEvents = async () => {
    await loadEvents();
    resetFilters();
  };

  useEffect(() => {
    // Load events on mount
    if (events.length === 0 && !isLoading) {
      handleLoadEvents();
    }
    
    // Add global test function for development
    if (typeof window !== 'undefined') {
      (window as any).testHybridETL = async () => {
        console.log('🚀 Testing Hybrid ETL System...');
        try {
          const result = await hybridETLService.fetchIwateEvents();
          console.log('✅ Success!', {
            events: result.events.length,
            sources: result.sources.length,
            sampleEvents: result.events.slice(0, 3)
          });
          
          // Show statistics
          const stats = hybridETLService.getStatistics();
          console.log('📊 System Statistics:', stats);
          
          return result;
        } catch (error) {
          console.error('❌ Test failed:', error);
          throw error;
        }
      };
      
      (window as any).showSystemStats = () => {
        const stats = hybridETLService.getStatistics();
        console.log('📊 Hybrid ETL Statistics:', stats);
        return stats;
      };

      (window as any).testSimple = async () => {
        console.log('🔬 Simple HTTP test...');
        try {
          const { httpClient } = await import('./services/httpClient');
          const response = await httpClient.fetch('https://www.pref.iwate.jp/news.rss');
          const text = await response.text();
          console.log('✅ HTTP test successful');
          console.log('Response length:', text.length);
          console.log('Is mock data?', response.headers.get('X-Mock-Data') === 'true');
          console.log('First 200 chars:', text.substring(0, 200));
          return { success: true, length: text.length, isMock: response.headers.get('X-Mock-Data'), preview: text.substring(0, 200) };
        } catch (error) {
          console.error('❌ HTTP test failed:', error);
          return { success: false, error: error.message };
        }
      };

      (window as any).testRawFetch = async () => {
        console.log('🔬 Raw fetch test (bypass all systems)...');
        try {
          // Test 1: Direct fetch with proxy
          console.log('Test 1: Direct proxy fetch');
          const proxyResponse = await fetch('/api/proxy-iwate/news.rss');
          console.log('Proxy response status:', proxyResponse.status);
          if (!proxyResponse.ok) {
            console.log('Proxy failed, trying mock...');
            
            // Test 2: Mock data generation
            const mockRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>テストRSS</title>
    <item>
      <title>テストイベント</title>
      <description>これはテスト用のイベントです</description>
      <pubDate>${new Date().toISOString()}</pubDate>
    </item>
  </channel>
</rss>`;
            console.log('Generated mock RSS:', mockRSS.length, 'chars');
            return { success: true, data: mockRSS, isMock: true };
          } else {
            const text = await proxyResponse.text();
            console.log('Proxy success! Length:', text.length);
            return { success: true, data: text.substring(0, 200), isMock: false };
          }
        } catch (error) {
          console.error('❌ Raw fetch test failed:', error);
          return { success: false, error: error.message };
        }
      };

      (window as any).loadManual = async () => {
        console.log('📋 Manual load events...');
        await handleLoadEvents();
      };
      
      console.log('🔧 Dev mode: Run window.testHybridETL() to test the system');
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length, isLoading]);



  const handleSelectEvent = (event: EventInfo | null) => {
    selectEvent(event);
  };

  const handleCloseModal = () => {
    selectEvent(null);
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-white shadow-md z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-teal-700">
            岩手イベントナビゲーター
          </h1>
          {((import.meta as any)?.env?.VITE_CITY_SCOPE === 'morioka' || true) && (
            <span className="ml-4 px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-full">
              盛岡市のみ表示中 ({(import.meta as any)?.env?.VITE_CITY_SCOPE || 'undefined'})
            </span>
          )}
          <button
            onClick={handleLoadEvents}
            disabled={isLoading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-400 transition-colors flex items-center"
          >
            {isLoading ? <LoadingSpinner className="h-5 w-5 mr-2" /> : null}
            イベント更新
          </button>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex flex-col justify-center items-center z-50">
            <LoadingSpinner className="h-16 w-16 text-white" />
            <p className="mt-4 text-white text-lg">岩手のイベントを探しています...</p>
          </div>
        )}

        {error && !events.length && (
           <div className="absolute inset-0 bg-red-100 flex flex-col justify-center items-center z-40 p-4">
            <p className="text-red-700 text-xl font-semibold">イベントデータの読み込みに失敗しました</p>
            <p className="text-red-600 mt-2 text-sm">地図は表示されますが、イベント情報が取得できませんでした</p>
            <button
              onClick={handleLoadEvents}
              className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              再試行
            </button>
          </div>
        )}

        {error && events.length > 0 && (
          <div className="absolute top-20 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-30 max-w-md">
            <p className="text-sm font-medium">一部のイベント情報が更新できませんでした</p>
            <button
              onClick={handleLoadEvents}
              className="mt-1 text-xs text-yellow-600 hover:text-yellow-800 underline"
            >
              再試行
            </button>
          </div>
        )}

        <>
          <Sidebar 
            events={isLoading ? [] : filteredEvents} 
            sources={sources}
            onSelectEvent={handleSelectEvent}
            selectedEvent={selectedEvent}
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            areas={IWATE_AREA_KEYS}
            activeArea={activeArea}
            onSelectArea={setActiveArea}
            dateFilters={DATE_FILTERS}
            activeDateFilter={activeDateFilter}
            onSelectDateFilter={setActiveDateFilter}
          />
          <MapPanel 
            events={isLoading ? [] : filteredEvents}
            onSelectEvent={handleSelectEvent}
            selectedEvent={selectedEvent}
          />
        </>
      </main>

      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}

export default App;
