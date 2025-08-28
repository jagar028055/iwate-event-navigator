import { ISourceAdapter, SourceType, HybridSource, RawEventData, NormalizedEvent, ValidationResult } from '../types';

export class ICSAdapter implements ISourceAdapter {
  readonly sourceType = SourceType.ICS_CALENDAR;
  readonly name = 'ICS Calendar Adapter';

  canHandle(source: HybridSource): boolean {
    return source.type === SourceType.ICS_CALENDAR || 
           source.url.includes('.ics') ||
           source.url.includes('/calendar') ||
           source.searchStrategy.method === 'ics_fetch';
  }

  async fetch(source: HybridSource): Promise<RawEventData[]> {
    const startTime = Date.now();
    
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Iwate-Event-Navigator/1.0',
        'Accept': 'text/calendar, text/plain',
        ...(source.searchStrategy.fetchConfig?.headers || {})
      };

      // Add ETag/If-Modified-Since for caching
      if (source.etag) {
        headers['If-None-Match'] = source.etag;
      }
      if (source.lastModified) {
        headers['If-Modified-Since'] = source.lastModified;
      }

      const response = await fetch(source.url, { headers });
      
      if (response.status === 304) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const icsContent = await response.text();
      const contentHash = await this.generateContentHash(icsContent);

      // Update source metadata
      if (response.headers.get('etag')) {
        source.etag = response.headers.get('etag')!;
      }
      if (response.headers.get('last-modified')) {
        source.lastModified = response.headers.get('last-modified')!;
      }

      const rawData: RawEventData = {
        sourceId: source.id,
        rawContent: icsContent,
        extractedAt: new Date(),
        contentHash,
        sourceUrl: source.url
      };

      source.fetchHistory.push({
        timestamp: new Date(),
        success: true,
        statusCode: response.status,
        itemsFound: 0,
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
      const response = await fetch(source.url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Iwate-Event-Navigator/1.0' }
      });

      const contentType = response.headers.get('content-type') || '';
      const isValidICS = contentType.includes('calendar') || contentType.includes('text/plain');

      return {
        isValid: response.ok && isValidICS,
        errors: response.ok ? [] : [`HTTP ${response.status}: ${response.statusText}`],
        warnings: isValidICS ? [] : [`Unexpected content-type: ${contentType}`],
        confidence: response.ok && isValidICS ? 0.95 : 0.3
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
        const icsEvents = this.parseICSContent(raw.rawContent);
        
        for (const icsEvent of icsEvents) {
          const normalized = await this.normalizeICSEvent(icsEvent, source, raw);
          if (normalized) {
            events.push(normalized);
          }
        }

        // Update items found
        const lastFetch = source.fetchHistory[source.fetchHistory.length - 1];
        if (lastFetch) {
          lastFetch.itemsFound = icsEvents.length;
        }

      } catch (error) {
        console.error(`Failed to parse ICS from ${source.name}:`, error);
      }
    }

    return events;
  }

  private parseICSContent(content: string): ICSEvent[] {
    const events: ICSEvent[] = [];
    const lines = content.split(/\r?\n/).map(line => line.trim());
    
    let currentEvent: Partial<ICSEvent> | null = null;
    let inEvent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
        continue;
      }
      
      if (line === 'END:VEVENT') {
        if (currentEvent && this.isValidICSEvent(currentEvent)) {
          events.push(currentEvent as ICSEvent);
        }
        inEvent = false;
        currentEvent = null;
        continue;
      }
      
      if (!inEvent || !currentEvent) continue;

      // Handle line continuation (lines starting with space/tab)
      let fullLine = line;
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        i++;
        fullLine += lines[i].substring(1);
      }

      const colonIndex = fullLine.indexOf(':');
      if (colonIndex === -1) continue;

      const propName = fullLine.substring(0, colonIndex);
      const propValue = fullLine.substring(colonIndex + 1);

      // Extract property name and parameters
      const [baseProp, ...params] = propName.split(';');
      
      switch (baseProp) {
        case 'UID':
          currentEvent.uid = propValue;
          break;
        case 'SUMMARY':
          currentEvent.summary = this.unescapeICSText(propValue);
          break;
        case 'DESCRIPTION':
          currentEvent.description = this.unescapeICSText(propValue);
          break;
        case 'LOCATION':
          currentEvent.location = this.unescapeICSText(propValue);
          break;
        case 'DTSTART':
          currentEvent.dtstart = this.parseICSDate(propValue, params);
          break;
        case 'DTEND':
          currentEvent.dtend = this.parseICSDate(propValue, params);
          break;
        case 'URL':
          currentEvent.url = propValue;
          break;
        case 'ORGANIZER':
          currentEvent.organizer = this.extractOrganizerName(propValue, params);
          break;
        case 'CATEGORIES':
          currentEvent.categories = propValue.split(',').map(c => c.trim());
          break;
      }
    }

    return events;
  }

  private isValidICSEvent(event: Partial<ICSEvent>): boolean {
    return !!(event.uid && event.summary && event.dtstart);
  }

  private parseICSDate(dateStr: string, params: string[]): Date | null {
    try {
      // Handle timezone parameter
      const tzParam = params.find(p => p.startsWith('TZID='));
      
      // Remove timezone info for now (can be enhanced later)
      const cleanDateStr = dateStr.replace(/Z$/, '');
      
      if (cleanDateStr.length === 8) {
        // YYYYMMDD format
        const year = parseInt(cleanDateStr.substring(0, 4));
        const month = parseInt(cleanDateStr.substring(4, 6)) - 1;
        const day = parseInt(cleanDateStr.substring(6, 8));
        return new Date(year, month, day);
      } else if (cleanDateStr.length === 15) {
        // YYYYMMDDTHHMMSS format
        const year = parseInt(cleanDateStr.substring(0, 4));
        const month = parseInt(cleanDateStr.substring(4, 6)) - 1;
        const day = parseInt(cleanDateStr.substring(6, 8));
        const hour = parseInt(cleanDateStr.substring(9, 11));
        const minute = parseInt(cleanDateStr.substring(11, 13));
        const second = parseInt(cleanDateStr.substring(13, 15));
        return new Date(year, month, day, hour, minute, second);
      }
      
      return new Date(dateStr);
    } catch {
      return null;
    }
  }

  private unescapeICSText(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  private extractOrganizerName(organizer: string, params: string[]): string {
    // Look for CN parameter
    const cnParam = params.find(p => p.startsWith('CN='));
    if (cnParam) {
      return cnParam.substring(3).replace(/"/g, '');
    }
    
    // Extract from email if no CN
    if (organizer.includes('mailto:')) {
      return organizer.replace('mailto:', '').split('@')[0];
    }
    
    return organizer;
  }

  private async normalizeICSEvent(icsEvent: ICSEvent, source: HybridSource, raw: RawEventData): Promise<NormalizedEvent | null> {
    try {
      if (!icsEvent.dtstart || !icsEvent.summary) {
        return null;
      }

      // Extract location info
      const locationInfo = this.extractLocationInfo(icsEvent.location || '');
      
      // Generate deduplication key
      const dedupe_key = this.generateDedupeKey(
        icsEvent.summary, 
        icsEvent.dtstart, 
        locationInfo.venue || source.region
      );

      const now = new Date();
      const eventId = `ics_${source.id}_${icsEvent.uid || this.generateEventId(icsEvent.summary, icsEvent.dtstart)}`;

      return {
        id: eventId,
        title: icsEvent.summary.trim(),
        description: icsEvent.description?.trim(),
        starts_at: icsEvent.dtstart,
        ends_at: icsEvent.dtend,
        venue: locationInfo.venue,
        city: locationInfo.city || this.getRegionCity(source.region),
        lat: locationInfo.lat,
        lon: locationInfo.lon,
        category: this.categorizeFromICS(icsEvent),
        price: this.extractPrice(icsEvent.description || ''),
        organizer: icsEvent.organizer || source.name,
        source_url: icsEvent.url || source.url,
        source_id: source.id,
        last_seen: now,
        created_at: now,
        updated_at: now,
        dedupe_key,
        confidence: 0.85, // ICS is generally high confidence
        validation_status: 'pending' as const
      };

    } catch (error) {
      console.error(`Failed to normalize ICS event:`, error);
      return null;
    }
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

  private categorizeFromICS(event: ICSEvent): string {
    // Use categories if available
    if (event.categories && event.categories.length > 0) {
      const category = event.categories[0].toLowerCase();
      if (category.includes('festival')) return 'festivals';
      if (category.includes('food') || category.includes('グルメ')) return 'food_events';
      if (category.includes('culture') || category.includes('文化')) return 'cultural';
      if (category.includes('sport') || category.includes('スポーツ')) return 'sports';
    }

    // Fallback to text analysis
    const text = (event.summary + ' ' + (event.description || '')).toLowerCase();
    
    if (text.includes('まつり') || text.includes('祭り') || text.includes('フェスティバル')) {
      return 'festivals';
    }
    if (text.includes('グルメ') || text.includes('食べ') || text.includes('収穫')) {
      return 'food_events';
    }
    if (text.includes('コンサート') || text.includes('展示') || text.includes('文化')) {
      return 'cultural';
    }
    if (text.includes('スポーツ') || text.includes('大会') || text.includes('マラソン')) {
      return 'sports';
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
    const cleanTitle = title.replace(/[^\w]/g, '').substring(0, 20);
    const timestamp = date.getTime();
    return `${cleanTitle}_${timestamp}`;
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

interface ICSEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: Date;
  dtend?: Date;
  url?: string;
  organizer?: string;
  categories?: string[];
}