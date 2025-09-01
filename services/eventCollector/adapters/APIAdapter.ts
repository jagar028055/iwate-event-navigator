import { ISourceAdapter, SourceType, HybridSource, RawEventData, NormalizedEvent, ValidationResult } from '../types';
import { httpClient } from '../../httpClient';

export class APIAdapter implements ISourceAdapter {
  readonly sourceType = SourceType.REST_API;
  readonly name = 'REST API Adapter';

  canHandle(source: HybridSource): boolean {
    return source.type === SourceType.REST_API || 
           source.searchStrategy.method === 'rest_api' ||
           source.url.includes('/api/');
  }

  async fetch(source: HybridSource): Promise<RawEventData[]> {
    const startTime = Date.now();
    console.log(`🌐 APIAdapter fetching: ${source.url}`);
    
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Iwate-Event-Navigator/1.0)',
        ...(source.searchStrategy.fetchConfig?.headers || {})
      };

      // Add query parameters based on source configuration
      let requestUrl = source.url;
      if (source.searchStrategy.keywords && source.searchStrategy.keywords.length > 0) {
        const url = new URL(source.url);
        
        // Handle different API patterns
        if (source.url.includes('connpass.com')) {
          // Connpass API already has keyword in URL
          // No additional processing needed
        } else if (source.url.includes('doorkeeper.jp')) {
          // Doorkeeper API already has q parameter in URL
          // No additional processing needed
        } else {
          // Generic API - add keywords as q parameter
          url.searchParams.set('q', source.searchStrategy.keywords.join(' '));
        }
        
        requestUrl = url.toString();
      }

      const response = await httpClient.fetch(requestUrl, { headers });
      console.log(`📡 Response status: ${response.status}, Mock: ${response.headers.get('X-Mock-Data')}`);
      
      if (response.status === 304) {
        console.log(`✅ 304 Not Modified for ${source.url}`);
        return [];
      }

      if (!response.ok) {
        console.error(`❌ HTTP Error ${response.status}: ${response.statusText} for ${source.url}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonContent = await response.text();
      console.log(`📄 API response length: ${jsonContent.length} chars for ${source.url}`);
      
      if (jsonContent.length === 0) {
        console.warn(`⚠️ Empty API response from ${source.url}`);
        return [];
      }
      
      const contentHash = await this.generateContentHash(jsonContent);

      const rawData: RawEventData = {
        sourceId: source.id,
        rawContent: jsonContent,
        extractedAt: new Date(),
        contentHash,
        sourceUrl: source.url
      };

      source.fetchHistory.push({
        timestamp: new Date(),
        success: true,
        statusCode: response.status,
        itemsFound: 0, // Will be updated during normalization
        processingTime: Date.now() - startTime
      });

      return [rawData];

    } catch (error) {
      source.fetchHistory.push({
        timestamp: new Date(),
        success: false,
        error: error.message,
        itemsFound: 0,
        processingTime: Date.now() - startTime
      });
      
      throw error;
    }
  }

  async validate(source: HybridSource): Promise<ValidationResult> {
    try {
      const response = await httpClient.fetch(source.url, {
        method: 'HEAD',
        headers: { 'Accept': 'application/json' }
      });

      const contentType = response.headers.get('content-type') || '';
      const isValidJSON = contentType.includes('json') || contentType.includes('application');

      return {
        isValid: response.ok,
        errors: response.ok ? [] : [`HTTP ${response.status}: ${response.statusText}`],
        warnings: isValidJSON ? [] : [`Unexpected content-type: ${contentType}`],
        confidence: response.ok ? 0.9 : 0.2 // API sources have higher confidence than HTML scraping
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
        confidence: 0.1
      };
    }
  }

  async normalize(rawData: RawEventData[], source: HybridSource): Promise<NormalizedEvent[]> {
    const events: NormalizedEvent[] = [];

    for (const raw of rawData) {
      try {
        const parsedData = JSON.parse(raw.rawContent);
        const extractedEvents = this.extractEventsFromAPI(parsedData, source);
        
        for (const eventData of extractedEvents) {
          const normalized = await this.normalizeAPIEvent(eventData, source, raw);
          if (normalized) {
            events.push(normalized);
          }
        }

        // Update items found
        const lastFetch = source.fetchHistory[source.fetchHistory.length - 1];
        if (lastFetch) {
          lastFetch.itemsFound = extractedEvents.length;
        }

      } catch (error) {
        console.error(`Failed to parse API response from ${source.name}:`, error);
      }
    }

    return events;
  }

  private extractEventsFromAPI(data: any, source: HybridSource): APIEventData[] {
    const events: APIEventData[] = [];
    
    try {
      // Handle different API response structures
      if (source.url.includes('connpass.com')) {
        events.push(...this.extractConnpassEvents(data));
      } else if (source.url.includes('doorkeeper.jp')) {
        events.push(...this.extractDoorkeeperEvents(data));
      } else {
        // Generic API structure
        events.push(...this.extractGenericAPIEvents(data));
      }
    } catch (error) {
      console.error('API event extraction failed:', error);
    }

    return events.filter(event => this.isValidAPIEvent(event));
  }

  private extractConnpassEvents(data: any): APIEventData[] {
    const events: APIEventData[] = [];
    
    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        events.push({
          title: event.title || '',
          description: event.description || event.catch || '',
          startDate: event.started_at,
          endDate: event.ended_at,
          location: event.address || event.place || '',
          url: event.event_url,
          organizer: event.owner_display_name,
          category: 'community',
          participants: event.accepted,
          maxParticipants: event.limit
        });
      }
    }
    
    return events;
  }

  private extractDoorkeeperEvents(data: any): APIEventData[] {
    const events: APIEventData[] = [];
    
    if (Array.isArray(data)) {
      for (const event of data) {
        events.push({
          title: event.title || '',
          description: event.description || '',
          startDate: event.starts_at,
          endDate: event.ends_at,
          location: event.venue?.name || event.address || '',
          url: event.public_url,
          organizer: event.group?.name,
          category: 'community',
          participants: event.ticket_count,
          maxParticipants: event.ticket_limit
        });
      }
    }
    
    return events;
  }

  private extractGenericAPIEvents(data: any): APIEventData[] {
    const events: APIEventData[] = [];
    
    // Handle array of events
    if (Array.isArray(data)) {
      for (const item of data) {
        if (this.looksLikeEvent(item)) {
          events.push(this.normalizeGenericEvent(item));
        }
      }
    }
    
    // Handle object with events property
    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        events.push(this.normalizeGenericEvent(event));
      }
    }
    
    // Handle object with items property
    if (data.items && Array.isArray(data.items)) {
      for (const event of data.items) {
        events.push(this.normalizeGenericEvent(event));
      }
    }
    
    return events;
  }

  private looksLikeEvent(item: any): boolean {
    return !!(item.title || item.name) && !!(item.date || item.startDate || item.starts_at || item.started_at);
  }

  private normalizeGenericEvent(item: any): APIEventData {
    return {
      title: item.title || item.name || '',
      description: item.description || item.summary || '',
      startDate: item.startDate || item.starts_at || item.started_at || item.date,
      endDate: item.endDate || item.ends_at || item.ended_at,
      location: item.location || item.venue || item.address || item.place || '',
      url: item.url || item.link || item.event_url,
      organizer: item.organizer || item.owner || item.host,
      category: 'general'
    };
  }

  private isValidAPIEvent(event: APIEventData): boolean {
    return !!(event.title && event.title.length > 3 && event.startDate);
  }

  private async normalizeAPIEvent(eventData: APIEventData, source: HybridSource, raw: RawEventData): Promise<NormalizedEvent | null> {
    try {
      if (!eventData.title || !eventData.startDate) return null;

      // Parse date
      const starts_at = this.parseAPIDate(eventData.startDate);
      if (!starts_at) return null;

      const ends_at = eventData.endDate ? this.parseAPIDate(eventData.endDate) : undefined;

      // Extract location info
      const locationInfo = this.extractLocationInfo(eventData.location);
      
      // Generate deduplication key
      const dedupe_key = this.generateDedupeKey(
        eventData.title, 
        starts_at, 
        locationInfo.venue || source.region
      );

      const now = new Date();
      const eventId = `api_${source.id}_${this.generateEventId(eventData.title, starts_at)}`;

      return {
        id: eventId,
        title: eventData.title.trim(),
        description: eventData.description?.trim(),
        starts_at,
        ends_at,
        venue: locationInfo.venue,
        city: locationInfo.city || this.getRegionCity(source.region),
        lat: locationInfo.lat,
        lon: locationInfo.lon,
        category: this.categorizeEvent(eventData.title, eventData.description || ''),
        price: this.extractPrice(eventData.description || ''),
        organizer: eventData.organizer || source.name,
        source_url: eventData.url || source.url,
        source_id: source.id,
        last_seen: now,
        created_at: now,
        updated_at: now,
        dedupe_key,
        confidence: 0.85, // API sources have high confidence
        validation_status: 'pending' as const
      };

    } catch (error) {
      console.error(`Failed to normalize API event:`, error);
      return null;
    }
  }

  private parseAPIDate(dateString: string): Date | null {
    if (!dateString) return null;

    try {
      // Handle ISO dates
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      console.error('Date parsing failed:', error);
    }

    return null;
  }

  private extractLocationInfo(location: string): { venue?: string; city?: string; lat?: number; lon?: number } {
    if (!location) return {};

    const iwateCities = ['盛岡', '一関', '奥州', '花巻', '北上', '久慈', '遠野', '釜石', '二戸', '八幡平', '大船渡', '陸前高田'];
    
    for (const city of iwateCities) {
      if (location.includes(city)) {
        const venue = location.replace(city, '').trim().replace(/^[、,]/, '');
        return { city, venue: venue || undefined };
      }
    }

    return { venue: location };
  }

  private categorizeEvent(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('勉強会') || text.includes('セミナー') || text.includes('講座')) {
      return 'education';
    }
    if (text.includes('meetup') || text.includes('交流') || text.includes('懇親')) {
      return 'community';
    }
    if (text.includes('tech') || text.includes('programming') || text.includes('プログラミング')) {
      return 'technology';
    }
    if (text.includes('workshop') || text.includes('ワークショップ') || text.includes('実習')) {
      return 'workshop';
    }
    
    return 'general';
  }

  private extractPrice(text: string): string | undefined {
    const priceMatch = text.match(/(\d+(?:,\d+)*)\s*円/);
    return priceMatch ? priceMatch[0] : undefined;
  }

  private generateDedupeKey(title: string, date: Date, venue: string): string {
    const cleanTitle = title.replace(/[^\w\s]/g, '').trim().toLowerCase();
    const dateStr = date.toISOString().split('T')[0];
    const cleanVenue = venue.replace(/[^\w\s]/g, '').trim().toLowerCase();
    
    return `${cleanTitle}_${dateStr}_${cleanVenue}`;
  }

  private generateEventId(title: string, date: Date): string {
    const cleanTitle = title.replace(/[^\w]/g, '').substring(0, 15);
    const timestamp = date.getTime();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const hash = this.generateSimpleHash(title + date.toISOString());
    return `${cleanTitle}_${timestamp}_${hash}_${randomSuffix}`;
  }

  private generateSimpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6);
  }

  private getRegionCity(region: string): string {
    const regionCityMap: Record<string, string> = {
      'kenou': '盛岡市',
      'kennan': '奥州市',
      'engan': '釜石市',
      'kenpoku': '久慈市',
      'all': '岩手県'
    };
    
    return regionCityMap[region] || '岩手県';
  }

  private async generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

interface APIEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location: string;
  url?: string;
  organizer?: string;
  category?: string;
  participants?: number;
  maxParticipants?: number;
}