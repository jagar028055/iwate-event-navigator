import { useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { hybridETLService } from '../services/hybridETLService';
import { fetchIwateEvents } from '../services/geminiService';
import { aiService } from '../services/aiService';
import type { EventInfo, EventFilters, RecommendationRequest } from '../types';

export const useEvents = () => {
  const {
    events,
    sources,
    loading,
    error,
    selectedEvent,
    recommendedEvents,
    searchResults,
    searchQuery,
    setLoading,
    setError,
    setEvents,
    setSources,
    selectEvent,
    setRecommendedEvents,
    setSearchResults,
    setSearchQuery,
  } = useAppStore();

  // Load events from Hybrid ETL API
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      try {
        // Try Hybrid ETL service first
        console.log('🚀 Loading events with Hybrid ETL...');
        result = await hybridETLService.fetchIwateEvents();
      } catch (hybridError) {
        console.warn('❌ Hybrid ETL failed, falling back to legacy service:', hybridError);
        // Fallback to original service
        result = await fetchIwateEvents();
      }
      
      setEvents(result.events);
      setSources(result.sources);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'イベント情報の取得に失敗しました。時間をおいて再度お試しください。';
      
      setError(errorMessage);
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setEvents, setSources]);

  // Search events with AI enhancement
  const searchEvents = useCallback(async (query: string, filters: EventFilters) => {
    try {
      setLoading(true);
      setError(null);
      setSearchQuery(query);

      // Basic filtering
      let filteredEvents = events.filter(event => {
        if (query && !event.title.toLowerCase().includes(query.toLowerCase()) &&
            !event.description.toLowerCase().includes(query.toLowerCase()) &&
            !event.locationName.toLowerCase().includes(query.toLowerCase())) {
          return false;
        }

        if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
          return false;
        }

        if (filters.dateRange.start || filters.dateRange.end) {
          const eventDate = new Date(event.date);
          if (filters.dateRange.start && eventDate < filters.dateRange.start) return false;
          if (filters.dateRange.end && eventDate > filters.dateRange.end) return false;
        }

        return true;
      });

      // AI enhancement
      if (query.trim()) {
        const enhancedResults = await aiService.enhanceSearchResults(query, filteredEvents, filters);
        setSearchResults(enhancedResults.events);
      } else {
        setSearchResults(filteredEvents);
      }
    } catch (err) {
      setError('検索に失敗しました。');
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [events, setLoading, setError, setSearchQuery, setSearchResults]);

  // Generate AI recommendations
  const generateRecommendations = useCallback(async (request: RecommendationRequest) => {
    try {
      setLoading(true);
      setError(null);

      const recommendations = await aiService.generateRecommendations(request, events);
      setRecommendedEvents(recommendations.recommendations);
    } catch (err) {
      setError('推薦の生成に失敗しました。');
      console.error('Recommendation generation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [events, setLoading, setError, setRecommendedEvents]);

  // Filter events by location
  const getEventsByLocation = useCallback((center: [number, number], radiusKm: number): EventInfo[] => {
    return events.filter(event => {
      const distance = calculateDistance(
        center[0], center[1],
        event.latitude, event.longitude
      );
      return distance <= radiusKm;
    });
  }, [events]);

  // Filter events by category
  const getEventsByCategory = useCallback((category: string): EventInfo[] => {
    return events.filter(event => event.category === category);
  }, [events]);

  // Get events for today
  const getTodaysEvents = useCallback((): EventInfo[] => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = event.date.split(' - ')[0]; // Handle date ranges
      return eventDate === today;
    });
  }, [events]);

  // Get upcoming events (within next 7 days)
  const getUpcomingEvents = useCallback((): EventInfo[] => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events.filter(event => {
      const eventDate = new Date(event.date.split(' - ')[0]);
      return eventDate >= now && eventDate <= nextWeek;
    });
  }, [events]);

  // Initialize events on mount
  useEffect(() => {
    if (events.length === 0 && !loading) {
      loadEvents();
    }
  }, [events.length, loading, loadEvents]);

  return {
    // State
    events,
    sources,
    loading,
    error,
    selectedEvent,
    recommendedEvents,
    searchResults,
    searchQuery,

    // Actions
    loadEvents,
    searchEvents,
    selectEvent,
    generateRecommendations,

    // Utilities
    getEventsByLocation,
    getEventsByCategory,
    getTodaysEvents,
    getUpcomingEvents,
  };
};

// Utility function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}