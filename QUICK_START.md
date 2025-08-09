# 🚀 岩手イベントナビゲーター - クイックスタートガイド

## 📋 次回セッション用 - 即座に開始できる実行ガイド

### 🔥 最優先タスク (5分で開始可能)

```bash
# 1. プロジェクトディレクトリに移動
cd /data/data/com.termux/files/home/iwate-event-navigator

# 2. 依存関係インストール
npm install

# 3. 環境変数設定 (⚠️ 実際のAPIキーが必要)
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env.local

# 4. 開発サーバー起動
npm run dev
```

### 🎯 成功判定
✅ **成功条件**: ブラウザで http://localhost:5173 にアクセスして岩手イベントナビゲーターが表示される

---

## 📖 詳細手順

詳細な手順については [`ENVIRONMENT_SETUP.md`](./ENVIRONMENT_SETUP.md) を参照してください。

### 🚨 重要な注意事項

1. **Gemini APIキーが必須**
   - Google AI Studioから取得: https://aistudio.google.com/
   - `.env.local` に設定が必要

2. **依存関係の状態**
   - 現在全ての依存関係が未インストール
   - `npm install` が正常完了すれば基本動作可能

3. **ブランチ確認**
   - 現在: `from-oppo` ブランチ
   - 必要に応じて適切なブランチに切り替え

---

## 🛠️ トラブルシューティング（よくある問題）

### 問題1: `npm install` でエラー
```bash
# 解決方法
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 問題2: 開発サーバーが起動しない
```bash
# ポート確認
lsof -ti:5173 | xargs kill -9  # ポートを強制終了
npm run dev
```

### 問題3: 地図が表示されない
- Leaflet CSSのインポート確認
- インターネット接続確認（OpenStreetMap）

### 問題4: APIエラー
- `.env.local` ファイルの存在確認
- APIキーの有効性確認

---

## 📊 進捗確認チェックリスト

### Phase 1A: 基本セットアップ (30分)
- [ ] `npm install` 成功
- [ ] `.env.local` 作成・設定
- [ ] `npm run dev` 起動成功
- [ ] ブラウザ表示確認

### Phase 1B: 機能確認 (15分)
- [ ] 地図（Leaflet）表示
- [ ] サイドバー表示
- [ ] 「イベント更新」ボタン動作
- [ ] エラーハンドリング確認

### Phase 1C: 開発環境整備 (30分)
- [ ] Tailwind CSS設定
- [ ] TypeScript エラー0個
- [ ] ESLint/Prettier設定
- [ ] `npm run build` 成功

---

## 🔄 セッション開始時の確認コマンド

```bash
# 現在の状況確認
pwd                    # プロジェクトディレクトリ確認
git status            # Gitブランチ・変更状況
npm list --depth=0    # 依存関係インストール状況
ls -la .env.local     # 環境変数ファイル存在確認

# 基本動作確認
npm run dev           # 開発サーバー起動
# → ブラウザで http://localhost:5173 アクセス
```

---

## 📞 サポート情報

### 参考ドキュメント
- [環境設定要件定義書](./ENVIRONMENT_SETUP.md) - 詳細手順
- [README.md](./README.md) - プロジェクト概要
- [package.json](./package.json) - 依存関係

### 主要コンポーネント
- `App.tsx` - メインアプリケーション
- `services/geminiService.ts` - API接続
- `components/` - UI コンポーネント
- `vite.config.ts` - ビルド設定

---

*最終更新: 2025-08-09*  
*次回セッションですぐに作業を開始できるように準備済み* ✅