# 🛡️ デプロイ時品質チェックシステム

## 概要

「デプロイ成功 = Webページ完全動作」を保証するため、GitHub ActionsにPlaywrightを使用したE2Eテストを組み込み、品質ゲートシステムを構築しました。

```
コミット → ビルド → テスト → 品質判定 → デプロイ
                      ↓
               Critical失敗時はブロック
```

## 🎯 システム構成

### 1. テスト環境
- **Playwright**: ブラウザ自動化によるE2Eテスト
- **Test Categories**: Critical/Important/Nice-to-have の3段階
- **Multi-browser**: Chrome + Mobile Chrome テスト

### 2. ワークフロー
```yaml
Build → Test → Deploy
   ↓      ↓       ↓
  成功   品質判定  条件付き実行
```

### 3. 品質判定ロジック
- **Critical失敗**: デプロイブロック + Issue作成
- **Important失敗**: 警告付きでデプロイ継続
- **Nice-to-have失敗**: ログ記録のみ

## 🧪 テスト分類

### Critical Tests（失敗時デプロイブロック）
- ✅ **ページが正常に読み込まれる**: 基本的なサイト表示
- ✅ **JavaScriptエラーが発生しない**: 致命的なスクリプトエラー検出
- ✅ **環境変数の正しい設定確認**: 必須設定の検証
- ✅ **レスポンシブデザインが機能する**: マルチデバイス対応

### Important Tests（失敗時警告）
- ⚠️ **地図コンポーネントが表示される**: 地図機能の動作
- ⚠️ **イベント検索機能が動作する**: 主要機能の動作
- ⚠️ **Gemini API接続テスト**: 外部API接続
- ⚠️ **地図サービスの可用性確認**: OpenStreetMap接続

### Nice-to-have Tests（失敗時ログのみ）
- 📊 **ページのパフォーマンスが許容範囲内**: ロード時間
- 📊 **外部リソースの可用性確認**: CDNリソース

## 🚀 使用方法

### ローカルテスト実行
```bash
# 依存関係インストール
npm ci

# ブラウザインストール
npx playwright install

# テスト実行
npm run test

# UIモードでテスト
npm run test:ui

# ヘッドフルモードでテスト
npm run test:headed
```

### デプロイフロー
1. **mainブランチへpush** → 自動的にBuild→Test→Deploy
2. **Pull Request作成** → プレビューテスト実行
3. **テスト結果** → PRにコメント自動追加

## 📊 ワークフロー詳細

### Main Branch Deploy (deploy.yml)
```
1. Build: Viteビルド + artifact作成
2. Test: Playwright E2E テスト実行
3. Evaluate: テスト結果評価 + 品質判定
4. Deploy: 条件を満たした場合のみデプロイ実行
5. Handle-failure: 失敗時Issue自動作成
```

### Pull Request Preview (preview.yml)
```
1. Build: プレビュー用ビルド
2. Test: 全テスト実行
3. Comment: PR にテスト結果コメント
4. Cleanup: PR クローズ時のリソース削除
```

## 🔧 設定ファイル

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: ['html', 'json', 'junit'],
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'Mobile Chrome', use: devices['Pixel 5'] }
  ]
});
```

### Test Categories
```typescript
// tests/test-categories.ts
export const TEST_CATEGORIES = {
  'ページが正常に読み込まれる': TestCategory.CRITICAL,
  'JavaScriptエラーが発生しない': TestCategory.CRITICAL,
  '地図コンポーネントが表示される': TestCategory.IMPORTANT,
  'ページのパフォーマンスが許容範囲内': TestCategory.NICE_TO_HAVE
};
```

## 📈 品質メトリクス

### テスト実行時間
- **ローカル実行**: 約30-60秒
- **CI環境**: 約2-3分
- **並列実行**: 複数ブラウザ同時テスト

### カバレッジ
- **基本機能**: 100%カバー
- **API連携**: 主要エンドポイント
- **レスポンシブ**: デスクトップ/モバイル
- **エラーハンドリング**: JavaScriptエラー検出

## 🛠 トラブルシューティング

### よくある問題

#### 1. テストがタイムアウトする
```bash
# 解決方法: タイムアウト値を調整
# playwright.config.ts で timeout を増加
```

#### 2. 地図が表示されない
```bash
# 原因: OpenStreetMapの一時的な問題
# 対応: Importantテストなので警告のみ
```

#### 3. API テストが失敗する
```bash
# 確認事項:
# - GEMINI_API_KEY の設定
# - API クォータ制限
# - ネットワーク接続
```

### ログ確認方法
```bash
# GitHub Actions ログ
# 1. Actions タブ → 該当ワークフロー
# 2. "Run Playwright tests" ステップ
# 3. Test results artifact ダウンロード

# ローカルでのレポート確認
npx playwright show-report
```

## 🔄 継続的改善

### 定期的なメンテナンス
- **週次**: テスト実行時間の監視
- **月次**: テストケースの見直し
- **四半期**: 品質基準の調整

### テスト追加ガイドライン
1. **新機能追加時**: 対応するE2Eテストを追加
2. **バグ修正時**: 回帰防止テストを追加
3. **パフォーマンス改善時**: パフォーマンステストを更新

## 📞 サポート

### テスト失敗時の対応
1. **Critical失敗**: Issue自動作成 → 自動修正システム起動
2. **Important失敗**: ログ確認 → 手動対応検討
3. **Nice-to-have失敗**: 記録のみ → 将来対応

### システム拡張
- **新しいテストケース**: `tests/` ディレクトリに追加
- **カテゴリ変更**: `test-categories.ts` で調整
- **品質基準変更**: GitHub Actions workflow更新

---

## 🎉 期待効果

### 品質保証
- **デプロイ成功 = 完全動作**: エンドユーザーへの信頼性
- **回帰防止**: 新機能追加時の既存機能保護
- **早期発見**: 問題の早期検出・修正

### 開発効率
- **自動化**: 手動テスト作業の削減
- **プレビュー**: PR作成時の動作確認
- **継続的品質**: コード変更時の品質維持

### 運用安定性
- **24時間監視**: 自動テストによる品質チェック
- **段階的リリース**: 品質ゲートによる安全なデプロイ
- **問題の可視化**: テスト結果による明確な品質状況

---

**🛡️ Powered by Playwright Quality Gate System**  
**📅 Last Updated**: 2025-01-19  
**🔧 Version**: 1.0.0