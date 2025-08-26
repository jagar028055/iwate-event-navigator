// 共通のGemini API呼び出し関数
// Google GenAI SDKのブラウザ制限を回避するためのREST API実装

// Viteビルド時に置換される特別な変数を使用
declare const __GEMINI_API_KEY__: string | undefined;

function getApiKey(): string {
  // ブラウザ環境で安全に環境変数を取得
  const sources = [
    // Viteビルド時に置換される値（最優先）
    typeof __GEMINI_API_KEY__ !== 'undefined' ? __GEMINI_API_KEY__ : undefined,
    
    // ブラウザ環境でのimport.meta.env（Vite経由）
    import.meta?.env?.GEMINI_API_KEY,
    import.meta?.env?.VITE_GEMINI_API_KEY,
    
    // ブラウザ環境でのprocessアクセスを安全に処理
    (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__) || undefined,
    
    // 開発時のフォールバック（window.env経由）
    typeof window !== 'undefined' && (window as any).env ? (window as any).env.GEMINI_API_KEY : undefined
  ];
  
  // 有効なキーを探す
  const apiKey = sources.find(key => 
    key && 
    typeof key === 'string' && 
    key.trim() !== '' && 
    key !== 'undefined' && 
    key !== 'null' &&
    key.length > 10 // 最小限の長さチェック
  );
  
  if (!apiKey) {
    console.error("❌ Gemini API Key not found in any source");
    console.error("Available sources check:", {
      '__GEMINI_API_KEY__': typeof __GEMINI_API_KEY__ !== 'undefined' ? 'SET' : 'NOT_SET',
      'import.meta.env': import.meta?.env ? 'AVAILABLE' : 'NOT_AVAILABLE',
      'window.__GEMINI_API_KEY__': typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__ ? 'SET' : 'NOT_SET',
      'window.env': typeof window !== 'undefined' && (window as any).env ? 'AVAILABLE' : 'NOT_AVAILABLE'
    });
    throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.");
  }
  
  console.log("✅ Gemini API Key found and configured");
  return apiKey;
}

export interface GeminiApiOptions {
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  useSearch?: boolean;
}

export interface GeminiResponse {
  text: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    searchEntryPoint?: {
      renderedContent: string;
    };
    groundingChunks?: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
    groundingSupports?: Array<{
      groundingChunkIndices: number[];
      confidenceScore: number;
    }>;
  };
}

export async function callGeminiAPI(
  prompt: string, 
  options: GeminiApiOptions = {}
): Promise<GeminiResponse> {
  const apiKey = getApiKey();
  const {
    model = "gemini-2.5-flash", // グラウンディング対応モデルに変更
    temperature = 0.7,
    topK = 40,
    topP = 0.95,
    maxOutputTokens = 8192,
    useSearch = false
  } = options;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const requestBody: any = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature,
      topK,
      topP,
      maxOutputTokens,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  // Google Search グラウンディングを有効にする
  if (useSearch) {
    requestBody.tools = [
      {
        google_search: {}
      }
    ];
    console.log("🔍 Google Search grounding enabled (google_search)");
  }

  console.log(`🚀 Calling Gemini API (${model})...`);
  console.log("📋 Request details:", {
    url: url.replace(apiKey, '[API_KEY_HIDDEN]'),
    method: 'POST',
    useSearch: useSearch,
    model: model,
    temperature: temperature,
    maxOutputTokens: maxOutputTokens,
    tools: requestBody.tools ? 'YES' : 'NO',
    toolsDetail: requestBody.tools,
    promptLength: prompt.length,
    environment: typeof window !== 'undefined' ? 'BROWSER' : 'NODE'
  });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log("🌐 Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API Error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Gemini API response received");
    console.log("🔍 Response structure:", JSON.stringify(data, null, 2).substring(0, 500));
    
    // より堅牢なレスポンス構造チェック
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error("❌ No candidates in response:", data);
      throw new Error("No candidates found in Gemini API response");
    }

    const candidate = data.candidates[0];
    if (!candidate) {
      console.error("❌ First candidate is null/undefined");
      throw new Error("First candidate is null in response");
    }

    // グラウンディング使用時は異なる構造になる場合がある
    let text = '';
    
    if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
      // 通常のレスポンス構造
      const textPart = candidate.content.parts[0];
      if (textPart && typeof textPart.text === 'string') {
        text = textPart.text;
      } else {
        console.error("❌ Invalid text part:", textPart);
        throw new Error("Invalid text part in content");
      }
    } else if (candidate.content && typeof candidate.content.text === 'string') {
      // 直接textフィールドがある場合
      text = candidate.content.text;
    } else {
      // グラウンディング使用時は別のフィールドを確認
      console.log("🔍 Checking alternative response structures...");
      
      // groundingMetadataにコンテンツがある場合を確認
      if (candidate.groundingMetadata && candidate.groundingMetadata.searchEntryPoint && 
          candidate.groundingMetadata.searchEntryPoint.renderedContent) {
        console.log("📝 Using grounding metadata content");
        text = "検索結果が取得されましたが、テキスト形式での抽出ができませんでした。グラウンディング機能は動作していますが、データ解析に改善が必要です。";
      } else {
        console.error("❌ No valid text content found:", candidate);
        throw new Error("No valid text content found in candidate");
      }
    }

    const result: GeminiResponse = {
      text: text
    };

    // グラウンディングメタデータが含まれている場合は処理
    if (candidate.groundingMetadata) {
      result.groundingMetadata = candidate.groundingMetadata;
      console.log("🔗 Grounding metadata found:", {
        webSearchQueries: result.groundingMetadata?.webSearchQueries?.length || 0,
        groundingChunks: result.groundingMetadata?.groundingChunks?.length || 0
      });
    }

    return result;
  } catch (error) {
    console.error("❌ Gemini API call failed:", error);
    throw error;
  }
}

// 下位互換性のための関数（既存のstring戻り値を期待するコードのため）
export async function callGeminiAPILegacy(
  prompt: string, 
  options: GeminiApiOptions = {}
): Promise<string> {
  const result = await callGeminiAPI(prompt, options);
  return result.text;
}

export function cleanJsonString(str: string): string {
  try {
    // Remove markdown backticks and "json" label
    let cleaned = str.replace(/```json/g, '').replace(/```/g, '');
    
    // Remove any leading/trailing whitespace and line breaks
    cleaned = cleaned.trim();
    
    // Fix common JSON formatting issues
    // 1. Remove any text before the first '{'
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
    }
    
    // 2. Remove any text after the last '}'
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace >= 0 && lastBrace < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    // 3. Fix unquoted property names (common AI response issue)
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
    
    // 4. Fix single quotes to double quotes
    cleaned = cleaned.replace(/'/g, '"');
    
    // 5. Remove trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // 6. Fix escaped quotes issues
    cleaned = cleaned.replace(/\\"/g, '\\"');
    
    // 7. Remove any control characters that might cause issues
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
    
    return cleaned;
  } catch (error) {
    console.warn('JSON cleaning failed, returning original string:', error);
    return str;
  }
}