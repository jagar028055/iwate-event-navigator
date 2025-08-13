# 岩手イベントナビゲーター デプロイ手順書

## 📋 概要

本ドキュメントは、岩手イベントナビゲーターをGitHub Pagesにデプロイするための詳細な手順を説明します。

### 🎯 デプロイ対象
- **アプリケーション**: 岩手イベントナビゲーター
- **技術スタック**: React + TypeScript + Vite
- **デプロイ先**: GitHub Pages
- **CI/CD**: GitHub Actions

## 🚀 デプロイ手順

### Step 1: 事前準備

#### 1.1 リポジトリ確認
```bash
# 現在のリポジトリ状態確認
git status
git remote -v

# 想定される出力:
# origin	https://github.com/jagar028055/iwate-event-navigator.git (fetch)
# origin	https://github.com/jagar028055/iwate-event-navigator.git (push)
```

#### 1.2 ローカル動作確認
```bash
# 依存関係インストール
npm install

# 開発サーバー起動（動作確認）
npm run dev
# → http://localhost:5174 でアクセス確認

# プロダクションビルド
npm run build
# → dist/ フォルダが生成されることを確認

# プロダクションプレビュー
npm run preview
# → ビルド後のアプリケーション動作確認
```

#### 1.3 環境変数設定
```bash
# GitHub リポジトリのSettings → Secrets and variables → Actions
# 以下のシークレットを追加:

GEMINI_API_KEY: [Google Gemini API キー]
```

### Step 2: GitHub Pages設定

#### 2.1 GitHub Pages有効化
1. GitHubリポジトリ → **Settings** タブ
2. 左サイドバー → **Pages**
3. **Source** → **GitHub Actions** を選択
4. **Enforce HTTPS** をチェック
5. **Save** をクリック

#### 2.2 ワークフロー確認
既に設定済みのファイルを確認:
```bash
# GitHub Actions ワークフローファイル確認
cat .github/workflows/deploy.yml
```

### Step 3: デプロイ実行

#### 3.1 変更をプッシュ
```bash
# 全ての変更をステージング
git add .

# コミット
git commit -m "feat: GitHub Pages deployment setup

- Add GitHub Actions workflow for automated deployment
- Configure Vite for GitHub Pages base path
- Add 404.html for SPA routing support
- Update deployment documentation

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# リモートリポジトリにプッシュ
git push origin main
```

#### 3.2 デプロイ監視
1. GitHub リポジトリ → **Actions** タブ
2. 実行中のワークフロー確認
3. ビルドログの監視
4. エラーがあれば対応

### Step 4: デプロイ確認

#### 4.1 基本アクセス確認
```bash
# デプロイ完了後のアクセスURL
https://jagar028055.github.io/iwate-event-navigator/
```

#### 4.2 機能動作確認チェックリスト
- [ ] アプリケーションが正常に読み込まれる
- [ ] ヘッダーが正しく表示される
- [ ] サイドバーが表示され、フィルタが動作する
- [ ] 地図が正しく表示される
- [ ] イベント更新ボタンが動作する
- [ ] イベント詳細モーダルが動作する
- [ ] レスポンシブデザインが動作する（モバイル確認）

#### 4.3 ブラウザ互換性確認
- [ ] **Chrome**: 最新版での動作確認
- [ ] **Firefox**: 最新版での動作確認  
- [ ] **Safari**: 最新版での動作確認
- [ ] **Edge**: 最新版での動作確認
- [ ] **Mobile Safari**: iOS最新版
- [ ] **Mobile Chrome**: Android最新版

### Step 5: パフォーマンス確認

#### 5.1 Core Web Vitalsチェック
```bash
# Chrome DevToolsのLighthouseを使用
# または以下のオンラインツールを使用:
# - PageSpeed Insights: https://pagespeed.web.dev/
# - GTmetrix: https://gtmetrix.com/
```

**目標値:**
- First Contentful Paint: < 1.5秒
- Largest Contentful Paint: < 2.5秒
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

#### 5.2 バンドルサイズ確認
```bash
# ビルド時に表示されるバンドル情報確認
npm run build

# 期待されるサイズ:
# - 総バンドルサイズ: < 1MB (gzipped)
# - 初期ロードバンドル: < 500KB (gzipped)
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. ビルドエラー
```bash
# エラー例: "Module not found"
# 解決: 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. GitHub Actions失敗
```bash
# ログ確認場所:
# GitHub → Actions → 失敗したワークフロー → ログ確認

# よくある原因:
# - Node.jsバージョン不整合
# - 環境変数の設定ミス
# - 権限の問題
```

#### 3. 404エラー（ページが見つからない）
```bash
# 原因: GitHub Pagesの設定問題
# 解決手順:
# 1. Settings → Pages → Source が "GitHub Actions" になっているか確認
# 2. base URLが正しく設定されているか確認 (vite.config.ts)
# 3. 404.htmlが正しく配置されているか確認
```

#### 4. 地図が表示されない
```bash
# 原因: Leaflet CSSの読み込み問題
# 解決: index.htmlでLeaflet CSSが正しく読み込まれているか確認
# または、HTTPS環境でのMixed Content問題
```

#### 5. API機能が動作しない
```bash
# 原因: 環境変数の設定問題
# 解決:
# 1. GitHub Secrets で GEMINI_API_KEY が設定されているか確認
# 2. vite.config.ts で環境変数が正しく注入されているか確認
# 3. API使用量制限に達していないか確認
```

### 緊急時のロールバック

#### 即座のロールバック
```bash
# 前の動作していたコミットに戻す
git log --oneline  # 動作していたコミットハッシュを確認
git revert [commit-hash]  # 該当コミットをリバート
git push origin main  # 自動的に再デプロイされる
```

#### 手動でのPages無効化
1. GitHub → Settings → Pages
2. Source を "None" に設定
3. 一時的にサイトを停止

## 📊 継続的監視

### 定期チェック項目（週次）
- [ ] デプロイメント成功率の確認
- [ ] パフォーマンス指標の確認
- [ ] 依存関係の脆弱性チェック
- [ ] APIクォータ使用量確認

### 月次メンテナンス
- [ ] 依存関係のアップデート検討
- [ ] セキュリティパッチの適用
- [ ] パフォーマンス最適化の検討
- [ ] ユーザーフィードバックの分析

### 自動監視設定（推奨）
```yaml
# .github/workflows/health-check.yml
# 定期的なヘルスチェック用ワークフロー
name: Health Check
on:
  schedule:
    - cron: '0 6 * * *'  # 毎日6時に実行
```

## 🔐 セキュリティ考慮事項

### 本番環境でのセキュリティチェック
- [ ] HTTPS通信が強制されている
- [ ] APIキーが適切に管理されている
- [ ] CSP（Content Security Policy）が設定されている
- [ ] 不要な開発用機能が無効化されている

### 定期セキュリティ監査
```bash
# npm audit での脆弱性チェック
npm audit

# 高・中レベルの脆弱性がある場合
npm audit fix
```

## 📞 サポート・連絡先

### 技術的問題
- **担当者**: 技術チーム
- **連絡方法**: GitHub Issues作成
- **緊急時**: [緊急連絡先]

### 運用問題  
- **担当者**: DevOpsチーム
- **監視ダッシュボード**: [監視URL]
- **アラート通知**: [Slack/Teams チャンネル]

## 📋 チェックリスト

### デプロイ前チェック
- [ ] ローカルでの動作確認完了
- [ ] ビルドエラーなし
- [ ] テスト実行成功
- [ ] 環境変数設定確認
- [ ] ドキュメント更新

### デプロイ後チェック
- [ ] GitHub Actionsワークフロー成功
- [ ] 本番サイトアクセス確認
- [ ] 全機能動作確認
- [ ] パフォーマンス要件確認
- [ ] ブラウザ互換性確認

---

**作成日**: 2024年8月13日  
**作成者**: DevOpsチーム  
**最終更新**: 2024年8月13日  
**バージョン**: 1.0

**🚀 GitHub Pages URL**: https://jagar028055.github.io/iwate-event-navigator/

**📝 注意**: 初回デプロイ後、反映まで最大10分程度かかる場合があります。