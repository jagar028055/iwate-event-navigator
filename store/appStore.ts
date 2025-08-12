import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { EventInfo, Source, EventFilters, UserPreferences } from '../types'

export interface UIState {
  loading: boolean
  error: string | null
  theme: 'light' | 'dark'
  locale: string
  sidebarOpen: boolean
}

export interface UserState {
  preferences: UserPreferences
  bookmarks: string[]
  searchHistory: string[]
  locationPermission: boolean
  currentLocation: [number, number] | null
}

export interface EventsState {
  events: EventInfo[]
  sources: Source[]
  filters: EventFilters
  selectedEvent: EventInfo | null
  recommendedEvents: EventInfo[]
  searchResults: EventInfo[]
  searchQuery: string
}

export interface MapState {
  center: [number, number]
  zoom: number
  selectedMarkers: string[]
  layerType: 'osm' | 'gsi'
}

export interface AppStore extends UIState, UserState, EventsState, MapState {
  // UI Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setTheme: (theme: 'light' | 'dark') => void
  setSidebarOpen: (open: boolean) => void

  // User Actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  addBookmark: (eventId: string) => void
  removeBookmark: (eventId: string) => void
  addSearchHistory: (query: string) => void
  setCurrentLocation: (location: [number, number] | null) => void

  // Event Actions
  setEvents: (events: EventInfo[]) => void
  setSources: (sources: Source[]) => void
  setFilters: (filters: Partial<EventFilters>) => void
  selectEvent: (event: EventInfo | null) => void
  setRecommendedEvents: (events: EventInfo[]) => void
  setSearchResults: (results: EventInfo[]) => void
  setSearchQuery: (query: string) => void

  // Map Actions
  updateMapView: (center: [number, number], zoom: number) => void
  selectMarker: (markerId: string) => void
  toggleLayer: () => void

  // Combined Actions
  reset: () => void
}

const defaultFilters: EventFilters = {
  keyword: '',
  categories: [],
  dateRange: { start: null, end: null },
  location: null,
  priceRange: { min: 0, max: 10000 },
  accessibility: [],
  targetAge: []
}

const defaultPreferences: UserPreferences = {
  language: 'ja',
  timezone: 'Asia/Tokyo',
  notifications: {
    enabled: false,
    eventReminder: false,
    newRecommendation: false,
    weatherAlert: false
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    screenReader: false,
    reducedMotion: false
  },
  privacy: {
    locationTracking: false,
    analyticsOptIn: false,
    personalizedAds: false
  }
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial UI State
        loading: false,
        error: null,
        theme: 'light',
        locale: 'ja',
        sidebarOpen: false,

        // Initial User State
        preferences: defaultPreferences,
        bookmarks: [],
        searchHistory: [],
        locationPermission: false,
        currentLocation: null,

        // Initial Events State
        events: [],
        sources: [],
        filters: defaultFilters,
        selectedEvent: null,
        recommendedEvents: [],
        searchResults: [],
        searchQuery: '',

        // Initial Map State
        center: [39.7036, 141.1527] as [number, number], // 岩手県中心
        zoom: 9,
        selectedMarkers: [],
        layerType: 'osm',

        // UI Actions
        setLoading: (loading: boolean) => set({ loading }, false, 'setLoading'),
        setError: (error: string | null) => set({ error }, false, 'setError'),
        setTheme: (theme: 'light' | 'dark') => set({ theme }, false, 'setTheme'),
        setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }, false, 'setSidebarOpen'),

        // User Actions
        updatePreferences: (newPreferences: Partial<UserPreferences>) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, ...newPreferences }
            }),
            false,
            'updatePreferences'
          ),

        addBookmark: (eventId: string) =>
          set(
            (state) => ({
              bookmarks: state.bookmarks.includes(eventId)
                ? state.bookmarks
                : [...state.bookmarks, eventId]
            }),
            false,
            'addBookmark'
          ),

        removeBookmark: (eventId: string) =>
          set(
            (state) => ({
              bookmarks: state.bookmarks.filter(id => id !== eventId)
            }),
            false,
            'removeBookmark'
          ),

        addSearchHistory: (query: string) =>
          set(
            (state) => ({
              searchHistory: [
                query,
                ...state.searchHistory.filter(q => q !== query)
              ].slice(0, 10) // Keep only last 10 searches
            }),
            false,
            'addSearchHistory'
          ),

        setCurrentLocation: (location: [number, number] | null) =>
          set({ currentLocation: location }, false, 'setCurrentLocation'),

        // Event Actions
        setEvents: (events: EventInfo[]) => set({ events }, false, 'setEvents'),
        setSources: (sources: Source[]) => set({ sources }, false, 'setSources'),
        setFilters: (newFilters: Partial<EventFilters>) =>
          set(
            (state) => ({
              filters: { ...state.filters, ...newFilters }
            }),
            false,
            'setFilters'
          ),

        selectEvent: (event: EventInfo | null) =>
          set({ selectedEvent: event }, false, 'selectEvent'),

        setRecommendedEvents: (events: EventInfo[]) =>
          set({ recommendedEvents: events }, false, 'setRecommendedEvents'),

        setSearchResults: (results: EventInfo[]) =>
          set({ searchResults: results }, false, 'setSearchResults'),

        setSearchQuery: (query: string) =>
          set({ searchQuery: query }, false, 'setSearchQuery'),

        // Map Actions
        updateMapView: (center: [number, number], zoom: number) =>
          set({ center, zoom }, false, 'updateMapView'),

        selectMarker: (markerId: string) =>
          set(
            (state) => ({
              selectedMarkers: state.selectedMarkers.includes(markerId)
                ? state.selectedMarkers.filter(id => id !== markerId)
                : [...state.selectedMarkers, markerId]
            }),
            false,
            'selectMarker'
          ),

        toggleLayer: () =>
          set(
            (state) => ({
              layerType: state.layerType === 'osm' ? 'gsi' : 'osm'
            }),
            false,
            'toggleLayer'
          ),

        // Combined Actions
        reset: () =>
          set(
            {
              loading: false,
              error: null,
              events: [],
              sources: [],
              filters: defaultFilters,
              selectedEvent: null,
              recommendedEvents: [],
              searchResults: [],
              searchQuery: '',
              selectedMarkers: []
            },
            false,
            'reset'
          ),
      }),
      {
        name: 'iwate-event-navigator-storage',
        partialize: (state) => ({
          theme: state.theme,
          locale: state.locale,
          preferences: state.preferences,
          bookmarks: state.bookmarks,
          searchHistory: state.searchHistory,
          center: state.center,
          zoom: state.zoom,
          layerType: state.layerType
        })
      }
    )
  )
)