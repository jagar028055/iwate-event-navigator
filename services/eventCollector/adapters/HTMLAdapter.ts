import { ISourceAdapter, SourceType, HybridSource, RawEventData, NormalizedEvent, ValidationResult } from '../types';
import { httpClient } from '../../httpClient';

export class HTMLAdapter implements ISourceAdapter {
  readonly sourceType = SourceType.HTML_SCRAPING;
  readonly name = 'HTML Scraping Adapter';

  canHandle(source: HybridSource): boolean {
    return source.type === SourceType.HTML_SCRAPING || 
           source.searchStrategy.method === 'html_scraping' ||
           (!source.url.includes('.rss') && !source.url.includes('.ics') && !source.url.includes('.xml'));
  }

  async fetch(source: HybridSource): Promise<RawEventData[]> {
    const startTime = Date.now();
    console.log(`🌐 HTMLAdapter fetching: ${source.url}`);
    
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (compatible; Iwate-Event-Navigator/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.5',
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
      console.log(`📡 Response status: ${response.status}, Mock: ${response.headers.get('X-Mock-Data')}`);
      
      if (response.status === 304) {
        console.log(`✅ 304 Not Modified for ${source.url}`);
        return [];
      }

      if (!response.ok) {
        console.error(`❌ HTTP Error ${response.status}: ${response.statusText} for ${source.url}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const htmlContent = await response.text();
      console.log(`📄 HTML content length: ${htmlContent.length} chars for ${source.url}`);
      
      if (htmlContent.length === 0) {
        console.warn(`⚠️ Empty HTML content from ${source.url}`);
        return [];
      }
      
      const contentHash = await this.generateContentHash(htmlContent);

      // Update source metadata
      if (response.headers.get('etag')) {
        source.etag = response.headers.get('etag')!;
      }
      if (response.headers.get('last-modified')) {
        source.lastModified = response.headers.get('last-modified')!;
      }

      const rawData: RawEventData = {
        sourceId: source.id,
        rawContent: htmlContent,
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
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Iwate-Event-Navigator/1.0)' }
      });

      const contentType = response.headers.get('content-type') || '';
      const isValidHTML = contentType.includes('html') || contentType.includes('text');

      return {
        isValid: response.ok,
        errors: response.ok ? [] : [`HTTP ${response.status}: ${response.statusText}`],
        warnings: isValidHTML ? [] : [`Unexpected content-type: ${contentType}`],
        confidence: response.ok ? 0.7 : 0.2 // HTML scraping has lower inherent confidence
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
        const extractedEvents = await this.extractEventsFromHTML(raw.rawContent, source);
        
        for (const eventData of extractedEvents) {
          const normalized = await this.normalizeExtractedEvent(eventData, source, raw);
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
        console.error(`Failed to parse HTML from ${source.name}:`, error);
      }
    }

    return events;
  }

  private async extractEventsFromHTML(html: string, source: HybridSource): Promise<ExtractedEventData[]> {
    // Parse HTML in both browser and Node runtimes
    const isBrowser = typeof window !== 'undefined' && typeof (window as any).DOMParser !== 'undefined';
    let doc: any;
    if (isBrowser) {
      const parser = new DOMParser();
      doc = parser.parseFromString(html, 'text/html');
    } else {
      // Node: use linkedom to create a Document compatible enough for querySelector
      try {
        const { parseHTML } = await import('linkedom');
        const { document } = parseHTML(html);
        doc = document;
      } catch (error) {
        console.error('HTML parsing not available in Node environment:', error);
        return [];
      }
    }
    
    const events: ExtractedEventData[] = [];

    try {
      // Use configured selectors if available
      const parseRules = source.searchStrategy.fetchConfig?.parseRules;
      
      if (parseRules) {
        events.push(...this.extractWithSelectors(doc, parseRules));
      } else {
        // Fallback to heuristic extraction
        events.push(...this.extractWithHeuristics(doc, source));
      }

    } catch (error) {
      console.error('HTML extraction failed:', error);
    }

    return events.filter(event => this.isValidExtractedEvent(event));
  }

  private extractWithSelectors(doc: any, parseRules: any): ExtractedEventData[] {
    const events: ExtractedEventData[] = [];
    
    try {
      // Look for event containers
      const eventElements = doc.querySelectorAll(parseRules.containerSelector || '.event, .item, article');
      
      eventElements.forEach((element) => {
        const event: ExtractedEventData = {
          title: this.extractText(element, parseRules.titleSelector || 'h1, h2, h3, .title'),
          description: this.extractText(element, parseRules.descriptionSelector || '.description, .content, p'),
          dateText: this.extractText(element, parseRules.dateSelector || '.date, .time, time'),
          location: this.extractText(element, parseRules.locationSelector || '.location, .place, .venue'),
          url: this.extractURL(element, 'a')
        };
        
        if (event.title) {
          events.push(event);
        }
      });
      
    } catch (error) {
      console.error('Selector-based extraction failed:', error);
    }

    return events;
  }

  private extractWithHeuristics(doc: any, source: HybridSource): ExtractedEventData[] {
    const events: ExtractedEventData[] = [];
    
    try {
      // Heuristic patterns for different types of pages
      const eventKeywords = source.searchStrategy.keywords || ['イベント', 'まつり', '祭り', 'フェス', 'コンサート', '開催', '実施'];
      
      // Look for structured data first
      events.push(...this.extractStructuredData(doc));
      
      // Look for common HTML patterns
      events.push(...this.extractFromCommonPatterns(doc, eventKeywords));
      
      // Look for calendar-like structures
      events.push(...this.extractFromCalendarStructures(doc));
      
      // Look for news/announcement patterns (common in government sites)
      events.push(...this.extractFromNewsPatterns(doc, eventKeywords));
      
    } catch (error) {
      console.error('Heuristic extraction failed:', error);
    }

    return events;
  }

  private extractStructuredData(doc: any): ExtractedEventData[] {
    const events: ExtractedEventData[] = [];
    
    // Look for JSON-LD structured data
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        const structuredEvents = this.parseStructuredData(data);
        events.push(...structuredEvents);
      } catch (error) {
        // Ignore invalid JSON
      }
    });
    
    // Look for microdata
    const microdataEvents = doc.querySelectorAll('[itemtype*="Event"]');
    microdataEvents.forEach(element => {
      const event = this.extractFromMicrodata(element);
      if (event) {
        events.push(event);
      }
    });

    return events;
  }

  private extractFromCommonPatterns(doc: Document, keywords: string[]): ExtractedEventData[] {
    const events: ExtractedEventData[] = [];
    
    // Pattern 1: Event lists with date and title
    const listItems = doc.querySelectorAll('li, .event-item, .news-item, article');
    
    listItems.forEach(item => {
      const text = item.textContent || '';
      const hasEventKeyword = keywords.some(keyword => text.includes(keyword));
      
      if (hasEventKeyword) {
        const event: ExtractedEventData = {
          title: this.extractTitleFromElement(item),
          description: this.extractDescriptionFromElement(item),
          dateText: this.extractDateFromText(text),
          location: this.extractLocationFromText(text),
          url: this.extractURL(item, 'a')
        };
        
        if (event.title) {
          events.push(event);
        }
      }
    });

    return events;
  }

  private extractFromCalendarStructures(doc: Document): ExtractedEventData[] {
    const events: ExtractedEventData[] = [];
    
    // Look for calendar cells or date structures
    const dateElements = doc.querySelectorAll('.calendar-day, .date, [class*="day"]');
    
    dateElements.forEach(dateEl => {
      const dateText = dateEl.textContent?.trim() || '';
      const parent = dateEl.closest('.calendar-item, .day-events, li, article');
      
      if (parent) {
        const links = parent.querySelectorAll('a');
        links.forEach(link => {
          const title = link.textContent?.trim();
          if (title && title.length > 3) {
            events.push({
              title,
              description: '',
              dateText,
              location: '',
              url: link.href
            });
          }
        });
      }
    });

    return events;
  }

  private extractFromNewsPatterns(doc: Document, keywords: string[]): ExtractedEventData[] {
    const events: ExtractedEventData[] = [];
    
    // Look for news/announcement items that mention events
    const newsSelectors = [
      '.news-item', '.announcement', '.info-item', '.content-item',
      '.post', '.entry', '.article-item', '.list-item', 
      'main .content li', 'main .section li', '.main-content li'
    ];
    
    for (const selector of newsSelectors) {
      const items = doc.querySelectorAll(selector);
      
      items.forEach(item => {
        const text = item.textContent || '';
        const hasEventKeyword = keywords.some(keyword => text.includes(keyword));
        
        if (hasEventKeyword) {
          // Extract date from various patterns in the text
          const dateText = this.extractDateFromNewsItem(item, text);
          
          const event: ExtractedEventData = {
            title: this.extractTitleFromNewsItem(item),
            description: this.extractDescriptionFromNewsItem(item),
            dateText: dateText,
            location: this.extractLocationFromText(text),
            url: this.extractURL(item, 'a')
          };
          
          if (event.title && event.title.length > 5) {
            events.push(event);
          }
        }
      });
    }

    return events;
  }

  private extractTitleFromNewsItem(element: Element): string {
    // Look for title in multiple patterns
    const titleSelectors = [
      'h1', 'h2', 'h3', 'h4', '.title', '.heading', 
      '.subject', '.name', 'a', 'strong', '.item-title'
    ];
    
    for (const selector of titleSelectors) {
      const titleEl = element.querySelector(selector);
      if (titleEl?.textContent?.trim()) {
        const title = titleEl.textContent.trim();
        // Filter out very short or generic titles
        if (title.length > 5 && !this.isGenericTitle(title)) {
          return title;
        }
      }
    }
    
    // Fallback: use first line of text content
    const textContent = element.textContent?.trim() || '';
    const firstLine = textContent.split('\n')[0].trim();
    return firstLine.length > 5 ? firstLine : '';
  }

  private extractDescriptionFromNewsItem(element: Element): string {
    const descSelectors = ['.description', '.summary', '.content', '.body', 'p'];
    
    for (const selector of descSelectors) {
      const descEl = element.querySelector(selector);
      if (descEl?.textContent?.trim()) {
        return descEl.textContent.trim();
      }
    }
    
    // Fallback: use text content but skip the title part
    const fullText = element.textContent?.trim() || '';
    const lines = fullText.split('\n').filter(line => line.trim().length > 0);
    return lines.length > 1 ? lines.slice(1).join(' ').trim() : '';
  }

  private extractDateFromNewsItem(element: Element, text: string): string {
    // First try to find date in specific elements
    const dateSelectors = ['.date', '.time', 'time', '.published', '.event-date'];
    
    for (const selector of dateSelectors) {
      const dateEl = element.querySelector(selector);
      if (dateEl?.textContent?.trim()) {
        return dateEl.textContent.trim();
      }
      if (dateEl?.getAttribute('datetime')) {
        return dateEl.getAttribute('datetime') || '';
      }
    }
    
    // Fallback to text pattern matching
    return this.extractDateFromText(text);
  }

  private isGenericTitle(title: string): boolean {
    const genericWords = ['詳細', '情報', 'お知らせ', '案内', 'more', 'read more', '続きを読む'];
    return genericWords.some(word => title.includes(word)) || title.length < 6;
  }

  private extractText(element: Element, selector: string): string {
    const target = element.querySelector(selector);
    return target?.textContent?.trim() || '';
  }

  private extractURL(element: Element, selector: string): string {
    const target = element.querySelector(selector) as HTMLAnchorElement;
    return target?.href || '';
  }

  private extractTitleFromElement(element: Element): string {
    // Try different title patterns
    const selectors = ['h1', 'h2', 'h3', '.title', '.event-title', 'a', 'strong'];
    
    for (const selector of selectors) {
      const titleEl = element.querySelector(selector);
      if (titleEl?.textContent?.trim()) {
        return titleEl.textContent.trim();
      }
    }
    
    return '';
  }

  private extractDescriptionFromElement(element: Element): string {
    const descEl = element.querySelector('.description, .content, p');
    return descEl?.textContent?.trim() || '';
  }

  private extractDateFromText(text: string): string {
    // Look for date patterns in Japanese
    const datePatterns = [
      /(\d{1,2})月(\d{1,2})日/,
      /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,
      /(令和|平成)\d+年\d+月\d+日/,
      /\d{1,2}\/\d{1,2}/
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return '';
  }

  private extractLocationFromText(text: string): string {
    // Look for location indicators
    const iwatePlaces = ['盛岡', '花巻', '北上', '一関', '奥州', '久慈', '遠野', '釜石', '二戸', '八幡平', '大船渡', '陸前高田'];
    
    for (const place of iwatePlaces) {
      if (text.includes(place)) {
        // Extract surrounding context
        const index = text.indexOf(place);
        const context = text.substring(Math.max(0, index - 20), index + place.length + 20);
        return context.trim();
      }
    }
    
    return '';
  }

  private parseStructuredData(data: any): ExtractedEventData[] {
    const events: ExtractedEventData[] = [];
    
    try {
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item['@type'] === 'Event' || item.type === 'Event') {
          events.push({
            title: item.name || '',
            description: item.description || '',
            dateText: item.startDate || '',
            location: item.location?.name || item.location || '',
            url: item.url || ''
          });
        }
      }
    } catch (error) {
      console.error('Structured data parsing failed:', error);
    }
    
    return events;
  }

  private extractFromMicrodata(element: Element): ExtractedEventData | null {
    try {
      return {
        title: element.querySelector('[itemprop="name"]')?.textContent?.trim() || '',
        description: element.querySelector('[itemprop="description"]')?.textContent?.trim() || '',
        dateText: element.querySelector('[itemprop="startDate"]')?.getAttribute('datetime') || '',
        location: element.querySelector('[itemprop="location"]')?.textContent?.trim() || '',
        url: (element.querySelector('[itemprop="url"]') as HTMLAnchorElement)?.href || ''
      };
    } catch (error) {
      return null;
    }
  }

  private isValidExtractedEvent(event: ExtractedEventData): boolean {
    return !!(event.title && event.title.length > 3);
  }

  private async normalizeExtractedEvent(eventData: ExtractedEventData, source: HybridSource, raw: RawEventData): Promise<NormalizedEvent | null> {
    try {
      if (!eventData.title) return null;

      // Parse date
      const starts_at = this.parseDate(eventData.dateText);
      if (!starts_at) return null;

      // Extract location info
      const locationInfo = this.extractLocationInfo(eventData.location);
      
      // Generate deduplication key
      const dedupe_key = this.generateDedupeKey(
        eventData.title, 
        starts_at, 
        locationInfo.venue || source.region
      );

      const now = new Date();
      const eventId = `html_${source.id}_${this.generateEventId(eventData.title, starts_at)}`;

      return {
        id: eventId,
        title: eventData.title.trim(),
        description: eventData.description?.trim(),
        starts_at,
        ends_at: undefined,
        venue: locationInfo.venue,
        city: locationInfo.city || this.getRegionCity(source.region),
        lat: locationInfo.lat,
        lon: locationInfo.lon,
        category: this.categorizeEvent(eventData.title, eventData.description || ''),
        price: this.extractPrice(eventData.description || ''),
        organizer: source.name,
        source_url: eventData.url || source.url,
        source_id: source.id,
        last_seen: now,
        created_at: now,
        updated_at: now,
        dedupe_key,
        confidence: 0.6, // HTML scraping has moderate confidence
        validation_status: 'pending' as const
      };

    } catch (error) {
      console.error(`Failed to normalize HTML event:`, error);
      return null;
    }
  }

  private parseDate(dateText: string): Date | null {
    if (!dateText) return null;

    try {
      // Try ISO date first
      if (dateText.includes('T') || dateText.includes('-')) {
        const date = new Date(dateText);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Parse Japanese date formats
      const currentYear = new Date().getFullYear();
      
      // X月Y日 format
      const monthDayMatch = dateText.match(/(\d{1,2})月(\d{1,2})日/);
      if (monthDayMatch) {
        const month = parseInt(monthDayMatch[1]) - 1;
        const day = parseInt(monthDayMatch[2]);
        const date = new Date(currentYear, month, day);
        
        // If the date is in the past, assume next year
        if (date < new Date()) {
          date.setFullYear(currentYear + 1);
        }
        
        return date;
      }

      // YYYY/MM/DD format
      const ymdMatch = dateText.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
      if (ymdMatch) {
        return new Date(parseInt(ymdMatch[1]), parseInt(ymdMatch[2]) - 1, parseInt(ymdMatch[3]));
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

interface ExtractedEventData {
  title: string;
  description?: string;
  dateText: string;
  location: string;
  url?: string;
}
