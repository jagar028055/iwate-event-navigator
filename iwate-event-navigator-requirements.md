# 岩手イベントナビゲーター 完全要件定義書

## 目次
1. [プロジェクト概要](#1-プロジェクト概要)
2. [ユーザー分析・ペルソナ定義](#2-ユーザー分析ペルソナ定義)
3. [詳細機能要件](#3-詳細機能要件)
4. [非機能要件](#4-非機能要件)
5. [技術仕様詳細](#5-技術仕様詳細)
6. [ユーザーストーリー](#6-ユーザーストーリー)
7. [受け入れ条件](#7-受け入れ条件)

## 1. プロジェクト概要

### 1.1 プロジェクト名
岩手イベントナビゲーター (Iwate Event Navigator)

### 1.2 プロジェクトビジョン
岩手県のイベント情報を地図上で直感的に探索・発見できるPWAアプリケーション。AIによる個人化された推薦機能により、ユーザーの興味・関心に合致したイベントを効率的に見つけられるプラットフォームを提供する。

### 1.3 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite
- **地図ライブラリ**: Leaflet + OpenStreetMap
- **AI API**: Google Gemini API
- **ホスティング**: Cloudflare Pages
- **状態管理**: Zustand
- **UI框架**: Tailwind CSS + HeadlessUI
- **PWA**: Workbox
- **アイコン**: React Icons

## 2. ユーザー分析・ペルソナ定義

### 2.1 主要ペルソナ

#### ペルソナ1: 地元住民（佐藤 花子、35歳、盛岡市在住）
- **背景**: 夫と小学生の子供2人の4人家族
- **目的**: 家族で楽しめる週末イベントを見つけたい
- **利用デバイス**: スマートフォン（iPhone）メイン、たまにタブレット
- **利用シーン**: 
  - 平日夜に週末の予定を立てる時
  - 土日の朝に当日参加できるイベントを探す時
- **痛点**: 
  - イベント情報が散在していて探すのが大変
  - 子供向けかどうかの判断が難しい
  - 開催場所までのアクセス情報が不十分

#### ペルソナ2: 観光客（田中 太郎、28歳、東京都在住）
- **背景**: IT企業勤務、独身、旅行好き
- **目的**: 岩手旅行中に地元らしい体験ができるイベントを発見したい
- **利用デバイス**: スマートフォン（Android）
- **利用シーン**:
  - 旅行前の計画段階
  - 現地での空き時間
  - ホテルで翌日の予定を検討する時
- **痛点**:
  - 地理勘がないため場所の把握が困難
  - 観光客向けの情報か判断しづらい
  - 交通手段の情報が不足

#### ペルソナ3: イベント主催者（鈴木 一郎、45歳、地域活動団体代表）
- **背景**: NPO法人でイベント企画・運営を担当
- **目的**: 主催するイベントの認知度向上と参加者増加
- **利用デバイス**: パソコン（Windows）メイン、スマートフォンも利用
- **利用シーン**:
  - イベント詳細情報の確認
  - 他のイベントとの競合チェック
  - 参加者の反応確認
- **痛点**:
  - イベント情報の更新・管理が煩雑
  - ターゲット層への訴求効果が見えない
  - フィードバック収集の仕組みが不十分

### 2.2 利用シーン・コンテキスト

#### シーン1: 事前計画
- **時間帯**: 平日夜間（19:00-22:00）、休日午前（10:00-12:00）
- **場所**: 自宅
- **デバイス**: スマートフォン、タブレット、PC
- **行動**: じっくり検索・比較検討、カレンダーとの照合

#### シーン2: 当日検索
- **時間帯**: 土日祝日（10:00-16:00）
- **場所**: 外出先、移動中
- **デバイス**: スマートフォン
- **行動**: 現在地周辺の即座に参加可能なイベント検索

#### シーン3: 移動中確認
- **時間帯**: 全時間帯
- **場所**: 電車、バス、車（助手席）
- **デバイス**: スマートフォン
- **行動**: 目的地確認、ルート確認、開始時間確認

### 2.3 デバイス利用パターン

#### モバイルファースト設計（70%の利用）
- **画面サイズ**: 375px-414px (iPhone SE - iPhone Pro Max)
- **操作**: タッチ操作、片手操作を考慮
- **通信環境**: 4G/5G、Wi-Fi、低速回線対応

#### タブレット対応（20%の利用）
- **画面サイズ**: 768px-1024px (iPad Mini - iPad Pro)
- **操作**: タッチ操作、キーボード入力
- **利用場面**: 自宅での計画立案

#### デスクトップ対応（10%の利用）
- **画面サイズ**: 1024px以上
- **操作**: マウス・キーボード
- **利用場面**: 詳細な検索・比較、イベント主催者の管理作業

## 3. 詳細機能要件

### 3.1 コア機能

#### 3.1.1 地図表示・操作機能

**F001: インタラクティブ地図表示**
- Leafletを使用したレスポンシブ地図UI
- OpenStreetMapタイル + 岩手県詳細地図レイヤー
- ズームレベル: 6-18（岩手県全体〜建物レベル）
- 初期表示: 岩手県中心（北緯39.7036, 東経141.1527）

**実装詳細**:
```typescript
interface MapConfig {
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
  maxBounds: [[number, number], [number, number]];
}

const mapConfig: MapConfig = {
  center: [39.7036, 141.1527],
  zoom: 9,
  minZoom: 6,
  maxZoom: 18,
  maxBounds: [[38.5, 140.0], [41.0, 142.5]]
};
```

**F002: 現在地機能**
- Geolocation API使用
- 現在地マーカー表示（青色ドット + 精度円）
- 現在地への自動移動ボタン
- 位置情報エラーハンドリング

**F003: イベントマーカー表示**
- カテゴリ別色分けマーカー
- クラスタリング機能（近接イベント統合表示）
- マーカークリックでポップアップ表示
- マーカーホバー効果

**マーカー仕様**:
```typescript
interface EventMarker {
  id: string;
  position: [number, number];
  category: EventCategory;
  title: string;
  date: Date;
  status: 'active' | 'ended' | 'cancelled';
}

enum EventCategory {
  FESTIVAL = 'festival',      // 赤色
  CULTURE = 'culture',        // 青色
  SPORTS = 'sports',          // 緑色
  FOOD = 'food',             // オレンジ色
  NATURE = 'nature',         // 茶色
  WORKSHOP = 'workshop',     // 紫色
  OTHER = 'other'            // グレー色
}
```

#### 3.1.2 イベント検索・フィルタリング

**F004: 高度検索機能**

**基本検索**:
- テキスト検索（イベント名、説明、開催地）
- 日付範囲指定（開始日〜終了日）
- 距離範囲指定（現在地から半径N km）

**詳細フィルター**:
- カテゴリー選択（複数選択可）
- 開催時間帯（午前/午後/夜間/終日）
- 参加費用（無料/有料/上限金額指定）
- 対象年齢（子供向け/大人向け/ファミリー向け/シニア向け）
- アクセス方法（車/公共交通機関/徒歩）
- 開催形式（屋内/屋外/オンライン）

**実装仕様**:
```typescript
interface SearchParams {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: {
    center: [number, number];
    radius: number; // km
  };
  categories?: EventCategory[];
  timeSlots?: TimeSlot[];
  priceRange?: {
    min: number;
    max: number;
  };
  targetAudience?: TargetAudience[];
  accessMethods?: AccessMethod[];
  venue?: VenueType[];
}
```

**F005: ソート機能**
- 関連度順（デフォルト）
- 日付順（近い順/遠い順）
- 距離順（近い順/遠い順）
- 人気度順（参加予定者数、評価）
- 更新日時順

**F006: 検索結果表示**
- リスト表示/カード表示切り替え
- 無限スクロール（10件ずつ追加読み込み）
- 検索結果件数表示
- 「結果なし」時の代替提案

#### 3.1.3 イベント詳細表示

**F007: イベント詳細ページ**

**基本情報**:
- イベント名
- 開催日時（開始〜終了）
- 開催場所（住所、施設名）
- 主催者情報
- 参加費用
- 定員・空き状況

**詳細情報**:
- イベント説明文
- プログラム・タイムテーブル
- 持ち物・注意事項
- 申込み方法・締切
- 問い合わせ先
- 公式サイトリンク

**メディア**:
- イベント画像（メイン画像 + ギャラリー）
- 動画（YouTube埋め込み）
- PDFチラシ・資料

**実装仕様**:
```typescript
interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startDateTime: Date;
  endDateTime: Date;
  venue: {
    name: string;
    address: string;
    coordinates: [number, number];
    accessInfo: string;
    parking: boolean;
    capacity: number;
  };
  organizer: {
    name: string;
    contact: string;
    website?: string;
  };
  price: {
    type: 'free' | 'paid';
    amount?: number;
    details?: string;
  };
  registration: {
    required: boolean;
    method?: string;
    deadline?: Date;
    url?: string;
  };
  media: {
    mainImage?: string;
    gallery?: string[];
    videos?: string[];
    documents?: string[];
  };
  tags: string[];
  targetAudience: TargetAudience[];
  accessibility: AccessibilityInfo;
}
```

#### 3.1.4 AIによるイベント推薦（Gemini API活用）

**F008: パーソナライズド推薦**

**推薦アルゴリズム**:
1. ユーザープロファイル分析
   - 閲覧履歴
   - お気に入り登録
   - 参加履歴
   - 検索履歴

2. コンテンツベース推薦
   - イベントカテゴリ類似性
   - 開催場所の近接性
   - 開催時間の類似性

3. AI推薦（Gemini API）
   - 自然言語でのイベント説明解析
   - ユーザーの興味関心マッチング
   - 季節・天候・時事性考慮

**実装仕様**:
```typescript
interface RecommendationRequest {
  userId?: string;
  userProfile: {
    favoriteCategories: EventCategory[];
    preferredLocations: string[];
    budgetRange: [number, number];
    targetAudience: TargetAudience;
  };
  contextualInfo: {
    currentLocation?: [number, number];
    currentDateTime: Date;
    weather?: WeatherInfo;
    availableTime?: number; // minutes
  };
  excludeEventIds?: string[];
}

interface RecommendationResponse {
  recommendations: {
    event: EventDetail;
    score: number;
    reason: string;
  }[];
  explanation: string;
}
```

**F009: 質問ベース推薦**
- 自然言語クエリ対応
- 「今度の休みに家族で楽しめるイベントは？」
- 「雨の日でも楽しめる屋内イベント」
- 「初心者でも参加できるワークショップ」

**Gemini API統合**:
```typescript
const generateRecommendations = async (
  query: string,
  events: EventDetail[],
  userContext: UserContext
): Promise<RecommendationResponse> => {
  const prompt = `
  ユーザーの質問: "${query}"
  
  利用可能なイベント情報:
  ${JSON.stringify(events, null, 2)}
  
  ユーザーコンテキスト:
  ${JSON.stringify(userContext, null, 2)}
  
  上記の情報を基に、ユーザーに最適なイベントを3-5個推薦し、
  それぞれの推薦理由を簡潔に説明してください。
  `;
  
  const response = await geminiAPI.generateContent(prompt);
  return parseRecommendationResponse(response);
};
```

### 3.2 付加価値機能

#### 3.2.1 お気に入り・ブックマーク

**F010: お気に入り機能**
- イベント詳細ページからお気に入り登録/解除
- お気に入り一覧表示（リスト/カード表示）
- お気に入り数表示（イベント一覧・詳細）
- ローカルストレージ保存（ユーザー登録不要）

**F011: ブックマーク機能**
- 検索結果・フィルター条件の保存
- 保存した検索条件の名前付け
- ワンクリックで保存条件での再検索
- 最大10件まで保存可能

**実装仕様**:
```typescript
interface BookmarkData {
  id: string;
  name: string;
  searchParams: SearchParams;
  createdAt: Date;
  lastUsed: Date;
}

interface FavoriteData {
  eventId: string;
  addedAt: Date;
}

// LocalStorage管理
class LocalStorageManager {
  private static FAVORITES_KEY = 'iwate-events-favorites';
  private static BOOKMARKS_KEY = 'iwate-events-bookmarks';
  
  static getFavorites(): string[] {
    const data = localStorage.getItem(this.FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  }
  
  static toggleFavorite(eventId: string): boolean {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(eventId);
    
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(eventId);
    }
    
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    return index === -1; // 追加された場合true
  }
}
```

#### 3.2.2 カレンダー連携

**F012: カレンダーエクスポート**
- iCalファイル（.ics）生成
- Google Calendar追加リンク
- Apple Calendar対応
- Outlook対応

**F013: リマインダー設定**
- イベント開始前の通知設定
- 通知タイミング選択（1時間前/1日前/1週間前）
- ブラウザ通知API活用

**実装仕様**:
```typescript
interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  url?: string;
}

class CalendarIntegration {
  static generateICS(event: EventDetail): string {
    const start = event.startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = event.endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Iwate Event Navigator
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.venue.address}
URL:${window.location.origin}/events/${event.id}
END:VEVENT
END:VCALENDAR`;
  }
  
  static getGoogleCalendarUrl(event: EventDetail): string {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${this.formatGoogleDate(event.startDateTime)}/${this.formatGoogleDate(event.endDateTime)}`,
      details: event.description,
      location: event.venue.address,
      sprop: `website:${window.location.origin}/events/${event.id}`
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}
```

#### 3.2.3 シェア機能

**F014: ソーシャルシェア**
- Twitter/X投稿
- Facebook投稿
- LINE送信
- URLコピー
- QRコード生成

**F015: 統合シェア**
- Web Share API対応（モバイル）
- カスタムシェアテキスト生成
- OGP対応（メタタグ動的生成）

**実装仕様**:
```typescript
interface ShareData {
  title: string;
  text: string;
  url: string;
}

class SocialShare {
  static async share(event: EventDetail): Promise<void> {
    const shareData: ShareData = {
      title: event.title,
      text: `${event.title} - ${this.formatDate(event.startDateTime)}開催`,
      url: `${window.location.origin}/events/${event.id}`
    };
    
    if (navigator.share) {
      // Web Share API使用
      await navigator.share(shareData);
    } else {
      // フォールバック: カスタムシェアモーダル表示
      this.showShareModal(shareData);
    }
  }
  
  static getTwitterUrl(shareData: ShareData): string {
    const params = new URLSearchParams({
      text: `${shareData.text} ${shareData.url}`,
      hashtags: '岩手,イベント,IwateEvent'
    });
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }
  
  static getLINEUrl(shareData: ShareData): string {
    const params = new URLSearchParams({
      text: `${shareData.text}\n${shareData.url}`
    });
    return `https://social-plugins.line.me/lineit/share?${params.toString()}`;
  }
}
```

#### 3.2.4 ルート案内・ナビゲーション

**F016: 交通手段提案**
- 現在地からイベント会場までのルート表示
- 複数ルート提案（車/公共交通機関/徒歩）
- 所要時間・料金表示
- リアルタイム交通情報連携

**F017: 外部ナビゲーション連携**
- Google Maps連携
- Apple Maps連携
- 乗換案内アプリ連携
- カーナビアプリ連携

**実装仕様**:
```typescript
interface RouteOption {
  method: 'car' | 'transit' | 'walking' | 'cycling';
  duration: number; // minutes
  distance?: number; // meters
  cost?: number; // yen
  steps: RouteStep[];
  externalUrl: string;
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  transportMode?: string;
}

class NavigationService {
  static getGoogleMapsUrl(
    destination: [number, number],
    origin?: [number, number]
  ): string {
    const params = new URLSearchParams({
      api: '1',
      destination: `${destination[0]},${destination[1]}`,
      ...(origin && { origin: `${origin[0]},${origin[1]}` })
    });
    
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }
  
  static async getRoutes(
    origin: [number, number],
    destination: [number, number]
  ): Promise<RouteOption[]> {
    // OpenRouteService API等を使用してルート情報取得
    // 実装詳細は外部API仕様に依存
  }
}
```

### 3.3 PWA機能

#### 3.3.1 オフライン対応

**F018: オフライン機能**
- Service Worker実装（Workbox使用）
- 重要なページ・リソースのキャッシュ
- オフライン時の代替表示
- データ同期キュー機能

**キャッシュ戦略**:
- Shell（HTML/CSS/JS）: Cache First
- 地図タイル: Stale While Revalidate
- イベントデータ: Network First
- 画像: Cache First with 7日間有効期限

**実装仕様**:
```typescript
// service-worker.ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// プリキャッシュ
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 地図タイル
registerRoute(
  ({ url }) => url.hostname === 'tile.openstreetmap.org',
  new StaleWhileRevalidate({
    cacheName: 'map-tiles',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        return `${request.url}?v=1`;
      }
    }]
  })
);

// イベントAPI
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/events'),
  new NetworkFirst({
    cacheName: 'events-api',
    networkTimeoutSeconds: 5,
    plugins: [{
      cacheWillUpdate: async ({ response }) => {
        return response.status === 200 ? response : null;
      }
    }]
  })
);
```

#### 3.3.2 プッシュ通知

**F019: 通知機能**
- イベントリマインダー
- 新着イベント通知
- 緊急情報（中止・変更）通知
- 位置ベース通知

**実装要件**:
- Push API + Notification API使用
- VAPID キー設定
- 通知許可フロー
- 通知設定画面

**実装仕様**:
```typescript
interface NotificationData {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  data: {
    eventId?: string;
    action: 'reminder' | 'new_event' | 'update' | 'emergency';
  };
}

class NotificationManager {
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }
    
    return await Notification.requestPermission();
  }
  
  static async subscribeUser(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    return subscription;
  }
  
  static async scheduleReminder(eventId: string, scheduledTime: Date): Promise<void> {
    // IndexedDBに保存し、Service Workerでスケジュール管理
    await this.storeScheduledNotification({
      eventId,
      scheduledTime,
      type: 'reminder'
    });
  }
}
```

#### 3.3.3 ホーム画面インストール

**F020: アプリインストール機能**
- Add to Home Screen促進
- カスタムインストールプロンプト
- インストール状態検出
- アプリアイコン・スプラッシュ画面

**Manifest設定**:
```json
{
  "name": "岩手イベントナビゲーター",
  "short_name": "岩手イベント",
  "description": "岩手県のイベント情報を地図で探索",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "今日のイベント",
      "url": "/today",
      "icons": [{"src": "/icons/today-96x96.png", "sizes": "96x96"}]
    },
    {
      "name": "お気に入り",
      "url": "/favorites",
      "icons": [{"src": "/icons/heart-96x96.png", "sizes": "96x96"}]
    }
  ]
}
```

## 4. 非機能要件

### 4.1 パフォーマンス要件

#### 4.1.1 ページ読み込み速度
- **初回読み込み**: 3秒以内（3G回線環境）
- **画面遷移**: 1秒以内
- **検索結果表示**: 2秒以内
- **地図初期化**: 2秒以内

#### 4.1.2 Core Web Vitals目標値
- **LCP (Largest Contentful Paint)**: 2.5秒以下
- **FID (First Input Delay)**: 100ms以下
- **CLS (Cumulative Layout Shift)**: 0.1以下

#### 4.1.3 最適化手法
- **コード分割**: ルート別の動的インポート
- **画像最適化**: WebP対応、lazy loading、レスポンシブ画像
- **CDN活用**: Cloudflare CDN経由での配信
- **バンドル最適化**: Tree shaking、圧縮、HTTP/2対応

**実装仕様**:
```typescript
// ルート別コード分割
const MapPage = lazy(() => import('./pages/MapPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));

// 画像コンポーネント
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  loading?: 'lazy' | 'eager';
}

const OptimizedImage: FC<OptimizedImageProps> = ({ 
  src, alt, width, height, loading = 'lazy' 
}) => {
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
  
  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
};
```

### 4.2 セキュリティ要件

#### 4.2.1 HTTPS通信
- 全通信HTTPS必須
- HSTS (HTTP Strict Transport Security) 有効
- Content Security Policy設定

#### 4.2.2 API セキュリティ
- Gemini API キーの安全な管理
- リクエストレート制限
- CORS適切な設定

#### 4.2.3 データ保護
- 個人情報の最小限収集
- ローカルストレージの暗号化
- XSS/CSRF対策

**実装仕様**:
```typescript
// CSP設定（vite.config.ts）
export default defineConfig({
  plugins: [
    react(),
    // CSP設定
    {
      name: 'csp-header',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: https: http:; " +
            "connect-src 'self' https://api.openweathermap.org https://generativelanguage.googleapis.com"
          );
          next();
        });
      }
    }
  ]
});

// API Key管理
class SecureConfig {
  private static encryptionKey = 'iwate-events-key';
  
  static setApiKey(key: string): void {
    const encrypted = btoa(key); // 実際にはより強力な暗号化を使用
    localStorage.setItem(this.encryptionKey, encrypted);
  }
  
  static getApiKey(): string | null {
    const encrypted = localStorage.getItem(this.encryptionKey);
    return encrypted ? atob(encrypted) : null;
  }
}
```

### 4.3 アクセシビリティ

#### 4.3.1 WCAG 2.1 AA準拠
- **知覚可能性**: 色のみに依存しない情報提示、適切なコントラスト比
- **操作可能性**: キーボード操作対応、十分なタッチターゲットサイズ
- **理解可能性**: 明確な文言、一貫したナビゲーション
- **堅牢性**: セマンティックHTML、スクリーンリーダー対応

#### 4.3.2 実装要件
- **セマンティックHTML**: 適切なマークアップ
- **ARIA属性**: 必要に応じて追加
- **キーボードナビゲーション**: Tab/Enterでの操作
- **スクリーンリーダー**: 音声読み上げ対応

**実装仕様**:
```typescript
// アクセシブルなボタンコンポーネント
interface AccessibleButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const AccessibleButton: FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    className="min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
  >
    {children}
  </button>
);

// 色覚対応
const colorPalette = {
  // プロタノピア・デュートタノピア対応
  primary: '#2563eb',    // 青
  secondary: '#dc2626',  // 赤（緑色盲でも識別可能）
  success: '#059669',    // 緑
  warning: '#d97706',    // オレンジ
  error: '#dc2626',      // 赤
  info: '#0891b2',       // シアン
};
```

### 4.4 レスポンシブデザイン

#### 4.4.1 ブレイクポイント設定
```css
/* Mobile First Design */
/* XS: 0px - 475px */
.xs\:hidden { display: none; }

/* SM: 476px - 640px */
@media (min-width: 476px) {
  .sm\:block { display: block; }
}

/* MD: 641px - 768px */
@media (min-width: 641px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* LG: 769px - 1024px */
@media (min-width: 769px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

/* XL: 1025px - 1280px */
@media (min-width: 1025px) {
  .xl\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

/* 2XL: 1281px+ */
@media (min-width: 1281px) {
  .\32xl\:max-w-7xl { max-width: 80rem; }
}
```

#### 4.4.2 レイアウト仕様

**モバイル（〜768px）**:
- 単一カラムレイアウト
- ハンバーガーメニュー
- フルスクリーン地図表示
- 下部固定ナビゲーション

**タブレット（769px〜1024px）**:
- 2カラムレイアウト（検索＋地図）
- サイドバーメニュー
- グリッド表示（2列）

**デスクトップ（1025px〜）**:
- 3カラムレイアウト（メニュー＋検索＋地図）
- ドロップダウンメニュー
- グリッド表示（3-4列）

**実装仕様**:
```typescript
// レスポンシブ対応フック
const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<string>('xs');
  
  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 476) setBreakpoint('xs');
      else if (width < 641) setBreakpoint('sm');
      else if (width < 769) setBreakpoint('md');
      else if (width < 1025) setBreakpoint('lg');
      else if (width < 1281) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };
    
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);
  
  return breakpoint;
};

// レスポンシブレイアウトコンポーネント
const ResponsiveLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const breakpoint = useBreakpoint();
  
  return (
    <div className={`
      min-h-screen bg-gray-50
      ${breakpoint === 'xs' || breakpoint === 'sm' ? 
        'pb-16' : // モバイル: 下部ナビ分の余白
        'pt-16'   // デスクトップ: 上部ヘッダー分の余白
      }
    `}>
      {children}
    </div>
  );
};
```

## 5. 技術仕様詳細

### 5.1 コンポーネント設計

#### 5.1.1 コンポーネント階層
```
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── SearchBar
│   │   └── UserMenu
│   ├── Main
│   │   ├── MapView
│   │   │   ├── LeafletMap
│   │   │   ├── EventMarkers
│   │   │   ├── LocationControl
│   │   │   └── MapLegend
│   │   ├── EventList
│   │   │   ├── EventCard
│   │   │   ├── EventFilter
│   │   │   └── Pagination
│   │   └── EventDetail
│   │       ├── EventInfo
│   │       ├── EventMedia
│   │       ├── EventActions
│   │       └── RecommendedEvents
│   ├── Sidebar
│   │   ├── FilterPanel
│   │   ├── BookmarkList
│   │   └── RecentSearches
│   └── Footer
│       └── AppInfo
├── Modals
│   ├── ShareModal
│   ├── CalendarModal
│   └── SettingsModal
└── Providers
    ├── ThemeProvider
    ├── EventDataProvider
    └── NotificationProvider
```

#### 5.1.2 コンポーネント仕様

**EventCard コンポーネント**:
```typescript
interface EventCardProps {
  event: EventDetail;
  variant?: 'list' | 'grid' | 'featured';
  showDistance?: boolean;
  onClick?: (event: EventDetail) => void;
}

const EventCard: FC<EventCardProps> = ({
  event,
  variant = 'list',
  showDistance = false,
  onClick
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  
  const handleFavoriteToggle = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    const result = LocalStorageManager.toggleFavorite(event.id);
    setIsFavorite(result);
  }, [event.id]);
  
  const formatDistance = useCallback((dist: number) => {
    return dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`;
  }, []);
  
  return (
    <article
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200
        hover:shadow-md transition-shadow cursor-pointer
        ${variant === 'grid' ? 'aspect-[4/3]' : ''}
        ${variant === 'featured' ? 'border-blue-200 bg-blue-50' : ''}
      `}
      onClick={() => onClick?.(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(event);
        }
      }}
    >
      {/* 画像セクション */}
      <div className="relative">
        <OptimizedImage
          src={event.media.mainImage || '/images/no-image.jpg'}
          alt={event.title}
          width={400}
          height={200}
          loading="lazy"
        />
        
        {/* カテゴリーバッジ */}
        <span className={`
          absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium
          ${getCategoryColor(event.category)}
        `}>
          {getCategoryLabel(event.category)}
        </span>
        
        {/* お気に入りボタン */}
        <AccessibleButton
          onClick={handleFavoriteToggle}
          ariaLabel={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
          className="absolute top-2 right-2 p-2 bg-white/80 rounded-full"
        >
          <HeartIcon 
            className={`w-5 h-5 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </AccessibleButton>
      </div>
      
      {/* 内容セクション */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
          {event.title}
        </h3>
        
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <time dateTime={event.startDateTime.toISOString()}>
              {formatEventDate(event.startDateTime, event.endDateTime)}
            </time>
          </div>
          
          <div className="flex items-center">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span className="line-clamp-1">{event.venue.name}</span>
          </div>
          
          {showDistance && distance && (
            <div className="flex items-center">
              <NavigationIcon className="w-4 h-4 mr-1" />
              <span>{formatDistance(distance)}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <CurrencyYenIcon className="w-4 h-4 mr-1" />
            <span>
              {event.price.type === 'free' ? '無料' : `${event.price.amount}円`}
            </span>
          </div>
        </div>
        
        {event.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-3">
            {event.description}
          </p>
        )}
      </div>
    </article>
  );
};
```

### 5.2 状態管理戦略

#### 5.2.1 Zustand Store設計

**EventStore**:
```typescript
interface EventStore {
  // State
  events: EventDetail[];
  filteredEvents: EventDetail[];
  selectedEvent: EventDetail | null;
  searchParams: SearchParams;
  loading: boolean;
  error: string | null;
  
  // Actions
  setEvents: (events: EventDetail[]) => void;
  setSelectedEvent: (event: EventDetail | null) => void;
  updateSearchParams: (params: Partial<SearchParams>) => void;
  searchEvents: () => Promise<void>;
  clearError: () => void;
}

const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  searchParams: {
    query: '',
    categories: [],
    dateRange: {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
    }
  },
  loading: false,
  error: null,
  
  setEvents: (events) => {
    set({ events });
    get().applyFilters();
  },
  
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  
  updateSearchParams: (params) => {
    set(state => ({
      searchParams: { ...state.searchParams, ...params }
    }));
    get().searchEvents();
  },
  
  searchEvents: async () => {
    set({ loading: true, error: null });
    
    try {
      const { searchParams } = get();
      const events = await EventAPI.searchEvents(searchParams);
      set({ events, loading: false });
      get().applyFilters();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '検索に失敗しました',
        loading: false 
      });
    }
  },
  
  applyFilters: () => {
    const { events, searchParams } = get();
    
    let filtered = [...events];
    
    // テキストフィルタ
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.venue.name.toLowerCase().includes(query)
      );
    }
    
    // カテゴリフィルタ
    if (searchParams.categories && searchParams.categories.length > 0) {
      filtered = filtered.filter(event =>
        searchParams.categories!.includes(event.category)
      );
    }
    
    // 日付フィルタ
    if (searchParams.dateRange) {
      const { start, end } = searchParams.dateRange;
      filtered = filtered.filter(event =>
        event.startDateTime >= start && event.startDateTime <= end
      );
    }
    
    set({ filteredEvents: filtered });
  },
  
  clearError: () => set({ error: null })
}));
```

**MapStore**:
```typescript
interface MapStore {
  // State
  center: [number, number];
  zoom: number;
  userLocation: [number, number] | null;
  bounds: [[number, number], [number, number]] | null;
  
  // Actions
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setUserLocation: (location: [number, number] | null) => void;
  setBounds: (bounds: [[number, number], [number, number]] | null) => void;
  focusOnEvent: (event: EventDetail) => void;
}

const useMapStore = create<MapStore>((set, get) => ({
  center: [39.7036, 141.1527], // 岩手県中心
  zoom: 9,
  userLocation: null,
  bounds: null,
  
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setUserLocation: (location) => set({ userLocation: location }),
  setBounds: (bounds) => set({ bounds }),
  
  focusOnEvent: (event) => {
    set({
      center: event.venue.coordinates,
      zoom: 15
    });
  }
}));
```

#### 5.2.2 Context Providers

**NotificationProvider**:
```typescript
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // 自動削除（5秒後）
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  }, []);
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications
    }}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotificationContext.Provider>
  );
};
```

### 5.3 API設計

#### 5.3.1 REST API エンドポイント

**イベント関連API**:
```typescript
// GET /api/events
interface GetEventsRequest {
  query?: string;
  categories?: string[];
  date_start?: string;
  date_end?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  offset?: number;
  sort?: 'relevance' | 'date' | 'distance' | 'popularity';
}

interface GetEventsResponse {
  events: EventDetail[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// GET /api/events/:id
interface GetEventResponse {
  event: EventDetail;
  relatedEvents: EventDetail[];
}

// EventAPI実装
class EventAPI {
  private static readonly BASE_URL = '/api';
  
  static async searchEvents(params: SearchParams): Promise<EventDetail[]> {
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('query', params.query);
    if (params.categories?.length) {
      params.categories.forEach(cat => searchParams.append('categories', cat));
    }
    if (params.dateRange) {
      searchParams.append('date_start', params.dateRange.start.toISOString());
      searchParams.append('date_end', params.dateRange.end.toISOString());
    }
    if (params.location) {
      searchParams.append('lat', params.location.center[0].toString());
      searchParams.append('lng', params.location.center[1].toString());
      searchParams.append('radius', params.location.radius.toString());
    }
    
    const response = await fetch(`${this.BASE_URL}/events?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: GetEventsResponse = await response.json();
    return data.events;
  }
  
  static async getEvent(id: string): Promise<EventDetail> {
    const response = await fetch(`${this.BASE_URL}/events/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('イベントが見つかりません');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: GetEventResponse = await response.json();
    return data.event;
  }
}
```

#### 5.3.2 Gemini API統合

**推薦API**:
```typescript
class RecommendationAPI {
  private static readonly GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
  private static readonly GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  static async getRecommendations(
    query: string,
    events: EventDetail[],
    userContext: UserContext
  ): Promise<RecommendationResponse> {
    const prompt = this.buildPrompt(query, events, userContext);
    
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    try {
      const response = await fetch(
        `${this.GEMINI_ENDPOINT}?key=${this.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseGeminiResponse(data, events);
      
    } catch (error) {
      console.error('Gemini API Error:', error);
      // フォールバック: ルールベースの推薦
      return this.getFallbackRecommendations(events, userContext);
    }
  }
  
  private static buildPrompt(
    query: string,
    events: EventDetail[],
    userContext: UserContext
  ): string {
    return `
あなたは岩手県のイベント推薦エキスパートです。
以下の情報を元に、ユーザーに最適なイベントを推薦してください。

【ユーザーの質問】
${query}

【ユーザーの情報】
- 好みのカテゴリ: ${userContext.favoriteCategories.join(', ')}
- 希望エリア: ${userContext.preferredLocations.join(', ')}
- 予算範囲: ${userContext.budgetRange[0]}円 - ${userContext.budgetRange[1]}円
- 対象: ${userContext.targetAudience}

【利用可能なイベント】
${events.map(event => `
- ID: ${event.id}
- タイトル: ${event.title}
- カテゴリ: ${event.category}
- 日時: ${event.startDateTime.toLocaleString('ja-JP')}
- 場所: ${event.venue.name}
- 料金: ${event.price.type === 'free' ? '無料' : `${event.price.amount}円`}
- 説明: ${event.description.substring(0, 200)}...
`).join('\n')}

【推薦要件】
1. 上記のイベントから最適な3-5個を選択してください
2. 選択理由を簡潔に説明してください
3. JSON形式で以下の構造で返してください：

{
  "recommendations": [
    {
      "eventId": "イベントID",
      "score": 0.9, // 0-1の推薦スコア
      "reason": "推薦理由"
    }
  ],
  "explanation": "全体的な推薦の説明"
}
`;
  }
  
  private static parseGeminiResponse(
    response: any,
    events: EventDetail[]
  ): RecommendationResponse {
    try {
      const content = response.candidates[0].content.parts[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Invalid JSON format in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        recommendations: parsed.recommendations
          .map((rec: any) => ({
            event: events.find(e => e.id === rec.eventId)!,
            score: rec.score,
            reason: rec.reason
          }))
          .filter((rec: any) => rec.event),
        explanation: parsed.explanation
      };
      
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw error;
    }
  }
  
  private static getFallbackRecommendations(
    events: EventDetail[],
    userContext: UserContext
  ): RecommendationResponse {
    // ルールベースの簡易推薦ロジック
    const scored = events
      .map(event => ({
        event,
        score: this.calculateScore(event, userContext),
        reason: 'あなたの好みに基づいた推薦です'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
      
    return {
      recommendations: scored,
      explanation: '現在利用可能なイベントから、あなたの好みに基づいて選択しました。'
    };
  }
  
  private static calculateScore(event: EventDetail, context: UserContext): number {
    let score = 0.5; // 基準値
    
    // カテゴリマッチング
    if (context.favoriteCategories.includes(event.category)) {
      score += 0.3;
    }
    
    // 予算マッチング
    const price = event.price.type === 'free' ? 0 : (event.price.amount || 0);
    if (price >= context.budgetRange[0] && price <= context.budgetRange[1]) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }
}
```

### 5.4 データモデル

#### 5.4.1 TypeScript型定義

**基本型**:
```typescript
// 基本データ型
export type EventCategory = 
  | 'festival' 
  | 'culture' 
  | 'sports' 
  | 'food' 
  | 'nature' 
  | 'workshop' 
  | 'other';

export type TargetAudience = 
  | 'children' 
  | 'adults' 
  | 'family' 
  | 'seniors' 
  | 'all';

export type AccessMethod = 
  | 'car' 
  | 'public_transport' 
  | 'walking' 
  | 'cycling';

export type VenueType = 
  | 'indoor' 
  | 'outdoor' 
  | 'online';

export type TimeSlot = 
  | 'morning' 
  | 'afternoon' 
  | 'evening' 
  | 'all_day';

// 座標型
export type Coordinates = [number, number]; // [lat, lng]

// 日付範囲型
export interface DateRange {
  start: Date;
  end: Date;
}

// 価格情報型
export interface PriceInfo {
  type: 'free' | 'paid';
  amount?: number;
  details?: string;
  currency?: string;
}
```

**複合型**:
```typescript
// 会場情報
export interface Venue {
  name: string;
  address: string;
  coordinates: Coordinates;
  accessInfo: string;
  parking: boolean;
  capacity?: number;
  facilities?: string[];
  website?: string;
  phoneNumber?: string;
}

// 主催者情報
export interface Organizer {
  name: string;
  contact: string;
  website?: string;
  email?: string;
  phoneNumber?: string;
  description?: string;
}

// 申込み情報
export interface RegistrationInfo {
  required: boolean;
  method?: string;
  deadline?: Date;
  url?: string;
  instructions?: string;
  capacity?: number;
  remainingSlots?: number;
}

// メディア情報
export interface MediaInfo {
  mainImage?: string;
  gallery?: string[];
  videos?: string[];
  documents?: string[];
  thumbnails?: {
    small: string;
    medium: string;
    large: string;
  };
}

// アクセシビリティ情報
export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  hearingAssistance: boolean;
  visualAssistance: boolean;
  signLanguage: boolean;
  easyAccess: boolean;
  notes?: string;
}

// 天候情報
export interface WeatherInfo {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
}

// ユーザーコンテキスト
export interface UserContext {
  favoriteCategories: EventCategory[];
  preferredLocations: string[];
  budgetRange: [number, number];
  targetAudience: TargetAudience;
  accessMethods: AccessMethod[];
  previousEvents?: string[];
}
```

**メインエンティティ**:
```typescript
// イベント詳細情報（メインエンティティ）
export interface EventDetail {
  // 基本情報
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  
  // 日時情報
  startDateTime: Date;
  endDateTime: Date;
  timezone: string;
  
  // 場所情報
  venue: Venue;
  
  // 主催者情報
  organizer: Organizer;
  
  // 料金情報
  price: PriceInfo;
  
  // 申込み情報
  registration: RegistrationInfo;
  
  // メディア情報
  media: MediaInfo;
  
  // 分類・属性
  tags: string[];
  targetAudience: TargetAudience[];
  accessMethods: AccessMethod[];
  venueType: VenueType;
  
  // アクセシビリティ
  accessibility: AccessibilityInfo;
  
  // メタデータ
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  
  // 統計情報
  views?: number;
  favorites?: number;
  participantCount?: number;
  
  // 関連情報
  relatedEvents?: string[]; // イベントIDの配列
  officialWebsite?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    line?: string;
  };
}
```

**検索・フィルター関連**:
```typescript
// 検索パラメータ
export interface SearchParams {
  // テキスト検索
  query?: string;
  
  // 日時フィルター
  dateRange?: DateRange;
  timeSlots?: TimeSlot[];
  
  // 場所フィルター
  location?: {
    center: Coordinates;
    radius: number; // km
  };
  prefectures?: string[];
  cities?: string[];
  
  // カテゴリ・属性フィルター
  categories?: EventCategory[];
  targetAudience?: TargetAudience[];
  venueTypes?: VenueType[];
  accessMethods?: AccessMethod[];
  
  // 料金フィルター
  priceRange?: {
    min: number;
    max: number;
  };
  freeOnly?: boolean;
  
  // その他フィルター
  tags?: string[];
  hasAccessibility?: boolean;
  hasParkingn?: boolean;
  requiresRegistration?: boolean;
  
  // ソート・ページング
  sortBy?: 'relevance' | 'date' | 'distance' | 'popularity' | 'updated';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// 検索結果
export interface SearchResult {
  events: EventDetail[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  searchTime: number; // ms
  suggestion?: string; // 検索候補
}
```

**推薦関連**:
```typescript
// 推薦リクエスト
export interface RecommendationRequest {
  userId?: string;
  userProfile?: UserContext;
  contextualInfo: {
    currentLocation?: Coordinates;
    currentDateTime: Date;
    weather?: WeatherInfo;
    availableTime?: number; // 分
    transportMode?: AccessMethod;
  };
  excludeEventIds?: string[];
  maxRecommendations?: number;
}

// 推薦レスポンス
export interface RecommendationResponse {
  recommendations: {
    event: EventDetail;
    score: number; // 0-1の推薦スコア
    reason: string;
    confidence: number; // 0-1の信頼度
  }[];
  explanation: string;
  processingTime: number; // ms
  source: 'ai' | 'rule_based' | 'hybrid';
}
```

**通知関連**:
```typescript
// 通知設定
export interface NotificationSettings {
  eventReminders: boolean;
  newEvents: boolean;
  eventUpdates: boolean;
  weatherAlerts: boolean;
  locationBasedNotifications: boolean;
  
  reminderTiming: number[]; // 分前（例: [60, 1440] = 1時間前, 1日前）
  preferredCategories: EventCategory[];
  preferredLocations: string[];
  quietHours?: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
}

// 通知データ
export interface NotificationData {
  id: string;
  type: 'reminder' | 'new_event' | 'update' | 'cancellation' | 'weather';
  title: string;
  body: string;
  eventId?: string;
  scheduledTime?: Date;
  sent: boolean;
  createdAt: Date;
  
  // プッシュ通知用データ
  icon?: string;
  badge?: string;
  tag?: string;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}
```

## 6. ユーザーストーリー

### 6.1 地元住民向けストーリー

#### US001: 家族イベント検索
**As a** 地元の親
**I want** 子供と一緒に楽しめる週末のイベントを地図上で探したい
**So that** 家族の時間を有効活用し、子供に様々な体験をさせることができる

**受け入れ条件**:
- 「ファミリー向け」フィルターでイベントを絞り込める
- 現在地から車で30分圏内のイベントを表示できる
- 子供の年齢に適したイベントを判別できる
- 駐車場の有無を確認できる
- 参加費用を事前に把握できる

#### US002: 当日の急な計画
**As a** 地元住民
**I want** 今日開催されているイベントを現在地周辺で即座に見つけたい
**So that** 急に空いた時間を有効活用できる

**受け入れ条件**:
- 現在地から5km圏内の当日イベントを表示
- 現在時刻以降に開始するイベントのみ表示
- 事前予約不要のイベントを識別できる
- 会場までの所要時間を確認できる

#### US003: 定期イベント管理
**As a** 地元のイベント愛好家
**I want** 興味のあるイベントをお気に入り登録し、定期的に開催されるものを管理したい
**So that** 見逃したくないイベントを確実に参加できる

**受け入れ条件**:
- お気に入りリストでイベントを管理できる
- 定期開催イベントのシリーズを認識できる
- イベント開始前にリマインダー通知を受け取れる
- カレンダーアプリとの連携ができる

### 6.2 観光客向けストーリー

#### US004: 旅行計画での地域発見
**As a** 岩手への観光客
**I want** 滞在期間中に参加できる地域特色のあるイベントを発見したい
**So that** 地元の文化や人々との交流を通じて、より深い旅行体験ができる

**受け入れ条件**:
- 宿泊地を中心とした検索ができる
- 観光客向けのイベントを識別できる
- 地域の伝統的なイベント・祭りを優先表示
- 外国語（英語）対応があるイベントを識別
- 公共交通機関でのアクセス情報を提供

#### US005: 現地での柔軟な予定変更
**As a** 旅行中の観光客
**I want** 天候や予定変更に応じて代替イベントを素早く見つけたい
**So that** 旅行を台無しにすることなく、柔軟に楽しめる

**受け入れ条件**:
- 天候条件（屋内/屋外）でフィルタリング
- 現在地から複数のアクセス方法を提案
- 同じカテゴリの代替イベントを推薦
- 時間変更が可能なイベントを識別

#### US006: 地域情報の共有
**As a** SNSを活用する観光客
**I want** 参加したイベントの情報を友人や家族と簡単にシェアしたい
**So that** 旅行体験を共有し、同じ体験を他の人にも勧めることができる

**受け入れ条件**:
- 主要SNS（Twitter/X、Instagram、LINE）でのシェア
- イベント写真と位置情報を含めたシェア
- QRコードでの情報共有
- 友人への推薦メッセージの自動生成

### 6.3 イベント主催者向けストーリー

#### US007: イベント情報の確認
**As a** イベント主催者
**I want** 自分が主催するイベントの詳細情報と参加状況を確認したい
**So that** イベント運営の質を向上させ、参加者により良い体験を提供できる

**受け入れ条件**:
- イベント詳細ページでの正確な情報表示
- 参加予定者数の表示
- イベントへの反応（お気に入り数、シェア数）の確認
- 類似イベントとの比較情報

#### US008: 競合イベントの分析
**As a** イベント企画者
**I want** 同じ日時・地域で開催される他のイベントを把握したい
**So that** 競合を避けた効果的なイベント企画ができる

**受け入れ条件**:
- 指定日時・エリアでの全イベント表示
- カテゴリ別の競合状況分析
- 参加者層の重複度合いの推測
- 最適な開催時期の提案

### 6.4 AI推薦機能向けストーリー

#### US009: パーソナライズド推薦
**As a** アプリ利用者
**I want** 過去の行動履歴と現在の状況に基づいて、最適なイベントを推薦してもらいたい
**So that** 自分では見つけられなかった興味深いイベントを発見できる

**受け入れ条件**:
- 閲覧・お気に入り履歴の学習
- 現在地・時間・天候を考慮した推薦
- 推薦理由の明確な説明
- 推薦精度の継続的な改善

#### US010: 自然言語での検索
**As a** 検索に慣れていないユーザー
**I want** 「雨の日でも楽しめる屋内イベント」のような自然な文章で検索したい
**So that** 複雑な検索条件を設定することなく、求める情報を得られる

**受け入れ条件**:
- 自然言語クエリの適切な解釈
- 曖昧な条件の自動補完
- 検索意図の理解と関連提案
- 検索結果の説明と追加提案

### 6.5 アクセシビリティ向けストーリー

#### US011: 視覚障害者の利用
**As a** 視覚障害のあるユーザー
**I want** スクリーンリーダーを使ってイベント情報を取得したい
**So that** 健常者と同様にイベントを探索し、参加することができる

**受け入れ条件**:
- 適切なARIA属性の実装
- キーボードのみでの操作対応
- 音声での地図情報説明
- イベント詳細の構造化された読み上げ

#### US012: 高齢者の利用
**As a** 高齢のユーザー
**I want** 大きな文字と簡単な操作でイベント情報を確認したい
**So that** 年齢による制約を感じることなく、地域活動に参加できる

**受け入れ条件**:
- 文字サイズの調整機能
- 高コントラスト表示オプション
- シンプルな操作フロー
- 音声ガイダンスの提供

### 6.6 技術的ストーリー

#### US013: オフライン環境での利用
**As a** 電波の弱い地域にいるユーザー
**I want** 一度読み込んだイベント情報をオフラインでも確認したい
**So that** 通信状況に左右されることなく、必要な情報にアクセスできる

**受け入れ条件**:
- 重要なイベント情報のローカル保存
- オフライン状態の明確な表示
- オンライン復帰時の自動同期
- オフラインでも地図の基本機能が利用可能

#### US014: 高速な検索体験
**As a** せっかちなユーザー
**I want** 検索結果が瞬時に表示されることを期待する
**So that** ストレスなく効率的にイベント情報を探索できる

**受け入れ条件**:
- 2秒以内の検索結果表示
- 入力中のリアルタイム検索候補
- 検索結果の段階的読み込み
- ローディング状態の視覚的フィードバック

## 7. 受け入れ条件

### 7.1 機能別受け入れ条件（Given-When-Then形式）

#### 7.1.1 地図表示機能

**AC001: 基本地図表示**
```gherkin
Given ユーザーがアプリケーションを開いた時
When ページが読み込まれた時
Then 岩手県を中心とした地図が表示される
And 地図の初期ズームレベルは9である
And 地図操作（ズーム、パン）が正常に動作する
And 地図の読み込みが2秒以内に完了する
```

**AC002: 現在地機能**
```gherkin
Given ユーザーが位置情報の使用を許可している時
When 現在地ボタンをクリックした時
Then 現在地に地図が移動する
And 現在地マーカーが青色で表示される
And 位置の精度円が表示される

Given ユーザーが位置情報の使用を拒否している時
When 現在地ボタンをクリックした時
Then 位置情報許可の再要求ダイアログが表示される
And 代替手段（住所入力）が提案される
```

**AC003: イベントマーカー表示**
```gherkin
Given 地図上にイベントが存在する時
When 地図が表示された時
Then 各イベントがカテゴリ別の色でマーカー表示される
And マーカーをクリックするとポップアップが表示される
And ポップアップにイベントの基本情報が含まれる
And 近接するマーカーは適切にクラスタリングされる
```

#### 7.1.2 検索・フィルタリング機能

**AC004: テキスト検索**
```gherkin
Given 検索バーが表示されている時
When ユーザーが「桜祭り」と入力した時
Then 「桜祭り」を含むイベントがフィルタリングされる
And 検索結果が2秒以内に表示される
And 検索にマッチしない場合は「結果なし」メッセージが表示される
And 代替検索候補が提案される
```

**AC005: カテゴリフィルター**
```gherkin
Given イベントリストが表示されている時
When ユーザーが「祭り」カテゴリを選択した時
Then 祭りカテゴリのイベントのみが表示される
And フィルター状態が視覚的に明確に示される
And 「フィルタークリア」ボタンが表示される

Given 複数のカテゴリが選択されている時
When ユーザーが新しいカテゴリを追加選択した時
Then OR条件で結果がフィルタリングされる
And 選択されたカテゴリがすべて表示される
```

**AC006: 日付フィルター**
```gherkin
Given 日付フィルターが表示されている時
When ユーザーが開始日を「2024年4月1日」、終了日を「2024年4月30日」に設定した時
Then 指定期間内のイベントのみが表示される
And 期間外のイベントは非表示になる
And フィルター適用状態が明確に表示される

Given 不正な日付範囲が入力された時
When 開始日が終了日より後の日付の時
Then エラーメッセージが表示される
And 正しい日付入力の案内が表示される
```

#### 7.1.3 イベント詳細表示機能

**AC007: イベント詳細ページ**
```gherkin
Given イベントリストが表示されている時
When ユーザーがイベントカードをクリックした時
Then イベント詳細ページが表示される
And 必要な情報（日時、場所、料金、説明等）がすべて表示される
And メイン画像が適切なサイズで表示される
And 戻るボタンが正常に動作する
```

**AC008: イベント共有機能**
```gherkin
Given イベント詳細ページが表示されている時
When ユーザーが共有ボタンをクリックした時
Then 共有オプション（Twitter/X、LINE、URLコピー等）が表示される
And 各共有方法が正常に動作する
And 共有テキストにイベント名と日時が含まれる

Given モバイルデバイスでWeb Share APIが利用可能な時
When 共有ボタンをクリックした時
Then ネイティブ共有ダイアログが表示される
And システム標準の共有オプションが利用できる
```

#### 7.1.4 AI推薦機能

**AC009: 基本推薦機能**
```gherkin
Given ユーザーがアプリを利用している時
When 推薦ページを表示した時
Then 3-5個のイベントが推薦される
And 各推薦に理由が明記される
And 推薦結果が5秒以内に表示される

Given ユーザーの利用履歴がある時
When 推薦を要求した時
Then 過去の行動に基づいた個人化された推薦が提供される
And 既に見たイベントは除外される
```

**AC010: 自然言語検索**
```gherkin
Given 検索バーが表示されている時
When ユーザーが「今度の休みに子供と楽しめるイベント」と入力した時
Then 自然言語が解析される
And 家族向けかつ直近の週末のイベントが推薦される
And AI解釈結果の説明が表示される

Given 曖昧な検索クエリが入力された時
When 「楽しいイベント」と検索した時
Then 追加の質問や候補が提示される
And ユーザーが条件を絞り込めるように支援される
```

#### 7.1.5 お気に入り・ブックマーク機能

**AC011: お気に入り登録**
```gherkin
Given イベントカードまたは詳細ページが表示されている時
When ユーザーがお気に入りボタンをクリックした時
Then イベントがお気に入りリストに追加される
And ボタンの表示状態が変更される
And ブラウザのローカルストレージに保存される

Given イベントが既にお気に入り登録されている時
When ユーザーがお気に入りボタンをクリックした時
Then イベントがお気に入りリストから削除される
And 削除確認ダイアログが表示される
```

**AC012: お気に入り一覧表示**
```gherkin
Given ユーザーがお気に入りイベントを登録している時
When お気に入りページを表示した時
Then 登録されたすべてのイベントが表示される
And 開催日順でソートされて表示される
And 終了済みイベントは別セクションに表示される

Given お気に入りリストが空の時
When お気に入りページを表示した時
Then 「お気に入りがありません」メッセージが表示される
And 人気イベントの提案が表示される
```

#### 7.1.6 PWA機能

**AC013: オフライン対応**
```gherkin
Given ユーザーが事前にアプリを使用している時
When インターネット接続が切断された時
Then 基本的な機能が継続して利用できる
And オフライン状態が明確に表示される
And キャッシュされたデータが表示される

Given オフライン状態からオンラインに復帰した時
When インターネット接続が回復した時
Then 自動的にデータが更新される
And 更新完了の通知が表示される
```

**AC014: プッシュ通知**
```gherkin
Given ユーザーが通知許可を与えている時
When イベント開始1時間前になった時
Then プッシュ通知が送信される
And 通知にイベント名と開始時間が含まれる
And 通知をタップするとイベント詳細ページが開く

Given ユーザーが通知設定を変更した時
When 通知タイミングを変更した時
Then 次回から新しい設定で通知が送信される
And 設定変更が即座に反映される
```

#### 7.1.7 レスポンシブデザイン

**AC015: モバイル対応**
```gherkin
Given スマートフォンでアプリにアクセスした時
When 画面幅が768px以下の時
Then モバイル最適化されたレイアウトが表示される
And タッチ操作に適したボタンサイズ（最小44px）になる
And 片手操作しやすいナビゲーションが表示される

Given タブレットでアプリにアクセスした時
When 画面幅が769px-1024pxの時
Then 2カラムレイアウトが表示される
And 地図とリストが並んで表示される
```

#### 7.1.8 アクセシビリティ

**AC016: キーボード操作**
```gherkin
Given ユーザーがキーボードのみで操作している時
When Tabキーで要素を移動した時
Then すべての操作可能要素にフォーカスが当たる
And フォーカス状態が視覚的に明確に示される
And EnterまたはSpaceキーで要素が活性化される

Given スクリーンリーダーが使用されている時
When ページが読み込まれた時
Then 適切な見出し構造で読み上げられる
And 画像には適切な代替テキストが設定されている
And フォーム要素には適切なラベルが付与されている
```

**AC017: 色覚対応**
```gherkin
Given 色覚に制限のあるユーザーがアプリを使用している時
When カテゴリ別のマーカーが表示された時
Then 色だけでなくアイコンや形状でも区別できる
And 十分なコントラスト比（4.5:1以上）が確保されている
And 色覚シミュレーションツールでの確認が完了している
```

#### 7.1.9 パフォーマンス

**AC018: 読み込み速度**
```gherkin
Given ユーザーが初回アクセスした時
When アプリケーションを読み込んだ時
Then 3秒以内にファーストビューが表示される
And 5秒以内にインタラクション可能になる
And プログレスインジケーターが適切に表示される

Given ユーザーがページ間を移動した時
When 新しいページに遷移した時
Then 1秒以内にページが表示される
And ローディング状態が適切に表示される
```

**AC019: 大量データ処理**
```gherkin
Given 1000件以上のイベントデータが存在する時
When 検索やフィルタリングを実行した時
Then 2秒以内に結果が表示される
And UIの反応が遅延しない
And メモリ使用量が適切に管理される

Given 地図上に100個以上のマーカーが存在する時
When 地図を表示した時
Then クラスタリング機能により適切に表示される
And 地図操作が滑らかに動作する
```

### 7.2 非機能要件の受け入れ条件

#### 7.2.1 セキュリティ

**AC020: API セキュリティ**
```gherkin
Given Gemini APIキーが設定されている時
When APIリクエストが送信された時
Then APIキーが安全に管理されている
And リクエストレート制限が適用されている
And 不正なリクエストが適切に拒否される
```

**AC021: データ保護**
```gherkin
Given ユーザーがローカルデータを保存している時
When ブラウザを閉じて再度開いた時
Then 保存されたデータが適切に暗号化されている
And 個人情報の収集が最小限に抑えられている
And GDPR準拠の対応が実装されている
```

#### 7.2.2 互換性

**AC022: ブラウザ対応**
```gherkin
Given 主要ブラウザでアクセスした時
When Chrome、Firefox、Safari、Edgeで表示した時
Then 同等の機能が提供される
And デザインの大きな差異がない
And ES6+機能が適切にポリフィルされている
```

**AC023: デバイス対応**
```gherkin
Given 様々なデバイスでアクセスした時
When iPhone、Android、iPad、PC各環境で使用した時
Then 各デバイスに最適化されたUXが提供される
And タッチ操作とマウス操作の両方に対応している
And 画面回転時にレイアウトが適切に調整される
```

### 7.3 品質保証の受け入れ条件

#### 7.3.1 テスト要件

**AC024: 自動テスト**
```gherkin
Given 開発チームがコードを変更した時
When CI/CDパイプラインが実行された時
Then 単体テストが90%以上のカバレッジを維持する
And 統合テストがすべて成功する
And E2Eテストが主要ユーザーフローをカバーしている
```

**AC025: 手動テスト**
```gherkin
Given 新機能がリリースされる時
When ユーザビリティテストを実施した時
Then 5人中4人以上がタスクを完了できる
And 重大な使いやすさの問題が発見されない
And アクセシビリティチェックが完了している
```

#### 7.3.2 監視・メンテナンス

**AC026: エラー監視**
```gherkin
Given アプリケーションが本番環境で動作している時
When エラーが発生した時
Then エラー情報が適切にログ出力される
And 重要なエラーについてはアラートが送信される
And ユーザーに分かりやすいエラーメッセージが表示される
```

**AC027: パフォーマンス監視**
```gherkin
Given アプリケーションが稼働している時
When パフォーマンスメトリクスを測定した時
Then Core Web Vitalsが目標値を満たしている
And APIレスポンス時間が2秒以内である
And リソース使用量が適切な範囲内である
```

---

この要件定義書は、岩手イベントナビゲーターの開発・運用における包括的なガイドラインとして機能し、実装者が迷うことなく開発を進められるレベルまで詳細化されています。各項目は相互に関連しており、システム全体として一貫性のある高品質なアプリケーション開発を支援します。