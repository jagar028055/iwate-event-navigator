# 岩手イベントナビゲーター 技術仕様書

## 1. システム技術概要

### 1.1 アーキテクチャ概要
- **アーキテクチャパターン**: Single Page Application (SPA)
- **レンダリング方式**: Client Side Rendering (CSR)
- **デプロイメント**: Static Site Hosting (GitHub Pages)
- **状態管理**: Flux アーキテクチャ (Zustand)

### 1.2 技術スタック

#### 1.2.1 フロントエンド
| 技術 | バージョン | 用途 |
|------|------------|------|
| React | 19.1.1 | UIフレームワーク |
| TypeScript | 5.8.2 | 型安全性確保 |
| Vite | 6.2.0 | ビルドツール |
| Tailwind CSS | 4.1.11 | スタイリング |
| Zustand | 5.0.7 | 状態管理 |

#### 1.2.2 地図・位置情報
| 技術 | バージョン | 用途 |
|------|------------|------|
| Leaflet | 1.9.4 | 地図ライブラリ |
| React-Leaflet | 5.0.0 | React地図コンポーネント |

#### 1.2.3 AI・検索
| 技術 | バージョン | 用途 |
|------|------------|------|
| Google Gemini AI | 1.12.0 | 自然言語検索 |

#### 1.2.4 開発・ビルド
| 技術 | バージョン | 用途 |
|------|------------|------|
| PostCSS | 8.5.6 | CSS処理 |
| Autoprefixer | 10.4.21 | CSS vendor prefix |
| ESBuild | - | 高速ビルド |

## 2. システム構成

### 2.1 ディレクトリ構造
```
iwate-event-navigator/
├── public/                    # 静的ファイル
├── src/                      # ソースコード
│   ├── components/           # Reactコンポーネント
│   │   ├── ui/              # 再利用可能なUIコンポーネント
│   │   └── icons/           # アイコンコンポーネント
│   ├── hooks/               # カスタムフック
│   ├── store/               # 状態管理
│   ├── services/            # 外部API連携
│   ├── utils/               # ユーティリティ関数
│   └── types/               # TypeScript型定義
├── .github/                 # GitHub Actions
│   └── workflows/
├── dist/                    # ビルド出力
└── docs/                    # ドキュメント
```

### 2.2 コンポーネント階層
```
App
├── Sidebar
│   ├── FilterPanel
│   └── EventList
│       └── EventCard[]
├── MapPanel
│   ├── Map (Leaflet)
│   └── EventMarker[]
└── EventDetailModal
```

## 3. 詳細技術仕様

### 3.1 状態管理 (Zustand)

#### 3.1.1 Store構造
```typescript
interface AppState {
  // イベントデータ
  events: EventInfo[];
  sources: DataSource[];
  
  // UI状態
  selectedEvent: EventInfo | null;
  isLoading: boolean;
  error: string | null;
  
  // フィルタ状態
  filters: {
    categories: string[];
    areas: string[];
    dateRange: DateRange;
    searchQuery: string;
  };
  
  // アクション
  setEvents: (events: EventInfo[]) => void;
  selectEvent: (event: EventInfo | null) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

### 3.2 データ取得・処理

#### 3.2.1 イベントデータ取得フロー
```typescript
// useEventLoader Hook
const useEventLoader = () => {
  const loadEvents = async () => {
    setLoading(true);
    try {
      const sources = await fetchEventSources();
      const events = await Promise.all(
        sources.map(source => fetchEventsFromSource(source))
      );
      const normalizedEvents = normalizeEventData(events.flat());
      setEvents(normalizedEvents);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return { loadEvents, isLoading, error };
};
```

#### 3.2.2 データ正規化処理
```typescript
interface EventInfo {
  id: string;                    // 一意識別子
  title: string;                 // イベント名
  description: string;           // 詳細説明
  date: string;                  // ISO 8601形式の日時
  location: {
    name: string;                // 会場名
    address: string;             // 住所
    coordinates: [number, number]; // [緯度, 経度]
  };
  category: string;              // カテゴリ
  organizer: string;             // 主催者
  url?: string;                  // 詳細URL
  price?: string;                // 参加費
  capacity?: number;             // 定員
  source: string;                // データソース
  updatedAt: string;             // 更新日時
}
```

### 3.3 地図機能実装

#### 3.3.1 地図初期設定
```typescript
const MAP_CONFIG = {
  center: [39.7036, 141.1527],  // 岩手県中心座標
  zoom: 8,                       // 初期ズームレベル
  minZoom: 6,                    // 最小ズーム
  maxZoom: 18,                   // 最大ズーム
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors'
};
```

#### 3.3.2 マーカー表示ロジック
```typescript
const EventMarker: React.FC<{ event: EventInfo }> = ({ event }) => {
  const [lat, lng] = event.location.coordinates;
  
  return (
    <Marker 
      position={[lat, lng]}
      icon={createCustomIcon(event.category)}
      eventHandlers={{
        click: () => onSelectEvent(event)
      }}
    >
      <Popup>
        <div className="event-popup">
          <h3>{event.title}</h3>
          <p>{event.date}</p>
          <p>{event.location.name}</p>
        </div>
      </Popup>
    </Marker>
  );
};
```

### 3.4 検索・フィルタ機能

#### 3.4.1 フィルタリングロジック
```typescript
const useEventFilters = (events: EventInfo[]) => {
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // カテゴリフィルタ
      if (activeCategories.length > 0 && 
          !activeCategories.includes(event.category)) {
        return false;
      }
      
      // 地域フィルタ
      if (activeAreas.length > 0 && 
          !activeAreas.some(area => event.location.address.includes(area))) {
        return false;
      }
      
      // 日付フィルタ
      const eventDate = new Date(event.date);
      if (eventDate < dateRange.start || eventDate > dateRange.end) {
        return false;
      }
      
      return true;
    });
  }, [events, activeCategories, activeAreas, dateRange]);
  
  return { filteredEvents };
};
```

#### 3.4.2 AI検索実装
```typescript
const useAISearch = () => {
  const searchEvents = async (query: string): Promise<EventInfo[]> => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        以下のイベントリストから、「${query}」に関連するイベントを抽出してください。
        イベントデータ: ${JSON.stringify(events)}
        回答形式: イベントIDの配列のみ
      `;
      
      const result = await model.generateContent(prompt);
      const eventIds = JSON.parse(result.response.text());
      
      return events.filter(event => eventIds.includes(event.id));
    } catch (error) {
      console.error('AI検索エラー:', error);
      return [];
    }
  };
  
  return { searchEvents };
};
```

### 3.5 パフォーマンス最適化

#### 3.5.1 Viteビルド設定
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          maps: ['leaflet', 'react-leaflet'],
          ai: ['@google/genai'],
          utils: ['zustand', 'clsx']
        }
      }
    },
    sourcemap: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'leaflet', 
      'react-leaflet', '@google/genai'
    ]
  }
});
```

#### 3.5.2 レンダリング最適化
```typescript
// React.memo による再レンダリング抑制
const EventCard = React.memo<EventCardProps>(({ event, onSelect }) => {
  return (
    <div 
      className="event-card"
      onClick={() => onSelect(event)}
    >
      <h3>{event.title}</h3>
      <p>{event.date}</p>
      <p>{event.location.name}</p>
    </div>
  );
});

// useMemo による計算結果キャッシュ
const categories = useMemo(() => {
  return [...new Set(events.map(event => event.category))];
}, [events]);
```

### 3.6 エラーハンドリング

#### 3.6.1 Error Boundary実装
```typescript
class EventNavigatorErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EventNavigator Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>申し訳ございません。エラーが発生しました。</h2>
          <button onClick={() => window.location.reload()}>
            ページを再読み込み
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 3.7 セキュリティ実装

#### 3.7.1 環境変数管理
```typescript
// vite.config.ts での環境変数設定
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    }
  };
});

// 実行時の環境変数チェック
if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY が設定されていません。AI検索機能は無効化されます。');
}
```

#### 3.7.2 CSP設定
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://generativelanguage.googleapis.com;
  font-src 'self' data:;
">
```

## 4. デプロイメント仕様

### 4.1 GitHub Actions ワークフロー

#### 4.1.1 ビルド・デプロイフロー
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
        with:
          artifact_name: github-pages
          path: ./dist
```

### 4.2 GitHub Pages 設定

#### 4.2.1 SPA ルーティング対応
```javascript
// dist/404.html (GitHub Pages SPA対応)
<!DOCTYPE html>
<html>
<head>
  <script>
    // SPA routing fallback
    const path = window.location.pathname;
    window.history.replaceState(null, null, '/');
    window.addEventListener('load', () => {
      window.history.replaceState(null, null, path);
    });
  </script>
</head>
<body>
  <div id="root"></div>
  <script src="/assets/index.js"></script>
</body>
</html>
```

## 5. 品質保証

### 5.1 テスト戦略

#### 5.1.1 単体テスト
- **対象**: ユーティリティ関数、カスタムフック
- **ツール**: Jest + @testing-library/react
- **カバレッジ**: 80%以上

#### 5.1.2 統合テスト
- **対象**: コンポーネント間の連携
- **ツール**: Playwright
- **範囲**: 主要ユーザーフロー

#### 5.1.3 E2Eテスト
- **対象**: 本番環境での動作確認
- **ツール**: Playwright + GitHub Actions
- **頻度**: デプロイ後自動実行

### 5.2 パフォーマンス要件

#### 5.2.1 Core Web Vitals
- **First Contentful Paint**: < 1.5秒
- **Largest Contentful Paint**: < 2.5秒
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

#### 5.2.2 バンドルサイズ制限
- **初期バンドル**: < 500KB (gzipped)
- **総バンドルサイズ**: < 1MB (gzipped)
- **チャンクサイズ**: < 200KB (個別)

## 6. 監視・運用

### 6.1 ログ・監視
- **エラートラッキング**: Console.error による基本ログ
- **パフォーマンス監視**: Web Vitals API
- **使用状況分析**: 必要に応じてGoogle Analytics

### 6.2 メンテナンス
- **依存関係更新**: 月次での脆弱性チェック
- **パフォーマンス改善**: 四半期レビュー
- **機能追加**: ユーザーフィードバックベース

---

**文書作成日**: 2024年8月13日  
**文書バージョン**: 1.0  
**作成者**: 技術チーム  
**承認者**: アーキテクト