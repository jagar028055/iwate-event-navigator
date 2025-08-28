export class HttpClient {
  private isProduction: boolean;
  private isDevelopment: boolean;
  
  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.isDevelopment = import.meta.env.DEV;
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    if (this.isProduction) {
      return fetch(url, {
        ...options,
        mode: 'cors'
      });
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

  private createMockResponse(url: string): Response {
    const mockData = this.generateMockData(url);
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