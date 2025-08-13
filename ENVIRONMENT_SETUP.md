# 岩手イベントナビゲーター - 環境設定要件定義書

## 🔍 現在の環境状態分析

### ✅ 確認済み環境
- **Node.js**: v24.5.0 ✅
- **npm**: v11.5.1 ✅  
- **Git**: 設定済み、from-oppoブランチで作業中 ✅
- **基本ファイル構成**: 完了 ✅

### ❌ 不足している要素
- **依存関係**: 全ての依存関係が未インストール (UNMET DEPENDENCY)
- **環境変数**: .env.local ファイルが存在しない
- **開発ツール**: ESLint, Prettier, Tailwind CSS未設定
- **型定義**: @types/leaflet など不足

---

## 📋 環境設定要件定義

### REQ-001: Node.js依存関係管理
**優先度**: 🔴 CRITICAL  
**目的**: アプリケーションの実行に必要なパッケージをインストール  
**成功条件**: `npm install` が正常に完了し、全ての依存関係が解決される

### REQ-002: 環境変数設定
**優先度**: 🔴 CRITICAL  
**目的**: Gemini API接続のための認証情報設定  
**成功条件**: `.env.local` が作成され、APIキーが正しく読み込まれる

### REQ-003: 開発サーバー起動
**優先度**: 🔴 CRITICAL  
**目的**: ローカル開発環境でアプリケーションが動作する  
**成功条件**: `npm run dev` でサーバーが起動し、ブラウザでアクセス可能

### REQ-004: TypeScript型定義
**優先度**: 🟡 HIGH  
**目的**: TypeScriptコンパイルエラーの解決  
**成功条件**: `tsc --noEmit` でエラーが0個

### REQ-005: CSS/スタイリング環境
**優先度**: 🟡 HIGH  
**目的**: Tailwind CSSとLeaflet CSSの正常な読み込み  
**成功条件**: UIが設計通りに表示される

### REQ-006: コード品質管理
**優先度**: 🟠 MEDIUM  
**目的**: 一貫したコード品質を保つ  
**成功条件**: ESLint、Prettierが動作し、設定通りにチェック/フォーマットされる

---

## 📝 実行チェックリスト - Phase 1 環境設定

### 🔧 Task Group A: 依存関係インストール (所要時間: 15分)

#### A-1: 基本パッケージインストール
```bash
npm install
```

**チェックポイント**:
- [ ] エラーが発生しないことを確認
- [ ] `node_modules/` ディレクトリが作成される
- [ ] `package-lock.json` が生成される

#### A-2: 開発依存関係追加
```bash
npm install --save-dev @types/leaflet @types/react @types/react-dom
```

**チェックポイント**:
- [ ] TypeScript型定義がインストールされる
- [ ] `npm list --depth=0` で依存関係を確認

#### A-3: 追加開発ツール
```bash
npm install -D tailwindcss postcss autoprefixer
npm install --save-dev eslint prettier
```

**検証コマンド**:
```bash
npm list --depth=0 | grep -E "(react|typescript|vite|tailwind|eslint)"
```

---

### 🌐 Task Group B: 環境変数設定 (所要時間: 10分)

#### B-1: 環境ファイル作成
```bash
touch .env.local
echo "GEMINI_API_KEY=your_actual_api_key_here" >> .env.local
```

**⚠️ 重要**: `your_actual_api_key_here` を実際のGoogle Gemini APIキーに置き換えてください

**チェックポイント**:
- [ ] `.env.local` ファイルが作成される
- [ ] APIキーが設定される
- [ ] ファイルパーミッションが適切（600）

#### B-2: 環境変数読み込み確認
```bash
# 設定確認（APIキーの最初の文字のみ表示）
echo "API Key format check: $(head -1 .env.local | cut -c1-15)"
```

**チェックポイント**:
- [ ] vite.config.tsの設定を確認
- [ ] 開発サーバーでAPIキーが読み込まれることを確認

---

### 🎨 Task Group C: CSS/スタイリング設定 (所要時間: 20分)

#### C-1: Tailwind CSS初期化
```bash
npx tailwindcss init -p
```

**チェックポイント**:
- [ ] `tailwind.config.js` が作成される
- [ ] PostCSS設定が生成される

#### C-2: Tailwind設定カスタマイズ

**tailwind.config.js を更新**:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**index.css または src/index.css に追加**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Leaflet CSS */
@import 'leaflet/dist/leaflet.css';
```

**チェックポイント**:
- [ ] content pathが設定される
- [ ] @tailwind directivesが追加される
- [ ] Leaflet CSSがインポートされる

---

### ⚙️ Task Group D: 開発サーバー起動確認 (所要時間: 15分)

#### D-1: サーバー起動テスト
```bash
npm run dev
```

**チェックポイント**:
- [ ] サーバーが起動（通常 http://localhost:5173）
- [ ] エラーメッセージが0個
- [ ] Hot Module Replacementが動作

#### D-2: 基本機能動作確認
**ブラウザで http://localhost:5173 にアクセス**

**チェックポイント**:
- [ ] メインページがロードされる
- [ ] 地図（Leaflet）が表示される
- [ ] サイドバーが正常に表示される
- [ ] 「岩手イベントナビゲーター」ヘッダーが表示

#### D-3: API接続テスト
**チェックポイント**:
- [ ] 「イベント更新」ボタンをクリック
- [ ] Gemini APIへの接続を試行
- [ ] データ取得またはエラーハンドリングが動作
- [ ] コンソールエラーが適切に表示

---

### 🔍 Task Group E: TypeScript・型定義確認 (所要時間: 10分)

#### E-1: TypeScriptコンパイル確認
```bash
npx tsc --noEmit
npm run build
```

**チェックポイント**:
- [ ] `npx tsc --noEmit` でエラー0個
- [ ] `npm run build` が成功する
- [ ] 型エラーがコンソールに表示されない

#### E-2: 型定義修正（必要に応じて）
**主な修正項目**:
- Leaflet型定義のインポート確認
- React 19対応の型修正
- process.env型定義の追加

---

### 📋 Task Group F: 開発ツール設定 (所要時間: 25分)

#### F-1: ESLint設定

**.eslintrc.json 作成**:
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

#### F-2: Prettier設定

**.prettierrc 作成**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

#### F-3: package.json スクリプト拡張
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 🎯 最終検証チェックリスト

### ✅ 必須動作確認
- [ ] **起動**: `npm run dev` → サーバー起動成功
- [ ] **表示**: ブラウザ表示 → UIコンポーネント正常
- [ ] **地図**: Leaflet地図表示 → マーカー・ズーム動作
- [ ] **API**: イベント更新 → データ取得またはエラー表示
- [ ] **ビルド**: `npm run build` → 成功

### ✅ コード品質確認
- [ ] **型安全性**: `npx tsc --noEmit` → エラー0個
- [ ] **コードスタイル**: `npm run lint` → エラー0個
- [ ] **フォーマット**: `npm run format` → 正常動作
- [ ] **レスポンシブ**: モバイル・デスクトップ両対応

---

## 📊 実行優先度とタイムライン

### ⚡ Phase 1A (最優先 - 30分以内)
1. **A-1**: 基本パッケージインストール
2. **B-1**: 環境変数設定  
3. **D-1**: サーバー起動テスト

### 🔥 Phase 1B (高優先 - 45分以内)
4. **C-1~C-3**: CSS/スタイリング設定
5. **D-2~D-3**: 基本機能・API動作確認
6. **E-1**: TypeScript確認

### ⭐ Phase 1C (推奨 - 60分以内)
7. **F-1~F-3**: 開発ツール設定
8. **最終検証**: 全項目チェック

---

## 🔧 トラブルシューティング

### 依存関係エラー
```bash
# キャッシュクリア
npm cache clean --force
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### API接続エラー
- `.env.local` ファイルの存在確認
- APIキーの形式確認
- ネットワーク接続確認
- vite.config.ts の環境変数設定確認

### 型エラー
- 型定義パッケージのインストール確認
- tsconfig.json の設定確認
- import/export文の確認

### CSS表示問題
- Tailwind CSS設定の確認
- インポート順序の確認
- PostCSS設定の確認

---

## 🚀 次のステップ

Phase 1完了後は以下のフェーズに進みます：

1. **Phase 2**: UI/UX完成・スタイリング
2. **Phase 3**: 機能拡張・データ強化  
3. **Phase 4**: パフォーマンス・テスト
4. **Phase 5**: デプロイメント・運用準備

各フェーズの詳細な要件定義は別途作成予定です。

---

*作成日: 2025-08-09*  
*プロジェクト: 岩手イベントナビゲーター*  
*バージョン: 1.0*