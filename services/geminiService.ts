
import { EventInfo, Source } from '../types';
import { callGeminiAPI, cleanJsonString } from './geminiApiClient';

// デバッグ用: 環境変数の状況を確認
console.log('Environment variables debug:', {
  GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
  VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET',
  __GEMINI_API_KEY__: typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__ ? 'SET' : 'NOT SET',
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD
});

export const fetchIwateEvents = async (): Promise<{ events: EventInfo[], sources: Source[] }> => {
  try {
    const prompt = `日本の岩手県で開催されるイベント情報を、文字通り「根こそぎ」検索・抽出してください。とにかく量を最優先し、最大50件まで、見つけられる限りの情報を集めてください。

検索対象は、大手観光サイトに限りません。以下の情報源を徹底的に探してください：
- 岩手県内の全市区町村の公式サイト（例：盛岡市、花巻市、一関市など）
- 地域の観光協会サイト
- ローカルニュースサイト（岩手日報、東海新報など）
- 地域のフリーペーパーや情報誌のWeb版
- イベント告知を掲載している個人のブログやSNS投稿
- 施設（道の駅、公民館、文化センター、商店街、農産物直売所など）の公式サイト

特に、以下のような小規模で地域密着型のイベント情報を積極的に含めてください：
- 神社の例大祭
- 商店街の福引、セール
- 公民館での手芸教室や作品展
- 道の駅の週末限定フェア
- 子供向けの体験教室
- 農家レストランの特別メニュー期間

今後数ヶ月以内に開催されるイベントも対象に含めてください。

各イベントについて、以下の情報を必ず含めてください。
- title: イベント名
- description: イベントの概要（3〜4文程度で具体的に）
- date: 開催日（YYYY-MM-DD形式、または開催期間）
- locationName: 開催場所の名称
- latitude: 開催場所の緯度
- longitude: 開催場所の経度
- category: イベントのカテゴリ（例：「祭り」「グルメ」「アート」「音楽」「スポーツ」「自然」「地域」などから選択）
- officialUrl: イベントの公式サイトURL（もしあれば）

緯度・経度が特定できないイベントは、検索結果から除外してください。
結果は、{ "events": [...] } という形式のJSON文字列のみで返してください。他のテキストは一切含めないでください。`;

    const responseText = await callGeminiAPI(prompt, { useSearch: true });
    const jsonText = cleanJsonString(responseText);
    
    if (!jsonText) {
      throw new Error("API returned an empty response.");
    }

    const parsedData = JSON.parse(jsonText);
    
    if (!parsedData.events || !Array.isArray(parsedData.events)) {
        console.error("Unexpected JSON structure:", parsedData);
        throw new Error("The received data does not contain an 'events' array.");
    }
    
    // Add a unique ID to each event as the scraped data might not have one
    const eventsWithIds: EventInfo[] = parsedData.events.map((event: Omit<EventInfo, 'id'>) => ({
      ...event,
      id: crypto.randomUUID(),
    }));

    // REST APIでは検索ソースが直接取得できないため、ダミーソースを作成
    const sources: Source[] = [{
      uri: 'https://gemini.google.com/',
      title: 'Google Gemini API'
    }];

    return { events: eventsWithIds, sources };

  } catch (error) {
    console.error("Error fetching or parsing events from Gemini API:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse JSON data from the API. The format may be invalid.");
    }
    throw new Error("Failed to retrieve event data.");
  }
};
