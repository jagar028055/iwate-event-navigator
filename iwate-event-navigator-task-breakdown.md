# 岩手イベントナビゲーター タスク分解（4階層）

## 開発戦略概要
- **技術スタック**: Cloudflare Pages + Workers + OpenStreetMap + Leaflet
- **フロントエンド**: React + TypeScript + Vite
- **状態管理**: Zustand + PWA対応
- **開発期間**: 約12週間（3フェーズ）
- **チーム構成**: フロントエンド2名、バックエンド1名、DevOps1名

---

## Phase 1: MVP（4週間）- 基本地図表示 + イベント一覧
## Phase 2: 機能拡張（5週間）- 検索・フィルタ + AI統合  
## Phase 3: PWA（3週間）- オフライン対応 + 通知

---

# Epic 1: 基盤・インフラ構築（総工数: 8人日）

## Story 1-1: 開発環境セットアップ（3人日）

### Task 1-1-1: プロジェクト初期化とツールチェイン構築（1.5人日）
- **担当**: DevOps
- **優先度**: P0（必須）
- **前提条件**: なし

#### Subtask 1-1-1-1: Vite + React + TypeScript プロジェクト作成（0.5人日）
- `npm create vite@latest iwate-events --template react-ts`
- ESLint, Prettier, Husky設定
- **成果物**: 基本プロジェクト構造
- **完了条件**: `npm run dev`で開発サーバー起動

#### Subtask 1-1-1-2: 必要依存関係インストール（0.5人日）
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "zustand": "^4.4.1",
    "@types/leaflet": "^1.9.6"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "typescript": "^5.0.2",
    "vitest": "^0.34.0",
    "@testing-library/react": "^13.4.0"
  }
}
```
- **成果物**: package.json設定完了
- **完了条件**: 全依存関係正常インストール

#### Subtask 1-1-1-3: ディレクトリ構造作成（0.5人日）
```
src/
├── components/           # React コンポーネント
├── hooks/               # カスタムフック
├── stores/              # Zustand ストア
├── types/               # TypeScript 型定義
├── utils/               # ユーティリティ関数
├── assets/              # 静的アセット
└── styles/              # スタイルファイル
```
- **成果物**: 標準化されたディレクトリ構造
- **完了条件**: 各ディレクトリに基本ファイル配置

### Task 1-1-2: 開発ツール設定とコード品質（1.5人日）
- **担当**: DevOps
- **優先度**: P0（必須）
- **依存関係**: Task 1-1-1完了

#### Subtask 1-1-2-1: ESLint + Prettier設定（0.5人日）
- React + TypeScript用ルール設定
- VS Code設定ファイル作成（.vscode/settings.json）
- **成果物**: .eslintrc.js, .prettierrc
- **完了条件**: コード自動フォーマット動作確認

#### Subtask 1-1-2-2: Git hooks設定（Husky + lint-staged）（0.5人日）
- pre-commit時の自動リント・フォーマット
- commit-msg時のコミットメッセージ規約チェック
- **成果物**: .husky/設定ファイル群
- **完了条件**: コミット時の品質チェック動作

#### Subtask 1-1-2-3: TypeScript設定最適化（0.5人日）
- 厳密な型チェック設定
- パスエイリアス設定（@/components等）
- **成果物**: tsconfig.json, vite.config.ts
- **完了条件**: 型エラーなしでビルド成功

## Story 1-2: Cloudflareインフラ構築（3人日）

### Task 1-2-1: Cloudflare Pages設定（1人日）
- **担当**: DevOps
- **優先度**: P0（必須）
- **依存関係**: Task 1-1-1完了

#### Subtask 1-2-1-1: Cloudflare Pages プロジェクト作成（0.5人日）
- GitHubリポジトリとの連携設定
- ビルド設定（Node.js 18, npm run build）
- **成果物**: Cloudflare Pages設定完了
- **完了条件**: 自動デプロイ動作確認

#### Subtask 1-2-1-2: カスタムドメイン設定（0.5人日）
- DNS設定（iwate-events.example.com）
- SSL証明書自動発行確認
- **成果物**: 本番URL設定完了
- **完了条件**: HTTPS接続確認

### Task 1-2-2: Cloudflare Workers API作成（2人日）
- **担当**: バックエンド
- **優先度**: P0（必須）
- **依存関係**: Task 1-2-1完了

#### Subtask 1-2-2-1: Workers開発環境構築（0.5人日）
- Wrangler CLI設定
- ローカル開発環境構築
- **成果物**: wrangler.toml設定
- **完了条件**: `wrangler dev`で開発サーバー起動

#### Subtask 1-2-2-2: 基本API構造実装（1人日）
```typescript
// workers/src/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    };
    
    // ルーティング実装
    switch (url.pathname) {
      case '/api/events':
        return handleEvents(request);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }
};
```
- **成果物**: 基本API構造
- **完了条件**: ヘルスチェック API応答確認

#### Subtask 1-2-2-3: D1データベース設定（0.5人日）
- Cloudflare D1データベース作成
- 基本テーブル設計（events, categories）
- **成果物**: データベーススキーマ
- **完了条件**: SQL実行確認

## Story 1-3: CI/CDパイプライン構築（2人日）

### Task 1-3-1: GitHub Actions設定（2人日）
- **担当**: DevOps
- **優先度**: P1（重要）
- **依存関係**: Story 1-1, 1-2完了

#### Subtask 1-3-1-1: テスト自動化（1人日）
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```
- **成果物**: テスト自動化workflow
- **完了条件**: PR時のテスト実行確認

#### Subtask 1-3-1-2: 自動デプロイ設定（1人日）
- main ブランチ -> 本番環境
- develop ブランチ -> ステージング環境
- **成果物**: デプロイworkflow
- **完了条件**: ブランチ別自動デプロイ動作

---

# Epic 2: 地図機能実装（総工数: 12人日）

## Story 2-1: Leaflet地図基盤実装（4人日）

### Task 2-1-1: 基本地図コンポーネント作成（2人日）
- **担当**: フロントエンド
- **優先度**: P0（必須）
- **依存関係**: Epic 1完了

#### Subtask 2-1-1-1: MapContainer基本実装（1人日）
```typescript
// src/components/Map/MapContainer.tsx
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const EventMap: React.FC = () => {
  return (
    <MapContainer
      center={[39.7036, 141.1527]} // 盛岡市中心部
      zoom={10}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};
```
- **成果物**: 基本地図表示コンポーネント
- **完了条件**: 岩手県中心の地図表示確認

#### Subtask 2-1-1-2: 地図操作機能実装（1人日）
- ズーム制御（最小8、最大18）
- 中心位置リセット機能
- 現在地取得機能（GPS連携）
- **成果物**: 地図操作UI
- **完了条件**: 全操作機能動作確認

### Task 2-1-2: マーカー表示システム実装（2人日）
- **担当**: フロントエンド
- **優先度**: P0（必須）
- **依存関係**: Task 2-1-1完了

#### Subtask 2-1-2-1: イベントマーカー実装（1人日）
```typescript
// src/components/Map/EventMarker.tsx
import { Marker, Popup } from 'react-leaflet';
import { EventData } from '@/types/event';

interface EventMarkerProps {
  event: EventData;
  onClick: (event: EventData) => void;
}

export const EventMarker: React.FC<EventMarkerProps> = ({ event, onClick }) => {
  return (
    <Marker position={[event.latitude, event.longitude]}>
      <Popup>
        <div className="event-popup">
          <h3>{event.title}</h3>
          <p>{event.date}</p>
          <button onClick={() => onClick(event)}>
            詳細を見る
          </button>
        </div>
      </Popup>
    </Marker>
  );
};
```
- **成果物**: イベントマーカーコンポーネント
- **完了条件**: マーカークリックでポップアップ表示

#### Subtask 2-1-2-2: マーカークラスタリング実装（1人日）
- react-leaflet-markercluster導入
- ズームレベル別クラスタ表示
- **成果物**: クラスタリング機能
- **完了条件**: 100+マーカーでの性能確認

## Story 2-2: 地図状態管理（4人日）

### Task 2-2-1: Zustand地図ストア作成（2人日）
- **担当**: フロントエンド
- **優先度**: P0（必須）
- **依存関係**: Task 2-1-1完了

#### Subtask 2-2-1-1: 地図状態定義（1人日）
```typescript
// src/stores/mapStore.ts
import { create } from 'zustand';

interface MapState {
  center: [number, number];
  zoom: number;
  selectedEvent: EventData | null;
  visibleEvents: EventData[];
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setSelectedEvent: (event: EventData | null) => void;
  updateVisibleEvents: (bounds: L.LatLngBounds) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  center: [39.7036, 141.1527],
  zoom: 10,
  selectedEvent: null,
  visibleEvents: [],
  // アクション実装...
}));
```
- **成果物**: 地図状態管理ストア
- **完了条件**: 状態変更の正常動作確認

#### Subtask 2-2-1-2: 地図イベント連携（1人日）
- 地図移動時の状態更新
- 表示領域内イベントフィルタリング
- **成果物**: 地図状態同期機能
- **完了条件**: 地図操作と状態の同期確認

### Task 2-2-2: パフォーマンス最適化（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Task 2-2-1完了

#### Subtask 2-2-2-1: 仮想化とレイジーローディング（1人日）
- 表示領域外マーカーの非表示
- ズームレベル別マーカー密度調整
- **成果物**: 表示最適化機能
- **完了条件**: 1000+マーカーでの性能測定

#### Subtask 2-2-2-2: メモ化とキャッシュ実装（1人日）
```typescript
// マーカー描画の最適化
const MemoizedEventMarker = React.memo(EventMarker);

// 地図タイルキャッシュ設定
const tileLayerOptions = {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors',
  // キャッシュ設定
};
```
- **成果物**: レンダリング最適化
- **完了条件**: 60fps維持確認

## Story 2-3: 地図UI/UX機能（4人日）

### Task 2-3-1: 地図コントロール実装（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Story 2-1完了

#### Subtask 2-3-1-1: カスタムコントロール作成（1人日）
- 現在地ボタン
- ズームリセットボタン
- レイヤー切り替えボタン
- **成果物**: 地図操作UI
- **完了条件**: 全コントロール動作確認

#### Subtask 2-3-1-2: モバイル対応最適化（1人日）
- タッチジェスチャー対応
- ピンチズーム最適化
- **成果物**: モバイル対応地図
- **完了条件**: iOS/Android動作確認

### Task 2-3-2: 地図レイヤー機能（2人日）
- **担当**: フロントエンド
- **優先度**: P2（改善）
- **依存関係**: Task 2-3-1完了

#### Subtask 2-3-2-1: 複数地図レイヤー対応（1人日）
- OpenStreetMap標準
- 地理院地図
- 衛星画像レイヤー
- **成果物**: レイヤー切り替え機能
- **完了条件**: 3種類レイヤー切り替え確認

#### Subtask 2-3-2-2: カテゴリ別表示機能（1人日）
```typescript
// イベントカテゴリ別レイヤー表示
const layerGroups = {
  festival: new L.LayerGroup(),
  concert: new L.LayerGroup(),
  sports: new L.LayerGroup()
};
```
- **成果物**: カテゴリフィルター
- **完了条件**: カテゴリ別ON/OFF切り替え確認

---

# Epic 3: イベント管理機能（総工数: 14人日）

## Story 3-1: イベントデータ管理（6人日）

### Task 3-1-1: データモデル設計と実装（3人日）
- **担当**: バックエンド
- **優先度**: P0（必須）
- **依存関係**: Epic 1完了

#### Subtask 3-1-1-1: データベーススキーマ設計（1人日）
```sql
-- events テーブル
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date_start TEXT NOT NULL,
  date_end TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT,
  category_id INTEGER,
  organizer TEXT,
  website TEXT,
  image_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- categories テーブル
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT
);
```
- **成果物**: データベーススキーマ
- **完了条件**: テーブル作成とサンプルデータ投入

#### Subtask 3-1-1-2: TypeScript型定義（1人日）
```typescript
// src/types/event.ts
export interface EventData {
  id: number;
  title: string;
  description?: string;
  dateStart: string;
  dateEnd?: string;
  latitude: number;
  longitude: number;
  address?: string;
  categoryId: number;
  organizer?: string;
  website?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon?: string;
}
```
- **成果物**: 型定義ファイル
- **完了条件**: TypeScriptコンパイルエラーなし

#### Subtask 3-1-1-3: バリデーション実装（1人日）
- 入力データバリデーション
- 緯度経度範囲チェック（岩手県内）
- **成果物**: バリデーション機能
- **完了条件**: 異常データ検出確認

### Task 3-1-2: CRUD API実装（3人日）
- **担当**: バックエンド
- **優先度**: P0（必須）
- **依存関係**: Task 3-1-1完了

#### Subtask 3-1-2-1: イベント取得API（1人日）
```typescript
// workers/src/handlers/events.ts
export async function getEvents(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const params = {
    limit: parseInt(url.searchParams.get('limit') || '50'),
    offset: parseInt(url.searchParams.get('offset') || '0'),
    category: url.searchParams.get('category'),
    dateFrom: url.searchParams.get('dateFrom'),
    dateTo: url.searchParams.get('dateTo')
  };
  
  // SQL実行とデータ取得
  const results = await env.DB.prepare(`
    SELECT * FROM events 
    WHERE date_start >= ? AND date_start <= ?
    ORDER BY date_start ASC 
    LIMIT ? OFFSET ?
  `).bind(params.dateFrom, params.dateTo, params.limit, params.offset).all();
  
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```
- **成果物**: イベント取得API
- **完了条件**: フィルター付き取得確認

#### Subtask 3-1-2-2: イベント作成・更新API（1人日）
- POST /api/events （新規作成）
- PUT /api/events/:id （更新）
- DELETE /api/events/:id （削除）
- **成果物**: CUD操作API
- **完了条件**: 全操作の正常動作確認

#### Subtask 3-1-2-3: エラーハンドリング実装（1人日）
```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return new Response(JSON.stringify({
      error: error.message,
      code: error.code
    }), { 
      status: error.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  // 予期しないエラー処理...
}
```
- **成果物**: エラーハンドリングシステム
- **完了条件**: 異常ケースの適切な応答確認

## Story 3-2: フロントエンド統合（4人日）

### Task 3-2-1: APIクライアント実装（2人日）
- **担当**: フロントエンド
- **優先度**: P0（必須）
- **依存関係**: Task 3-1-2完了

#### Subtask 3-2-1-1: HTTP クライアント作成（1人日）
```typescript
// src/api/client.ts
class EventApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async getEvents(params: EventQueryParams): Promise<EventData[]> {
    const url = new URL(`${this.baseUrl}/api/events`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value.toString());
    });
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new ApiError(response.status, await response.text());
    
    return response.json();
  }
}
```
- **成果物**: APIクライアント
- **完了条件**: 全API呼び出し確認

#### Subtask 3-2-1-2: React Query統合（1人日）
```typescript
// src/hooks/useEvents.ts
import { useQuery } from '@tanstack/react-query';

export const useEvents = (params: EventQueryParams) => {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => apiClient.getEvents(params),
    staleTime: 5 * 60 * 1000, // 5分
    cacheTime: 10 * 60 * 1000 // 10分
  });
};
```
- **成果物**: データフェッチングフック
- **完了条件**: キャッシュとリフェッチ動作確認

### Task 3-2-2: イベント表示コンポーネント（2人日）
- **担当**: フロントエンド
- **優先度**: P0（必須）
- **依存関係**: Task 3-2-1完了

#### Subtask 3-2-2-1: イベントリスト実装（1人日）
```typescript
// src/components/Event/EventList.tsx
export const EventList: React.FC = () => {
  const { data: events, isLoading, error } = useEvents({
    limit: 20,
    dateFrom: new Date().toISOString().split('T')[0]
  });
  
  if (isLoading) return <EventListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="event-list">
      {events?.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
```
- **成果物**: イベントリストコンポーネント
- **完了条件**: 一覧表示と詳細表示確認

#### Subtask 3-2-2-2: イベント詳細モーダル（1人日）
- イベント詳細情報表示
- 地図上での位置表示連携
- 外部リンク（公式サイト等）
- **成果物**: 詳細表示UI
- **完了条件**: 全項目表示確認

## Story 3-3: 検索・フィルター機能（4人日）

### Task 3-3-1: 検索機能実装（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Story 3-2完了

#### Subtask 3-3-1-1: テキスト検索実装（1人日）
```typescript
// src/components/Search/SearchInput.tsx
export const SearchInput: React.FC = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  const { data: searchResults } = useSearchEvents({
    query: debouncedQuery,
    enabled: debouncedQuery.length >= 2
  });
  
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="イベントを検索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {searchResults && (
        <SearchResults results={searchResults} />
      )}
    </div>
  );
};
```
- **成果物**: 検索入力UI
- **完了条件**: リアルタイム検索動作確認

#### Subtask 3-3-1-2: 検索API実装（1人日）
- 全文検索対応（SQLite FTS）
- タイトル・説明文・住所での検索
- **成果物**: 検索API
- **完了条件**: 日本語検索精度確認

### Task 3-3-2: フィルター機能実装（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Task 3-3-1完了

#### Subtask 3-3-2-1: カテゴリフィルター（1人日）
```typescript
// src/components/Filter/CategoryFilter.tsx
export const CategoryFilter: React.FC = () => {
  const { data: categories } = useCategories();
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  return (
    <div className="category-filter">
      {categories?.map(category => (
        <CategoryChip
          key={category.id}
          category={category}
          selected={selectedCategories.includes(category.id)}
          onToggle={(id) => toggleCategory(id)}
        />
      ))}
    </div>
  );
};
```
- **成果物**: カテゴリフィルターUI
- **完了条件**: 複数選択・解除動作確認

#### Subtask 3-3-2-2: 日付・エリアフィルター（1人日）
- 開催日範囲指定
- 地域（市町村）絞り込み
- 距離指定フィルター
- **成果物**: 複合フィルター機能
- **完了条件**: フィルター組み合わせ動作確認

---

# Epic 4: AI機能統合（総工数: 10人日）

## Story 4-1: AI推薦システム（4人日）

### Task 4-1-1: 推薦エンジン基盤実装（2人日）
- **担当**: バックエンド
- **優先度**: P1（重要）
- **依存関係**: Epic 3完了

#### Subtask 4-1-1-1: ユーザー行動データ収集（1人日）
```typescript
// workers/src/analytics/tracking.ts
interface UserAction {
  sessionId: string;
  eventId: number;
  action: 'view' | 'click' | 'favorite';
  timestamp: string;
  location?: [number, number];
}

export async function trackUserAction(
  action: UserAction, 
  env: Env
): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO user_actions (session_id, event_id, action, timestamp, location)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    action.sessionId,
    action.eventId, 
    action.action,
    action.timestamp,
    JSON.stringify(action.location)
  ).run();
}
```
- **成果物**: 行動トラッキングシステム
- **完了条件**: 各種イベント記録確認

#### Subtask 4-1-1-2: 推薦アルゴリズム実装（1人日）
```typescript
// 協調フィルタリング + コンテンツベースフィルタリング
export class RecommendationEngine {
  async getRecommendations(
    sessionId: string,
    userLocation?: [number, number]
  ): Promise<EventData[]> {
    // 1. ユーザーの過去の行動分析
    const userHistory = await this.getUserHistory(sessionId);
    
    // 2. 類似ユーザーの特定
    const similarUsers = await this.findSimilarUsers(userHistory);
    
    // 3. 推薦イベント算出
    const recommendations = await this.calculateRecommendations(
      similarUsers, userLocation
    );
    
    return recommendations;
  }
}
```
- **成果物**: 推薦アルゴリズム
- **完了条件**: 個人化推薦動作確認

### Task 4-1-2: 推薦UI実装（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Task 4-1-1完了

#### Subtask 4-1-2-1: おすすめイベント表示（1人日）
```typescript
// src/components/Recommendation/RecommendedEvents.tsx
export const RecommendedEvents: React.FC = () => {
  const { data: recommendations, isLoading } = useRecommendations();
  
  return (
    <section className="recommended-events">
      <h2>あなたにおすすめのイベント</h2>
      {isLoading ? (
        <RecommendationSkeleton />
      ) : (
        <div className="recommendation-grid">
          {recommendations?.map(event => (
            <RecommendationCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
};
```
- **成果物**: 推薦表示UI
- **完了条件**: パーソナライズ表示確認

#### Subtask 4-1-2-2: 推薦理由表示機能（1人日）
- "過去に参加したイベントから"
- "現在地周辺で開催"
- "同じカテゴリの人気イベント"
- **成果物**: 説明可能AI機能
- **完了条件**: 推薦理由表示確認

## Story 4-2: 自然言語検索（3人日）

### Task 4-2-1: OpenAI API統合（2人日）
- **担当**: バックエンド
- **優先度**: P1（重要）
- **依存関係**: Task 4-1-1完了

#### Subtask 4-2-1-1: クエリ解析API実装（1人日）
```typescript
// workers/src/ai/queryParser.ts
export async function parseNaturalLanguageQuery(
  query: string,
  env: Env
): Promise<SearchParams> {
  const prompt = `
以下のユーザークエリから検索パラメータを抽出してください：
クエリ: "${query}"

以下のJSON形式で応答してください：
{
  "keywords": ["keyword1", "keyword2"],
  "categories": ["festival", "concert"],
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "location": "盛岡市"
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  });

  return response.json();
}
```
- **成果物**: 自然言語解析API
- **完了条件**: 日本語クエリ解析確認

#### Subtask 4-2-1-2: セマンティック検索実装（1人日）
- ベクトル埋め込み生成
- 類似度検索機能
- **成果物**: 意味検索機能
- **完了条件**: 関連語検索精度確認

### Task 4-2-2: チャットUI実装（1人日）
- **担当**: フロントエンド
- **優先度**: P2（改善）
- **依存関係**: Task 4-2-1完了

#### Subtask 4-2-2-1: チャットインターフェース（1人日）
```typescript
// src/components/Chat/EventChatBot.tsx
export const EventChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { mutate: sendMessage, isLoading } = useChatQuery();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    sendMessage(input, {
      onSuccess: (response) => {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setInput('');
      }
    });
  };
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="「今週末の音楽イベントは？」など、自然な言葉で検索"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          送信
        </button>
      </form>
    </div>
  );
};
```
- **成果物**: チャット検索UI
- **完了条件**: 自然言語での検索・応答確認

## Story 4-3: インテリジェント通知（3人日）

### Task 4-3-1: 通知ロジック実装（2人日）
- **担当**: バックエンド
- **優先度**: P2（改善）
- **依存関係**: Story 4-1完了

#### Subtask 4-3-1-1: 通知条件設定（1人日）
```typescript
// workers/src/notifications/rules.ts
interface NotificationRule {
  id: string;
  userId: string;
  conditions: {
    categories?: string[];
    keywords?: string[];
    location?: {
      latitude: number;
      longitude: number;
      radius: number; // km
    };
    timeRange?: {
      start: string;
      end: string;
    };
  };
  enabled: boolean;
}

export class NotificationEngine {
  async checkNotificationTriggers(): Promise<void> {
    const newEvents = await this.getRecentEvents();
    const activeRules = await this.getActiveRules();
    
    for (const event of newEvents) {
      for (const rule of activeRules) {
        if (await this.matchesRule(event, rule)) {
          await this.sendNotification(event, rule.userId);
        }
      }
    }
  }
}
```
- **成果物**: 通知条件エンジン
- **完了条件**: 条件マッチング動作確認

#### Subtask 4-3-1-2: プッシュ通知送信（1人日）
- Cloudflare Workers + Web Push API
- 通知内容の動的生成
- **成果物**: プッシュ通知機能
- **完了条件**: 実際の通知送信確認

### Task 4-3-2: 通知設定UI（1人日）
- **担当**: フロントエンド
- **優先度**: P2（改善）
- **依存関係**: Task 4-3-1完了

#### Subtask 4-3-2-1: 通知設定画面（1人日）
- カテゴリ別通知ON/OFF
- 位置情報による通知範囲設定
- 通知時間帯設定
- **成果物**: 通知設定UI
- **完了条件**: 設定保存と通知動作確認

---

# Epic 5: PWA・UX機能（総工数: 8人日）

## Story 5-1: PWA実装（4人日）

### Task 5-1-1: Service Worker実装（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Epic 2, 3完了

#### Subtask 5-1-1-1: キャッシュ戦略実装（1人日）
```typescript
// public/sw.js
const CACHE_NAME = 'iwate-events-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればキャッシュから返す
        if (response) {
          return response;
        }
        
        // ネットワークから取得し、キャッシュに保存
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      }
    )
  );
});
```
- **成果物**: Service Worker
- **完了条件**: オフライン動作確認

#### Subtask 5-1-1-2: オフラインフォールバック（1人日）
- オフライン時のUI表示
- キャッシュされたイベント表示
- オンライン復帰時の同期
- **成果物**: オフライン対応機能
- **完了条件**: ネットワーク遮断時の動作確認

### Task 5-1-2: Webアプリマニフェスト（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Task 5-1-1完了

#### Subtask 5-1-2-1: マニフェスト作成（1人日）
```json
{
  "name": "岩手イベントナビゲーター",
  "short_name": "岩手Events",
  "description": "岩手県内のイベント情報を地図で検索・発見できるアプリ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512", 
      "type": "image/png"
    }
  ]
}
```
- **成果物**: Webアプリマニフェスト
- **完了条件**: ホーム画面追加確認

#### Subtask 5-1-2-2: アプリアイコン作成（1人日）
- 192x192, 512x512サイズアイコン
- iOS用タッチアイコン
- Favicon設定
- **成果物**: アプリアイコン一式
- **完了条件**: 各デバイスでのアイコン表示確認

## Story 5-2: レスポンシブUI（4人日）

### Task 5-2-1: モバイル最適化（2人日）
- **担当**: フロントエンド
- **優先度**: P0（必須）
- **依存関係**: Epic 2完了

#### Subtask 5-2-1-1: タッチ操作最適化（1人日）
```css
/* モバイル最適化CSS */
@media (max-width: 768px) {
  .map-container {
    height: 60vh;
  }
  
  .event-list {
    height: 40vh;
    overflow-y: auto;
  }
  
  .filter-buttons button {
    min-height: 44px; /* iOS タップターゲット推奨サイズ */
    padding: 12px 16px;
  }
}

/* タッチジェスチャー対応 */
.map-marker {
  cursor: pointer;
  touch-action: manipulation;
}
```
- **成果物**: モバイル対応CSS
- **完了条件**: iOS/Android操作性確認

#### Subtask 5-2-1-2: 画面サイズ別レイアウト（1人日）
- スマートフォン縦向き対応
- タブレット対応
- デスクトップ対応
- **成果物**: レスポンシブレイアウト
- **完了条件**: 全画面サイズでの表示確認

### Task 5-2-2: パフォーマンス最適化（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Task 5-2-1完了

#### Subtask 5-2-2-1: 画像最適化（1人日）
```typescript
// src/components/Image/OptimizedImage.tsx
export const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
}> = ({ src, alt, width, height }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <div className="image-container">
      {!imageLoaded && (
        <div className="image-placeholder" 
             style={{ width, height }}>
          <ImageSkeleton />
        </div>
      )}
      <img
        src={`${src}?w=${width}&h=${height}&f=webp`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        style={{ display: imageLoaded ? 'block' : 'none' }}
      />
    </div>
  );
};
```
- **成果物**: 画像最適化機能
- **完了条件**: 読み込み速度改善確認

#### Subtask 5-2-2-2: バンドルサイズ最適化（1人日）
- Tree shaking設定
- Code splitting実装
- 不要依存関係削除
- **成果物**: 軽量化バンドル
- **完了条件**: Initial load < 100KB確認

---

# Epic 6: テスト・品質保証（総工数: 6人日）

## Story 6-1: 単体テスト実装（2人日）

### Task 6-1-1: コンポーネントテスト（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Epic 2, 3実装完了

#### Subtask 6-1-1-1: 地図コンポーネントテスト（1人日）
```typescript
// src/components/Map/__tests__/MapContainer.test.tsx
import { render, screen } from '@testing-library/react';
import { MapContainer } from '../MapContainer';

// Leafletのモック
jest.mock('leaflet', () => ({
  Map: jest.fn(),
  TileLayer: jest.fn(),
  Marker: jest.fn()
}));

describe('MapContainer', () => {
  test('renders map with default center', () => {
    render(<MapContainer />);
    expect(screen.getByRole('region', { name: '地図' })).toBeInTheDocument();
  });
  
  test('displays event markers', async () => {
    const mockEvents = [
      { id: 1, title: 'Test Event', latitude: 39.7, longitude: 141.1 }
    ];
    
    render(<MapContainer events={mockEvents} />);
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });
  });
});
```
- **成果物**: 地図コンポーネントテストスイート
- **完了条件**: テストカバレッジ80%以上

#### Subtask 6-1-1-2: イベント管理テスト（1人日）
- イベントリスト表示テスト
- 検索機能テスト
- フィルター機能テスト
- **成果物**: イベント機能テストスイート
- **完了条件**: 主要ユーザーフロー網羅

## Story 6-2: 結合テスト実装（2人日）

### Task 6-2-1: API統合テスト（2人日）
- **担当**: バックエンド
- **優先度**: P1（重要）
- **依存関係**: Epic 3完了

#### Subtask 6-2-1-1: Cloudflare Workers テスト（1人日）
```typescript
// workers/__tests__/events.test.ts
import { unstable_dev } from 'wrangler';

describe('Events API', () => {
  let worker: any;
  
  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true }
    });
  });
  
  afterAll(async () => {
    await worker.stop();
  });
  
  test('GET /api/events returns event list', async () => {
    const resp = await worker.fetch('/api/events');
    expect(resp.status).toBe(200);
    
    const events = await resp.json();
    expect(Array.isArray(events)).toBe(true);
  });
  
  test('POST /api/events creates new event', async () => {
    const newEvent = {
      title: 'Test Event',
      dateStart: '2024-12-01',
      latitude: 39.7036,
      longitude: 141.1527
    };
    
    const resp = await worker.fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    });
    
    expect(resp.status).toBe(201);
  });
});
```
- **成果物**: API統合テストスイート
- **完了条件**: 全APIエンドポイントテスト完了

#### Subtask 6-2-1-2: データベーステスト（1人日）
- CRUD操作テスト
- データ整合性テスト
- パフォーマンステスト
- **成果物**: DB統合テストスイート
- **完了条件**: データ操作の信頼性確認

## Story 6-3: E2Eテスト実装（2人日）

### Task 6-3-1: Playwright E2Eテスト（2人日）
- **担当**: フロントエンド
- **優先度**: P1（重要）
- **依存関係**: Epic 2, 3, 5完了

#### Subtask 6-3-1-1: 主要ユーザーフローテスト（1人日）
```typescript
// e2e/event-search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Event Search Flow', () => {
  test('user can search and view event details', async ({ page }) => {
    await page.goto('/');
    
    // 地図が表示されることを確認
    await expect(page.locator('.leaflet-container')).toBeVisible();
    
    // 検索を実行
    await page.fill('[placeholder*="検索"]', '音楽');
    await page.click('button[type="submit"]');
    
    // 検索結果が表示されることを確認
    await expect(page.locator('.event-list')).toBeVisible();
    await expect(page.locator('.event-card')).toHaveCountGreaterThan(0);
    
    // イベント詳細を表示
    await page.click('.event-card:first-child');
    await expect(page.locator('.event-detail-modal')).toBeVisible();
    
    // 地図上でイベント位置が表示されることを確認
    await expect(page.locator('.leaflet-marker-pane')).toBeVisible();
  });
});
```
- **成果物**: E2Eテストスイート
- **完了条件**: 主要フロー網羅率100%

#### Subtask 6-3-1-2: モバイルデバイステスト（1人日）
- iOS Safari テスト
- Android Chrome テスト
- PWA インストールテスト
- **成果物**: モバイル対応テストスイート
- **完了条件**: 主要デバイスでの動作確認

---

# 開発スケジュールと依存関係

## Phase 1: MVP（4週間）
```
Week 1: Epic 1 (基盤構築)
├── Story 1-1: 開発環境 (3日)
├── Story 1-2: Cloudflare構築 (3日)
└── Story 1-3: CI/CD (2日)

Week 2-3: Epic 2 (地図機能)
├── Story 2-1: Leaflet基盤 (4日)
├── Story 2-2: 状態管理 (4日)
└── Story 2-3: UI/UX (4日)

Week 4: Epic 3-1 (イベント管理基盤)
├── Story 3-1: データ管理 (6日)
└── Story 3-2: フロントエンド統合 (2日)
```

## Phase 2: 機能拡張（5週間）
```
Week 5: Epic 3 完了
└── Story 3-3: 検索・フィルター (4日)

Week 6-7: Epic 4 (AI機能)
├── Story 4-1: 推薦システム (4日)
├── Story 4-2: 自然言語検索 (3日)
└── Story 4-3: インテリジェント通知 (3日)

Week 8-9: Epic 6 (テスト)
├── Story 6-1: 単体テスト (2日)
├── Story 6-2: 結合テスト (2日)
└── Story 6-3: E2Eテスト (2日)
```

## Phase 3: PWA（3週間）
```
Week 10-11: Epic 5 (PWA・UX)
├── Story 5-1: PWA実装 (4日)
└── Story 5-2: レスポンシブUI (4日)

Week 12: 統合テスト・デプロイ
├── 本番環境テスト (2日)
├── パフォーマンス最適化 (2日)
└── リリース準備 (1日)
```

## 重要なマイルストーン

### Milestone 1: MVP完成 (4週目終了)
- **成果物**: 基本地図表示 + イベント一覧機能
- **成功指標**: 
  - 地図上にイベント表示
  - イベント詳細表示
  - 基本検索機能動作
  - モバイル基本対応

### Milestone 2: AI機能統合 (9週目終了)  
- **成果物**: 推薦システム + 自然言語検索
- **成功指標**:
  - パーソナライズ推薦表示
  - 自然言語での検索応答
  - プッシュ通知送信

### Milestone 3: PWA完成 (12週目終了)
- **成果物**: フル機能PWAアプリ
- **成功指標**:
  - オフライン動作
  - ホーム画面インストール
  - 60fps滑らか動作
  - Lighthouse スコア90+

## リスク管理と対策

### 高リスク項目
1. **Leaflet + React統合の技術的課題** (Epic 2)
   - 対策: 早期プロトタイプ作成、代替ライブラリ調査
   
2. **OpenAI API利用コスト** (Epic 4)
   - 対策: ローカルLLM代替案準備、API使用量監視

3. **Cloudflare Workers制限** (Epic 1, 3)
   - 対策: Edge Runtime制限確認、分散アーキテクチャ検討

### 品質保証基準
- **コードカバレッジ**: 80%以上
- **Lighthouse スコア**: Performance 90+, Accessibility 95+
- **E2Eテスト**: 主要ユーザーフロー100%カバー
- **ブラウザ対応**: Chrome/Safari/Firefox最新3バージョン

この詳細なタスク分解により、開発チームは即座に実装作業に着手できます。各タスクは明確な成果物と完了条件が定義されており、段階的な品質確保とリリース計画が可能です。