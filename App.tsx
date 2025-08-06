
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapPanel } from './components/MapPanel';
import { EventDetailModal } from './components/EventDetailModal';
import { LoadingSpinner } from './components/icons/LoadingSpinner';
import { fetchIwateEvents } from './services/geminiService';
import { EventInfo, Source } from './types';
import { DATE_FILTERS, IWATE_AREA_KEYS, getEventArea } from './constants';

const checkDateFilter = (event: EventInfo, filter: string): boolean => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const eventDateStr = event.date.split(' - ')[0]; // Handle date ranges by taking the start date
  const eventDate = new Date(eventDateStr);
  if (isNaN(eventDate.getTime())) return false; // Invalid date format

  eventDate.setHours(0, 0, 0, 0);

  let startDate: Date, endDate: Date;

  switch (filter) {
    case 'today':
      startDate = new Date(now);
      endDate = new Date(now);
      break;
    case 'weekend':
      startDate = new Date(now);
      const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
      startDate.setDate(now.getDate() - dayOfWeek + 6); // Upcoming Saturday
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1); // Upcoming Sunday
      break;
    case 'next_week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay() + 8); // Next Monday
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Next Sunday
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    default:
      return true;
  }
  
  // Check if event date is within the filter range
  const [eventStartStr, eventEndStr] = event.date.split(' - ');
  const eventStartDate = new Date(eventStartStr);
  const eventEndDate = eventEndStr ? new Date(eventEndStr) : eventStartDate;
  
  if (isNaN(eventStartDate.getTime())) return false;
  
  eventStartDate.setHours(0, 0, 0, 0);
  eventEndDate.setHours(0, 0, 0, 0);

  return eventStartDate <= endDate && eventEndDate >= startDate;
};


function App() {
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<string[]>(['すべて']);
  const [activeCategory, setActiveCategory] = useState<string>('すべて');
  const [activeArea, setActiveArea] = useState<string>('all');
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');


  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActiveCategory('すべて');
    setActiveArea('all');
    setActiveDateFilter('all');
    try {
      const { events: fetchedEvents, sources: fetchedSources } = await fetchIwateEvents();
      setEvents(fetchedEvents);
      setSources(fetchedSources);
    } catch (err) {
      console.error(err);
      setError('イベント情報の取得に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      const uniqueCategories = ['すべて', ...Array.from(new Set(events.map(e => e.category).filter(Boolean)))];
      setCategories(uniqueCategories);
    }
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Area filter
      if (activeArea !== 'all' && getEventArea(event) !== activeArea) {
        return false;
      }
      // Category filter
      if (activeCategory !== 'すべて' && event.category !== activeCategory) {
        return false;
      }
      // Date filter
      if (activeDateFilter !== 'all' && !checkDateFilter(event, activeDateFilter)) {
          return false;
      }
      return true;
    });
  }, [events, activeCategory, activeArea, activeDateFilter]);

  const handleSelectEvent = (event: EventInfo | null) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-white shadow-md z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-teal-700">
            岩手イベントナビゲーター
          </h1>
          <button
            onClick={loadEvents}
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
              onClick={loadEvents}
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
