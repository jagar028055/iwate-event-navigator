export class HttpClient {
  private isProduction: boolean;
  private isDevelopment: boolean;
  private isNode: boolean;
  
  constructor() {
    // Safe access to Vite env (browser only)
    const env = (import.meta as any)?.env || {};
    this.isProduction = !!env.PROD;
    this.isDevelopment = !!env.DEV;
    // Detect Node.js runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any;
    this.isNode = !!(g?.process?.versions?.node);
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    // Force mock if env flag set
    const forceMock = this.getEnvFlag('FORCE_MOCK_FETCH') || this.getEnvFlag('VITE_FORCE_MOCK');
    if (forceMock) {
      return this.createMockResponse(url);
    }
    const timeoutMs = this.getTimeoutMs();
    const useMockOnError = this.isDevelopment || this.isNode;

    // In production builds, or when running under Node, fetch directly (with timeout)
    if (this.isProduction || this.isNode) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          ...options,
          // Node's fetch ignores mode; browser production uses CORS
          mode: 'cors' as RequestMode,
          signal: controller.signal
        });
        clearTimeout(id);
        if (!res.ok && useMockOnError) {
          console.warn(`Direct fetch failed (${res.status}) for ${url}. Returning mock.`);
          return this.createMockResponse(url);
        }
        return res;
      } catch (err) {
        clearTimeout(id);
        console.warn(`Direct fetch error for ${url}:`, err);
        if (useMockOnError) return this.createMockResponse(url);
        throw err;
      }
    }

    // Development mode - try proxy first, fallback to sample data
    try {
      const proxyUrl = this.getProxyUrl(url);
      const response = await fetch(proxyUrl, {
        ...options,
        mode: 'cors',
        headers: {
          ...options?.headers,
          'X-Original-URL': url
        }
      });
      
      if (response.ok) {
        return response;
      } else {
        console.warn(`Proxy failed for ${url}, status: ${response.status}`);
        return this.createMockResponse(url);
      }
    } catch (error) {
      console.warn(`Proxy error for ${url}:`, error);
      return this.createMockResponse(url);
    }
  }

  private getTimeoutMs(): number {
    try {
      // Prefer Vite env when available
      const env = (import.meta as any)?.env || {};
      const fromVite = parseInt(env.VITE_HTTP_TIMEOUT_MS, 10);
      if (!Number.isNaN(fromVite) && fromVite > 0) return fromVite;
    } catch {}
    // Fallback to Node env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any;
    const raw = g?.process?.env?.HTTP_TIMEOUT_MS || g?.process?.env?.VITE_HTTP_TIMEOUT_MS;
    const fromNode = parseInt(raw, 10);
    if (!Number.isNaN(fromNode) && fromNode > 0) return fromNode;
    return 8000;
  }

  private getEnvFlag(name: string): boolean {
    try {
      const env = (import.meta as any)?.env || {};
      if (env && typeof env[name] !== 'undefined') {
        const v = String(env[name]).toLowerCase();
        return v === '1' || v === 'true';
      }
    } catch {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any;
    const v = (g?.process?.env?.[name] || '').toLowerCase();
    return v === '1' || v === 'true';
  }

  private createMockResponse(url: string): Response {
    console.log(`🎭 Creating mock response for: ${url}`);
    const mockData = this.generateMockData(url);
    console.log(`📝 Mock data length: ${mockData.length} characters`);
    
    return new Response(mockData, {
      status: 200,
      statusText: 'OK (Mock)',
      headers: {
        'Content-Type': this.getContentType(url),
        'X-Mock-Data': 'true'
      }
    });
  }

  private generateMockData(url: string): string {
    if (url.includes('.rss') || url.includes('/rss') || url.includes('/feed')) {
      return this.generateMockRSS();
    } else {
      return this.generateMockHTML();
    }
  }

  private generateMockRSS(): string {
    const currentDate = new Date().toISOString();
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>岩手県イベント情報（開発用サンプル）</title>
    <description>岩手県のイベント情報</description>
    <link>https://example.com</link>
    <item>
      <title>盛岡さくらまつり2025</title>
      <description>盛岡城跡公園で開催される桜祭り。屋台や音楽演奏などのイベントもあります。</description>
      <link>https://example.com/sakura</link>
      <pubDate>${futureDate}</pubDate>
      <guid>sakura2025</guid>
      <category>まつり</category>
    </item>
    <item>
      <title>花巻温泉バラまつり</title>
      <description>花巻温泉のバラ園で開催される春のイベント。約450種6,000株のバラが楽しめます。</description>
      <link>https://example.com/rose</link>
      <pubDate>${futureDate}</pubDate>
      <guid>rose2025</guid>
      <category>イベント</category>
    </item>
    <item>
      <title>遠野ふるさと村春まつり</title>
      <description>遠野の伝統文化を体験できる春のお祭り。昔話の語り部やわらべ歌の披露があります。</description>
      <link>https://example.com/tono</link>
      <pubDate>${futureDate}</pubDate>
      <guid>tono2025</guid>
      <category>文化</category>
    </item>
  </channel>
</rss>`;
  }

  private generateMockHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>岩手県イベント情報（開発用サンプル）</title>
</head>
<body>
  <h1>岩手県イベント情報</h1>
  <div class="event">
    <h3>北上展勝地さくらまつり</h3>
    <p class="date">4月中旬〜5月上旬</p>
    <p class="location">北上市</p>
    <p class="description">東北有数の桜の名所で開催される春の大祭典</p>
  </div>
  <div class="event">
    <h3>平泉春の藤原まつり</h3>
    <p class="date">5月1日〜5日</p>
    <p class="location">平泉町</p>
    <p class="description">源義経公東下り行列など平安絵巻を再現</p>
  </div>
  <div class="event">
    <h3>釜石まるごと味わいまつり</h3>
    <p class="date">6月上旬</p>
    <p class="location">釜石市</p>
    <p class="description">三陸の海の幸を堪能できる食のイベント</p>
  </div>
</body>
</html>`;
  }

  private getContentType(url: string): string {
    if (url.includes('.rss') || url.includes('/rss') || url.includes('/feed')) {
      return 'application/rss+xml';
    } else {
      return 'text/html';
    }
  }

  private getProxyUrl(originalUrl: string): string {
    const url = new URL(originalUrl);
    
    const proxyMappings = {
      'www.pref.iwate.jp': '/api/proxy-iwate',
      'www.city.morioka.iwate.jp': '/api/proxy-morioka', 
      'iwatetabi.jp': '/api/proxy-iwatetabi',
      'www.kanko-hanamaki.ne.jp': '/api/proxy-hanamaki',
      'www.iwate-kenmin.jp': '/api/proxy-kenmin',
      'www.iwate-np.co.jp': '/api/proxy-np',
      'www.odette.or.jp': '/api/proxy-odette',
      'enjoyiwate.com': '/api/proxy-enjoy'
    };

    const proxyPath = proxyMappings[url.hostname as keyof typeof proxyMappings] || '/api/proxy-default';
    return `${proxyPath}${url.pathname}${url.search}`;
  }
}

export const httpClient = new HttpClient();
