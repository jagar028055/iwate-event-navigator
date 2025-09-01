# 盛岡市スコープ PoC セットアップと実装サマリ

## 目的
- 盛岡市にスコープを限定して、一次情報（公式/RSS/API/観光協会）中心でPoCを短期稼働。
- LLM依存を最小化、品質ゲート到達を優先。

## 変更点（実装サマリ）
- `.env.local`: `VITE_CITY_SCOPE=morioka` を追加（ブラウザで盛岡スコープ有効化）
- `services/hybridETLService.ts`:
  - City Scope読込（`import.meta.env.VITE_CITY_SCOPE` と `process.env.CITY_SCOPE` 両対応）
  - `regions=[KENOU]`（盛岡スコープ時）、収集後に盛岡フィルタ（タイトル/場所/市公式ドメイン/緯度経度）適用
  - ソース登録の見直し（Connpass/Doorkeeperを「盛岡」で絞り、`いわての旅` は一旦無効化、盛岡市公式/盛岡観光(Odette)を追加）
- `services/eventCollector/config/sources.yaml`:
  - 追加: `morioka_event_calendar`, `morioka_festival_event`, `odette_morioka`
  - `connpass_iwate`/`doorkeeper_iwate` の `keywords` を「盛岡」に、`iwate_tabi` は `enabled: false`
  - スキーマ検証は `npm run validate:sources` 合格
- `hooks/useEventFilters.ts`: City Scope が `morioka` のとき `activeArea` 初期値を `kenou` に
- `App.tsx`: ヘッダーに「盛岡市のみ表示中」バッジを表示
- `components/MapPanel.tsx`: `VITE_CITY_SCOPE=morioka` の場合、地図中心・ズーム・`maxBounds` を盛岡市に固定
- 手動イベントモード: `services/manualEventService.ts` と `data/manual-events.json` を追加。初期リリースは手動でも可
- Node互換・停止回避:
  - `services/httpClient.ts`: Node検出・タイムアウト・失敗時モック・強制モックフラグ（`FORCE_MOCK_FETCH`/`VITE_FORCE_MOCK`）追加
  - `services/eventCollector/cache/EventCache.ts`: `localStorage`/`indexedDB` 非対応環境（Node）で自動スキップ
  - `services/eventCollector/adapters/HTMLAdapter.ts`: Nodeでは `linkedom` でHTML解析
  - `package.json`: 依存追加 `linkedom`
  - `test-hybrid-etl.js`: Nodeテスト用に環境フラグをスクリプト先頭で設定（盛岡スコープ・強制モック・短タイムアウト）

## 含めた盛岡向け情報源（抜粋）
- 盛岡市イベントカレンダー（市公式）: `https://www.city.morioka.iwate.jp/event_calendar.html`（html_scraping）
- 盛岡市 まつり・イベント（市公式）: `https://www.city.morioka.iwate.jp/kankou/kankou/1037105/index.html`（html_scraping）
- 盛岡観光情報（Odette）: `https://www.odette.or.jp/?page_id=264`（html_scraping）
- 岩手県民会館: `https://www.iwate-kenmin.jp/events/`（html_scraping）
- Connpass（盛岡キーワード）: `https://connpass.com/api/v1/event/?keyword=盛岡&count=100`（rest_api）
- Doorkeeper（盛岡キーワード）: `https://api.doorkeeper.jp/events?q=盛岡&locale=ja&sort=starts_at`（rest_api）

## 実行方法（用途別）
- ブラウザでPoC（推奨・実ネットワーク）
  1) `npm run dev`
  2) ブラウザのコンソールで `window.testHybridETL()` 実行（件数/サンプル/統計を出力）
  3) UIの「イベント更新」でも取得可能。ヘッダーに「盛岡市のみ表示中」バッジが出ればスコープ有効
- Nodeで高速PoC（モックで安定動作）
  - `npm run -s test:hybrid-etl`（モックが強制され、速く完了）
  - 実ネットワーク検証したい場合は `FORCE_MOCK_FETCH=0 npm run -s test:hybrid-etl`（環境により不安定）
- スキーマ検証
  - `npm run validate:sources`

### 手動イベントモード（初期リリース向け）
- 即時にリリースしたい場合は以下いずれかを設定
  - `.env.local` に `VITE_MANUAL_EVENTS_ONLY=1` を追加（推奨）
  - もしくは `VITE_EVENTS_MODE=manual`
- 画面の「イベント更新」で `data/manual-events.json` の内容を表示
- 自動収集が安定したらフラグを外せば切り替わります

## チューニングの勘所（次ステップ）
- 抽出精度: サイトごとに `sources.yaml` の `selectors`/`fetchConfig.parseRules` を追加してDOMに最適化
- KPI監視: 重複率/鮮度/地理特定率を1週間計測し、しきい値調整
- スナップショット/RunLog（Nodeのみ）: `services/eventCollector/utils/persistence.ts` に基づき `var/snapshots/` / `var/runlogs/` に保存

## トラブルシュート
- `npm run -s test:hybrid-etl` が止まる/遅い
  - Node環境でのネットワーク差やHTML解析が原因になりえます。`FORCE_MOCK_FETCH=1`（既定）でモックに切替、またはブラウザで実行
- UIにイベントが出ない
  - `.env.local` に `VITE_CITY_SCOPE=morioka` があるか確認
  - ブラウザのコンソールで `window.testHybridETL()` または `window.showSystemStats()` を確認

## 主要ファイル
- `.env.local`
- `services/hybridETLService.ts`
- `services/eventCollector/config/sources.yaml`
- `hooks/useEventFilters.ts`
- `App.tsx`
- `services/httpClient.ts`
- `services/eventCollector/cache/EventCache.ts`
- `services/eventCollector/adapters/HTMLAdapter.ts`
- `package.json`
- `test-hybrid-etl.js`

---
このままブラウザでPoCを回し、必要に応じて `sources.yaml` にセレクタを追加して精度を上げてください。品質ゲート/KPIのしきい値調整は1週間の実測後に更新するのが推奨です。
