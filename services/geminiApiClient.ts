// 共通のGemini API呼び出し関数
// Google GenAI SDKのブラウザ制限を回避するためのREST API実装

// Viteビルド時に置換される特別な変数を使用
declare const __GEMINI_API_KEY__: string | undefined;

function getApiKey(): string {
  // 複数のソースから環境変数を取得
  const sources = [
    __GEMINI_API_KEY__,
    import.meta.env.GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY
  ];
  
  const apiKey = sources.find(key => key && key.trim() !== '' && key !== 'undefined');
  
  if (!apiKey) {
    console.error("❌ Gemini API Key not found in any source");
    throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.");
  }
  
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
  // Remove markdown backticks and "json" label
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '');
  // Trim whitespace
  cleaned = cleaned.trim();
  return cleaned;
}