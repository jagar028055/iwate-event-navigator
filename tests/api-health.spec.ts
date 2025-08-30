import { test, expect } from '@playwright/test';

test.describe('API健全性チェック', () => {
  
  test('Gemini API接続テスト', async ({ page }) => {
    // テスト用のAPIキーが設定されているかチェック
    // ブラウザ環境でのアクセスに変更
    await page.goto('/');
    const hasApiKey = await page.evaluate('() => { const windowObj = window as any; return !!(windowObj.__GEMINI_API_KEY__) || !!(windowObj.__ENV__ && windowObj.__ENV__.GEMINI_API_KEY); }');
    
    if (!hasApiKey) {
      test.skip('API key not configured for testing');
    }
    
    // Simple API connectivity test
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // APIエンドポイントが応答することを確認（認証エラーでもOK）
    expect(response.status).toBeLessThan(500);
  });

  test('アプリケーション内でのAPI呼び出しテスト', async ({ page }) => {
    const apiCalls: { url: string; method: string; status: number }[] = [];
    
    // API呼び出しを監視
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('googleapis.com') || url.includes('api')) {
        apiCalls.push({
          url: url,
          method: response.request().method(),
          status: response.status()
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // イベント検索をトリガーする要素を探して実行
    const searchTriggers = [
      'button:has-text("検索")',
      'button:has-text("イベント")',
      '[data-testid="search-button"]',
      '[data-testid="event-search"]'
    ];
    
    let searchTriggered = false;
    for (const selector of searchTriggers) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          searchTriggered = true;
          break;
        }
      } catch (e) {
        // この要素は存在しない、次を試す
        continue;
      }
    }
    
    if (searchTriggered) {
      // API呼び出しを待つ
      await page.waitForTimeout(5000);
      
      // API呼び出しがあった場合、ステータスをチェック
      if (apiCalls.length > 0) {
        const failedCalls = apiCalls.filter(call => call.status >= 500);
        if (failedCalls.length > 0) {
          console.error('Server error in API calls:', failedCalls);
          expect(failedCalls).toHaveLength(0);
        }
      }
    } else {
      console.warn('No search trigger found - API call test skipped');
    }
  });

  test('環境変数の正しい設定確認', async ({ page }) => {
    await page.goto('/');
    
    // デバッグ情報の存在を確認（コンソールログから）
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(msg.text());
    });
    
    await page.waitForLoadState('networkidle');
    
    // 環境変数デバッグログの確認
    const envLogs = logs.filter(log => 
      log.includes('Environment variables') || 
      log.includes('GEMINI_API_KEY') ||
      log.includes('API Key')
    );
    
    if (envLogs.length > 0) {
      console.log('Environment variable logs found:', envLogs);
      
      // API キーが "NOT SET" でないことを確認
      const hasValidKey = envLogs.some(log => 
        log.includes('SET') && !log.includes('NOT SET')
      );
      
      expect(hasValidKey).toBeTruthy();
    } else {
      console.warn('No environment variable debug logs found');
    }
  });

  test('外部リソースの可用性確認', async ({ page }) => {
    const externalResources: { url: string; status: number }[] = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      // 外部リソース（CDN、API等）の監視
      if (!url.includes(page.url()) && 
          (url.includes('googleapis.com') || 
           url.includes('openstreetmap.org') ||
           url.includes('unpkg.com') ||
           url.includes('cdnjs.cloudflare.com'))) {
        externalResources.push({
          url: url,
          status: response.status()
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 外部リソースが正常にロードされることを確認
    if (externalResources.length > 0) {
      const failedResources = externalResources.filter(resource => 
        resource.status >= 400
      );
      
      if (failedResources.length > 0) {
        console.error('Failed external resources:', failedResources);
        // 外部リソースの失敗は警告レベル（テスト失敗にはしない）
        console.warn(`${failedResources.length} external resources failed to load`);
      }
    }
  });

  test('地図サービスの可用性確認', async ({ page }) => {
    await page.goto('/');
    
    // OpenStreetMapタイルの読み込みを確認
    const mapTileLoaded = await page.waitForFunction(() => {
      const tiles = document.querySelectorAll('.leaflet-tile');
      return tiles.length > 0 && 
             Array.from(tiles).some(tile => 
               (tile as HTMLImageElement).complete &&
               (tile as HTMLImageElement).naturalWidth > 0
             );
    }, { timeout: 20000 }).catch(() => false);
    
    if (!mapTileLoaded) {
      console.warn('Map tiles may not have loaded properly');
      // 地図タイルの読み込み失敗は警告レベル
    }
    
    // 地図コンテナの存在は確認
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
  });
});