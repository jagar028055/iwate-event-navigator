
import { EventInfo } from './types';

// Approximate bounding box for Iwate Prefecture
export const IWATE_BOUNDS = {
  lat: {
    min: 38.9,
    max: 40.3,
  },
  lng: {
    min: 140.7,
    max: 142.1,
  },
};

export const IWATE_AREAS: { [key: string]: string } = {
  'all': 'すべて',
  'kenou': '県央',
  'kennan': '県南',
  'engan': '沿岸',
  'kenpoku': '県北',
};
export const IWATE_AREA_KEYS = Object.keys(IWATE_AREAS);


export const getEventArea = (event: EventInfo): string => {
    const { latitude, longitude } = event;
    if (longitude > 141.6) return 'engan';
    if (latitude > 39.9) return 'kenpoku';
    if (latitude < 39.5) return 'kennan';
    return 'kenou';
};

export const DATE_FILTERS = [
  { id: 'all', label: 'すべて' },
  { id: 'today', label: '今日' },
  { id: 'weekend', label: '今週末' },
  { id: 'next_week', label: '来週' },
  { id: 'this_month', label: '今月' },
];
