
// Core Event Types
export interface EventInfo {
  id: string;
  title: string;  // Changed from 'name' to 'title' for consistency
  description: string;
  date: string;
  locationName: string;
  latitude: number;
  longitude: number;
  category: string;
  officialUrl?: string;
  // Extended properties for full requirements
  organizer?: Organizer;
  tags?: string[];
  startDateTime?: Date;
  endDateTime?: Date;
  venue?: Venue;
  capacity?: number;
  currentParticipants?: number;
  priceInfo?: PriceInfo;
  images?: ImageInfo[];
  accessibility?: AccessibilityInfo;
}

export interface Source {
  uri: string;
  title: string;
}

// Extended Types for Requirements Compliance
export interface Organizer {
  id: string;
  name: string;
  type: 'individual' | 'organization' | 'government' | 'npo';
  contactInfo?: ContactInfo;
}

export interface Venue {
  id: string;
  name: string;
  address: Address;
  coordinates: [number, number];
  capacity: number;
  facilities: Facility[];
  accessibility: AccessibilityInfo;
}

export interface Address {
  prefecture: string;
  city: string;
  district?: string;
  streetAddress: string;
  postalCode: string;
}

export interface Facility {
  type: 'parking' | 'restroom' | 'elevator' | 'wifi' | 'food' | 'shop';
  available: boolean;
  description?: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface PriceInfo {
  isFree: boolean;
  adult?: number;
  child?: number;
  senior?: number;
  currency: string;
  description?: string;
}

export interface ImageInfo {
  url: string;
  alt: string;
  caption?: string;
  thumbnailUrl?: string;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  hearingLoop: boolean;
  visualAssistance: boolean;
  signLanguage: boolean;
  easyAccess: boolean;
  description?: string;
}

// Filter and Search Types
export interface EventFilters {
  keyword: string;
  categories: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  location: {
    center: [number, number];
    radius: number; // km
  } | null;
  priceRange: {
    min: number;
    max: number;
  };
  accessibility: AccessibilityOption[];
  targetAge: AgeGroup[];
}

export type AccessibilityOption = 
  | 'wheelchair'
  | 'hearing_loop'
  | 'visual_assistance'
  | 'sign_language'
  | 'easy_access';

export type AgeGroup = 
  | 'infant'
  | 'child'
  | 'teen'
  | 'adult'
  | 'senior'
  | 'all_ages';

// User and Preferences Types
export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  accessibility: AccessibilityPreferences;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  enabled: boolean;
  eventReminder: boolean;
  newRecommendation: boolean;
  weatherAlert: boolean;
  locationBased: boolean;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
}

export interface PrivacySettings {
  locationTracking: boolean;
  analyticsOptIn: boolean;
  personalizedAds: boolean;
}

// API and Response Types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface SearchResults {
  events: EventInfo[];
  total: number;
  query: string;
  filters: EventFilters;
  suggestions: string[];
}

// AI Recommendation Types
export interface RecommendationRequest {
  userId?: string;
  userProfile?: UserProfile;
  contextualInfo?: ContextualInfo;
}

export interface UserProfile {
  age?: number;
  interests: string[];
  visitHistory: EventInfo[];
  locationPreferences: [number, number][];
}

export interface ContextualInfo {
  currentLocation?: [number, number];
  weatherForecast?: WeatherInfo;
  companionType: 'solo' | 'family' | 'friends';
  availableTime: number; // minutes
}

export interface WeatherInfo {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  temperature: number;
  description: string;
}

export interface AIRecommendationResponse {
  recommendations: RecommendedEvent[];
  explanation: string;
  confidence: number; // 0-1
  alternatives: EventInfo[];
}

export interface RecommendedEvent extends EventInfo {
  recommendationReason: string;
  matchScore: number; // 0-1
}
