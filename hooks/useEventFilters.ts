import { useState, useMemo } from 'react';
import { EventInfo } from '../types';
import { getEventArea } from '../constants';

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

export const useEventFilters = (events: EventInfo[]) => {
  const [activeCategory, setActiveCategory] = useState<string>('すべて');
  // City scope from Vite env (browser)
  const cityScope = ((import.meta as any)?.env?.VITE_CITY_SCOPE as string | undefined)?.toLowerCase?.() || '';
  const [activeArea, setActiveArea] = useState<string>(cityScope === 'morioka' ? 'kenou' : 'all');
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');

  const categories = useMemo(() => {
    if (events.length === 0) return ['すべて'];
    return ['すべて', ...Array.from(new Set(events.map(e => e.category).filter(Boolean)))];
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

  const resetFilters = () => {
    setActiveCategory('すべて');
    // Respect city scope (keep kenou for morioka)
    setActiveArea(cityScope === 'morioka' ? 'kenou' : 'all');
    setActiveDateFilter('all');
  };

  return {
    categories,
    activeCategory,
    setActiveCategory,
    activeArea,
    setActiveArea,
    activeDateFilter,
    setActiveDateFilter,
    filteredEvents,
    resetFilters
  };
};
