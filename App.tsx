
import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapPanel } from './components/MapPanel';
import { EventDetailModal } from './components/EventDetailModal';
import { LoadingSpinner } from './components/icons/LoadingSpinner';
import { useAppStore } from './store/appStore';
import { useEventFilters } from './hooks/useEventFilters';
import { useEventLoader } from './hooks/useEventLoader';
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
    handleLoadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



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

        {error && (
           <div className="absolute inset-0 bg-red-100 flex flex-col justify-center items-center z-40 p-4">
            <p className="text-red-700 text-xl font-semibold">エラーが発生しました</p>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={handleLoadEvents}
              className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              再試行
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <Sidebar 
              events={filteredEvents} 
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
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              selectedEvent={selectedEvent}
            />
          </>
        )}
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
