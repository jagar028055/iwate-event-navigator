import { ISourceAdapter, SourceType, HybridSource, RawEventData, NormalizedEvent, ValidationResult } from '../types';
import { httpClient } from '../../httpClient';

export class RSSAdapter implements ISourceAdapter {
  readonly sourceType = SourceType.RSS_FEED;
  readonly name = 'RSS Feed Adapter';

  canHandle(source: HybridSource): boolean {
    return source.type === SourceType.RSS_FEED || 
           source.url.includes('.rss') || 
           source.url.includes('/rss') ||
           source.url.includes('/feed');
  }

  async fetch(source: HybridSource): Promise<RawEventData[]> {
    const startTime = Date.now();
    
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Iwate-Event-Navigator/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
        ...(source.searchStrategy.fetchConfig?.headers || {})
      };

      // Add ETag/If-Modified-Since for caching
      if (source.etag) {
        headers['If-None-Match'] = source.etag;
      }
      if (source.lastModified) {
        headers['If-Modified-Since'] = source.lastModified;
      }

      const response = await httpClient.fetch(source.url, { headers });
      
      if (response.status === 304) {
        // Not modified, return empty
        return [];
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlContent = await response.text();
      const contentHash = await this.generateContentHash(xmlContent);

      // Update source metadata
      if (response.headers.get('etag')) {
        source.etag = response.headers.get('etag')!;
      }
      if (response.headers.get('last-modified')) {
        source.lastModified = response.headers.get('last-modified')!;
      }

      const rawData: RawEventData = {
        sourceId: source.id,
        rawContent: xmlContent,
        extractedAt: new Date(),
        contentHash,
        sourceUrl: source.url
      };

      // Record successful fetch
      source.fetchHistory.push({
        timestamp: new Date(),
        success: true,
        statusCode: response.status,
        itemsFound: 0, // Will be updated after parsing
        processingTime: Date.now() - startTime
      });

      return [rawData];

    } catch (error) {
      // Record failed fetch
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
        headers: { 'User-Agent': 'Iwate-Event-Navigator/1.0' }
      });

      const contentType = response.headers.get('content-type') || '';
      const isValidRSS = contentType.includes('xml') || contentType.includes('rss');

      return {
        isValid: response.ok && isValidRSS,
        errors: response.ok ? [] : [`HTTP ${response.status}: ${response.statusText}`],
        warnings: isValidRSS ? [] : [`Unexpected content-type: ${contentType}`],
        confidence: response.ok && isValidRSS ? 0.9 : 0.3
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
        // Use browser DOMParser instead of xml2js
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw.rawContent, 'text/xml');
        
        // Check for parsing errors
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
          throw new Error(`XML parsing error: ${parserError.textContent}`);
        }
        
        const items = this.extractRSSItemsFromDOM(doc);

        for (const item of items) {
          const normalized = await this.normalizeRSSItem(item, source, raw);
          if (normalized) {
            events.push(normalized);
          }
        }

        // Update items found in fetch history
        const lastFetch = source.fetchHistory[source.fetchHistory.length - 1];
        if (lastFetch) {
          lastFetch.itemsFound = items.length;
        }

      } catch (error) {
        console.error(`Failed to parse RSS from ${source.name}:`, error);
      }
    }

    return events;
  }

  private extractRSSItemsFromDOM(doc: Document): RSSItemData[] {
    const items: RSSItemData[] = [];
    const itemElements = doc.querySelectorAll('item, entry');
    
    itemElements.forEach((element) => {
      const item: RSSItemData = {
        title: this.getElementText(element, 'title'),
        description: this.getElementText(element, 'description') || this.getElementText(element, 'summary') || this.getElementText(element, 'content'),
        link: this.getElementText(element, 'link'),
        pubDate: this.getElementText(element, 'pubDate') || this.getElementText(element, 'published') || this.getElementText(element, 'updated'),
        categories: this.getElementsText(element, 'category'),
        guid: this.getElementText(element, 'guid') || this.getElementText(element, 'id')
      };
      
      items.push(item);
    });
    
    return items;
  }

  private getElementText(parent: Element, tagName: string): string {
    const element = parent.querySelector(tagName);
    return element?.textContent?.trim() || '';
  }

  private getElementsText(parent: Element, tagName: string): string[] {
    const elements = parent.querySelectorAll(tagName);
    return Array.from(elements).map(el => el.textContent?.trim() || '').filter(text => text);
  }

  private async normalizeRSSItem(item: RSSItemData, source: HybridSource, raw: RawEventData): Promise<NormalizedEvent | null> {
    try {
      if (!item.title) {
        return null;
      }

      // Check if this looks like an event (more lenient)
      if (!this.looksLikeEvent(item.title, item.description || '')) {
        return null;
      }

      // Extract date (use pubDate as default, look for event dates in content)
      const starts_at = this.parseEventDate(item.pubDate, item.title, item.description || '');
      if (!starts_at) {
        return null;
      }

      // Extract location info from title/description
      const locationInfo = this.extractLocationFromText((item.title + ' ' + item.description).replace(/\s+/g, ' '));
      
      // Generate deduplication key
      const dedupe_key = this.generateDedupeKey(item.title, starts_at, locationInfo.venue || source.region);

      const now = new Date();
      const eventId = `rss_${source.id}_${this.generateEventId(item.title, starts_at)}`;

      return {
        id: eventId,
        title: item.title.trim(),
        description: item.description?.trim(),
        starts_at,
        ends_at: undefined, // RSS usually doesn't have end dates
        venue: locationInfo.venue,
        city: locationInfo.city || this.getRegionCity(source.region),
        lat: locationInfo.lat,
        lon: locationInfo.lon,
        category: this.categorizeEvent(item.title, item.description || ''),
        price: this.extractPrice(item.description || ''),
        organizer: source.name,
        source_url: item.link || source.url,
        source_id: source.id,
        last_seen: now,
        created_at: now,
        updated_at: now,
        dedupe_key,
        confidence: 0.7,
        validation_status: 'pending' as const
      };

    } catch (error) {
      console.error(`Failed to normalize RSS item:`, error);
      return null;
    }
  }

  private looksLikeEvent(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    
    // Event keywords (more comprehensive and lenient)
    const eventKeywords = [
      // Japanese event terms
      'イベント', 'まつり', '祭り', 'フェスティバル', '開催', '開催中', '開催予定',
      'コンサート', '展示', '講演', 'セミナー', 'ワークショップ', '教室',
      '大会', '競技', 'スポーツ', 'マラソン', '体験', '見学', '募集',
      '公演', '上演', '発表', '披露', 'ライブ', 'ショー',
      // English terms
      'event', 'festival', 'concert', 'exhibition', 'seminar', 'workshop',
      'contest', 'competition', 'tour', 'experience', 'show', 'live'
    ];

    // Date-related indicators
    const dateKeywords = [
      '月', '日', '時', '分', '開始', '終了', '開場', '受付',
      '午前', '午後', 'am', 'pm', '時間', '期間', '予定', '実施'
    ];

    const hasEventKeyword = eventKeywords.some(keyword => text.includes(keyword));
    const hasDateInfo = dateKeywords.some(keyword => text.includes(keyword));
    
    // Also check for specific date patterns
    const hasDatePattern = /\d{1,2}[月/]\d{1,2}[日]?/.test(text) || 
                          /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text) ||
                          /\d{1,2}:\d{2}/.test(text) ||
                          /(令和|平成)\d+年/.test(text);

    return hasEventKeyword || (hasDateInfo && hasDatePattern);
  }

  private parseEventDate(pubDate: string, title: string, description: string): Date | null {
    // First try to extract specific event dates from content
    const text = title + ' ' + description;
    const eventDate = this.extractDateFromText(text);
    if (eventDate) {
      return eventDate;
    }

    // Fallback to publication date if it seems recent and reasonable
    if (pubDate) {
      try {
        const date = new Date(pubDate);
        const now = new Date();
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        
        // If pubDate is in reasonable range for events, use it
        if (date >= now && date <= oneYearFromNow) {
          return date;
        }
        
        // If pubDate is recent (within last month), assume event is upcoming
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (date >= oneMonthAgo) {
          // Use pubDate but adjust to near future for event scheduling
          const eventDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000); // Add a week
          return eventDate;
        }
      } catch {
        // Invalid date, continue to fallback
      }
    }

    return null;
  }

  private extractDateFromText(text: string): Date | null {
    const currentYear = new Date().getFullYear();
    
    // Try various date patterns
    const patterns = [
      // YYYY年MM月DD日 format
      {
        regex: /(\d{4})年(\d{1,2})月(\d{1,2})日/,
        parse: (match: RegExpMatchArray) => new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      },
      // MM月DD日 format
      {
        regex: /(\d{1,2})月(\d{1,2})日/,
        parse: (match: RegExpMatchArray) => {
          const date = new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));
          // If date is in the past, assume next year
          if (date < new Date()) {
            date.setFullYear(currentYear + 1);
          }
          return date;
        }
      },
      // YYYY/MM/DD or YYYY-MM-DD format
      {
        regex: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
        parse: (match: RegExpMatchArray) => new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      }
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        try {
          const date = pattern.parse(match);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch {
          continue;
        }
      }
    }

    return null;
  }


  private extractLocationFromText(text: string): { venue?: string; city?: string; lat?: number; lon?: number } {
    // Simple location extraction - can be enhanced with geocoding
    const iwateCities = ['盛岡', '一関', '奥州', '花巻', '北上', '久慈', '遠野', '釜石', '二戸', '八幡平', '大船渡', '陸前高田'];
    
    for (const city of iwateCities) {
      if (text.includes(city)) {
        return { city, venue: undefined };
      }
    }

    return {};
  }

  private categorizeEvent(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
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

interface RSSItemData {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  categories: string[];
  guid: string;
}