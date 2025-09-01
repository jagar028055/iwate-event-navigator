import type { EventInfo, Source } from '../types';

// Manual event loader for initial release
// Reads static JSON bundled with the app
export const manualEventService = {
  async fetchEvents(): Promise<{ events: EventInfo[]; sources: Source[] }> {
    try {
      const data = (await import('../data/manual-events.json')).default as EventInfo[];
      const events: EventInfo[] = data.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description || '',
        date: e.date,
        locationName: e.locationName || '',
        latitude: Number(e.latitude) || 0,
        longitude: Number(e.longitude) || 0,
        category: e.category || 'general',
        officialUrl: e.officialUrl || ''
      }));

      const sources: Source[] = [
        { uri: 'manual://events', title: '手動登録イベント' }
      ];

      return { events, sources };
    } catch (err) {
      console.error('Failed to load manual events:', err);
      return { events: [], sources: [] };
    }
  }
};

