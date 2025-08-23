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

export async function callGeminiAPI(
  prompt: string, 
  options: GeminiApiOptions = {}
): Promise<string> {
  const apiKey = getApiKey();
  const {
    model = "gemini-1.5-pro",
    temperature = 0.7,
    topK = 40,
    topP = 0.95,
    maxOutputTokens = 8192,
    useSearch = false
  } = options;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const requestBody = {
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

  console.log(`🚀 Calling Gemini API (${model})...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API Error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Gemini API response received");
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("❌ Invalid API response structure:", data);
      throw new Error("Invalid response structure from Gemini API");
    }
  } catch (error) {
    console.error("❌ Gemini API call failed:", error);
    throw error;
  }
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