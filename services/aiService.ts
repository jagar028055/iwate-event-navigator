// REST API直接呼び出しに変更（Google GenAIライブラリのブラウザ制限を回避）
import type {
  EventInfo,
  RecommendationRequest,
  AIRecommendationResponse,
  RecommendedEvent,
  SearchResults,
  EventFilters
} from '../types';

class AIService {
  private apiKey: string;
  private model: string = "gemini-1.5-pro";

  constructor() {
    // Viteビルド時に置換される特別な変数を使用
    declare const __GEMINI_API_KEY__: string | undefined;
    
    const apiKey = __GEMINI_API_KEY__ || 
                   import.meta.env.GEMINI_API_KEY || 
                   import.meta.env.VITE_GEMINI_API_KEY ||
                   process.env.GEMINI_API_KEY ||
                   process.env.VITE_GEMINI_API_KEY;
                   
    if (!apiKey) {
      console.error("AIService: API key not found in any source");
      throw new Error("Gemini API key is not configured");
    }
    
    console.log("AIService: API key configured successfully");
    this.apiKey = apiKey;
  }

  private cleanJsonString(str: string): string {
    let cleaned = str.replace(/```json/g, '').replace(/```/g, '');
    cleaned = cleaned.trim();
    return cleaned;
  }

  private async makeRequest(prompt: string, useSearch: boolean = false): Promise<string> {
    try {
      const config: any = {
        model: this.model,
        contents: prompt
      };

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await this.ai.models.generateContent(config);
      return response.text || '';
    } catch (error) {
      console.error('AI Service request failed:', error);
      throw new Error('AI service is temporarily unavailable');
    }
  }

  async generateRecommendations(request: RecommendationRequest, availableEvents: EventInfo[]): Promise<AIRecommendationResponse> {
    const prompt = `
岩手県のイベント推薦システムとして、以下の条件に基づいて最適なイベントを推薦してください。

利用可能なイベントデータ:
${JSON.stringify(availableEvents.slice(0, 20), null, 2)}

ユーザープロファイル:
${JSON.stringify(request.userProfile || {}, null, 2)}

コンテキスト情報:
${JSON.stringify(request.contextualInfo || {}, null, 2)}

以下の形式でJSON応答を返してください:
{
  "recommendations": [
    {
      "eventId": "イベントID",
      "recommendationReason": "推薦理由",
      "matchScore": 0.85
    }
  ],
  "explanation": "推薦の全体的な説明",
  "confidence": 0.8,
  "alternatives": ["代替イベントのID配列"]
}

推薦基準:
1. ユーザーの興味・過去の履歴との関連性
2. 現在の天候・季節との適合性
3. 同伴者タイプとの相性
4. 利用可能時間との適合性
5. アクセスの良さ

最大5件まで推薦してください。
`;

    try {
      const response = await this.makeRequest(prompt);
      const cleanedResponse = this.cleanJsonString(response);
      const result = JSON.parse(cleanedResponse);

      // Enrich recommendations with full event data
      const enrichedRecommendations: RecommendedEvent[] = result.recommendations.map((rec: any) => {
        const event = availableEvents.find(e => e.id === rec.eventId);
        if (!event) return null;
        
        return {
          ...event,
          recommendationReason: rec.recommendationReason,
          matchScore: rec.matchScore
        };
      }).filter(Boolean);

      const alternatives = result.alternatives
        ? availableEvents.filter(e => result.alternatives.includes(e.id))
        : [];

      return {
        recommendations: enrichedRecommendations,
        explanation: result.explanation,
        confidence: result.confidence,
        alternatives
      };
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      return {
        recommendations: [],
        explanation: "推薦システムが一時的に利用できません。",
        confidence: 0,
        alternatives: []
      };
    }
  }

  async enhanceSearchResults(query: string, results: EventInfo[], filters: EventFilters): Promise<SearchResults> {
    const prompt = `
検索クエリ「${query}」に対する岩手県イベント検索結果を改善してください。

現在の検索結果:
${JSON.stringify(results.slice(0, 10), null, 2)}

適用されたフィルター:
${JSON.stringify(filters, null, 2)}

以下の形式でJSON応答を返してください:
{
  "enhancedResults": ["関連度順に並び替えたイベントID配列"],
  "suggestions": ["検索候補キーワード配列"],
  "categoryInsights": "検索結果に関するカテゴリ分析",
  "locationClusters": ["地域別グルーピング情報"]
}

検索の改善ポイント:
1. クエリとの関連度による順位付け
2. 類似イベントのグルーピング
3. 検索候補の提案
4. 地域特性を考慮した分析
`;

    try {
      const response = await this.makeRequest(prompt);
      const cleanedResponse = this.cleanJsonString(response);
      const analysis = JSON.parse(cleanedResponse);

      // Reorder results based on AI analysis
      const enhancedResults = analysis.enhancedResults
        ? analysis.enhancedResults.map((id: string) => results.find(e => e.id === id)).filter(Boolean)
        : results;

      return {
        events: enhancedResults,
        total: enhancedResults.length,
        query,
        filters,
        suggestions: analysis.suggestions || []
      };
    } catch (error) {
      console.error('Search enhancement failed:', error);
      return {
        events: results,
        total: results.length,
        query,
        filters,
        suggestions: []
      };
    }
  }

  async generateEventDescription(event: Partial<EventInfo>): Promise<string> {
    const prompt = `
岩手県のイベント「${event.title}」について、魅力的で詳細な説明文を生成してください。

基本情報:
- イベント名: ${event.title}
- カテゴリ: ${event.category}
- 開催地: ${event.locationName}
- 日時: ${event.date}

以下の要素を含む説明文を作成してください:
1. イベントの魅力と特色
2. 参加者が体験できること
3. 岩手県の地域性・文化との関連
4. 参加を促す呼びかけ

200字程度で、親しみやすく魅力的な文章にしてください。
`;

    try {
      const response = await this.makeRequest(prompt);
      return response.trim();
    } catch (error) {
      console.error('Description generation failed:', error);
      return event.description || 'イベントの詳細情報を確認中です...';
    }
  }

  async analyzeUserBehavior(userId: string, interactions: any[]): Promise<any> {
    const prompt = `
ユーザーID「${userId}」の行動パターンを分析してください。

インタラクション履歴:
${JSON.stringify(interactions.slice(-50), null, 2)}

以下の形式でJSON応答を返してください:
{
  "preferredCategories": ["カテゴリ配列"],
  "preferredLocations": ["地域配列"],
  "preferredTimes": ["時間帯配列"],
  "engagementPatterns": "エンゲージメント分析",
  "recommendationProfile": "推薦用プロファイル"
}

分析項目:
1. よく閲覧するイベントカテゴリ
2. 好みの地域・エリア
3. 活動時間帯の傾向
4. イベント参加パターン
`;

    try {
      const response = await this.makeRequest(prompt);
      const cleanedResponse = this.cleanJsonString(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('User behavior analysis failed:', error);
      return {
        preferredCategories: [],
        preferredLocations: [],
        preferredTimes: [],
        engagementPatterns: "分析データ不足",
        recommendationProfile: "標準プロファイル"
      };
    }
  }
}

export const aiService = new AIService();