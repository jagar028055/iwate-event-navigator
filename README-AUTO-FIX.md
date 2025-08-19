# 🤖 自動デプロイ修正システム

## 概要

岩手イベントナビゲーターのデプロイ失敗を自動的に検知し、Claude Codeが問題を分析・修正する完全自動化システムです。

```
デプロイ失敗 → Issue自動作成 → Claude Code自動起動 → 問題分析・修正 → 修正完了
```

**修正時間**: 手動2-3時間 → **自動10-15分** ⚡

## 🎯 システム構成

### 1. 監視・通知システム
- **GitHub Actions**: デプロイ失敗時にIssue自動作成
- **Discord通知**: リアルタイム通知（オプション）
- **メール通知**: GitHub設定による通知

### 2. 専門エージェント
- **build-error-analyzer**: ビルドエラー分析・修正提案
- **dependency-fixer**: 依存関係問題の自動修正
- **env-validator**: 環境変数設定の検証・修正

### 3. 自動修正システム
- **Python監視スクリプト**: GitHub Issues監視
- **Claude Code連携**: 自動修正実行
- **Git統合**: 修正内容の自動commit

## 🚀 クイックスタート

### 1. システムテスト実行
```bash
# 依存関係インストール
pip install -r scripts/requirements.txt

# GitHub Token設定
export GITHUB_TOKEN="ghp_your_token_here"
export GITHUB_REPO="username/iwate-event-navigator"

# システム動作確認
python scripts/test-auto-fix-system.py
```

期待される出力:
```
🧪 Starting Auto-Fix System Integration Test
✅ GitHub Connection: Connected to username/iwate-event-navigator
✅ Issues Permission: Can read issues
✅ Workflows Access: Found 1 workflow(s)
✅ Claude Code Availability: Claude Code found
✅ Workflow Configuration: Deploy workflow properly configured
✅ Issue Templates: Deployment failure template found
✅ Agent Specifications: All 3 agents found
✅ Monitor Script: Monitor script is executable

🎉 System is ready for deployment!
Success Rate: 8/8 (100.0%)
```

### 2. 監視システム開始
```bash
# バックグラウンドで監視開始
nohup python scripts/auto-fix-monitor.py --interval 300 > logs/auto-fix.log 2>&1 &

# プロセス確認
ps aux | grep auto-fix-monitor
```

## 📋 詳細ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [🛠 セットアップガイド](docs/auto-fix-setup-guide.md) | システムの詳細設定手順 |
| [💬 Discord設定](docs/discord-setup-guide.md) | Discord通知の設定方法 |
| [🔧 エージェント仕様](agents/) | 専門エージェントの詳細仕様 |

## 🎛 システム設定

### 環境変数
```bash
# 必須
export GITHUB_TOKEN="ghp_your_personal_access_token"
export GITHUB_REPO="username/iwate-event-navigator"

# オプション
export CLAUDE_CODE_PATH="/path/to/claude-code"
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### 監視間隔設定
- **開発中**: 60-120秒 (頻繁なチェック)
- **本番運用**: 300-600秒 (推奨)
- **節約モード**: 900-1800秒 (リソース節約)

## 🔄 動作フロー

### 1. デプロイ失敗検知
```yaml
# .github/workflows/deploy.yml
handle-failure:
  if: failure()
  steps:
  - name: Create Issue on Build/Deploy Failure
    # Issue自動作成 + Discord通知
```

### 2. 自動修正実行
```python
# scripts/auto-fix-monitor.py
def run_claude_code_fix():
    # 1. エラーログ分析
    # 2. 専門エージェント起動
    # 3. 修正案生成・実行
    # 4. テスト・再デプロイ
```

### 3. 問題解決確認
```bash
# ビルド成功確認 → Issue自動クローズ
# 失敗継続 → 詳細調査・手動対応要請
```

## 📊 対応可能な問題

### ✅ 自動修正可能
- **TypeScriptエラー**: 型定義不一致、import/export問題
- **依存関係**: 欠損パッケージ、バージョン競合
- **環境変数**: 設定ミス、命名規則違反
- **ビルド設定**: Vite設定、パスエイリアス問題
- **デプロイ設定**: GitHub Pages設定、ベースURL問題

### ⚠️ 部分的対応
- **セキュリティ脆弱性**: パッケージ更新提案
- **パフォーマンス**: 最適化提案
- **複雑なロジックエラー**: 分析・調査支援

### ❌ 手動対応必要
- **アプリケーション仕様変更**: ビジネスロジック関連
- **外部API変更**: サードパーティサービス仕様変更
- **インフラ障害**: GitHub、Cloudflare側の問題

## 🎯 期待効果

### ⚡ 修正時間短縮
- **従来**: 2-3時間の手動デバッグ
- **自動化後**: 10-15分で自動解決
- **深夜・休日**: 24時間自動対応

### 📈 品質・可用性向上
- **一貫した修正**: パターン化された確実な修正
- **学習効果**: エラーパターンDB蓄積
- **予防保全**: 潜在問題の事前検出

### 🚀 開発効率向上
- **集中力維持**: デバッグ中断の排除
- **スキル活用**: 本質的な開発作業に専念
- **ストレス軽減**: デプロイ失敗への心理的負担軽減

## 🔧 運用・メンテナンス

### 日常監視
```bash
# ステータス確認
./scripts/monitor-status.sh

# ログ確認
tail -f logs/auto-fix.log

# 成功・失敗統計
grep -c "✅ Successfully" logs/auto-fix.log
grep -c "❌ Failed" logs/auto-fix.log
```

### 定期メンテナンス
- **週次**: ログファイル確認・ローテーション
- **月次**: GitHub Token有効期限確認
- **四半期**: システム全体動作確認・アップデート

## 🚨 トラブルシューティング

### よくある問題
1. **GitHub API制限**: Token権限・レート制限確認
2. **Claude Code未検出**: パス設定・インストール確認
3. **監視停止**: プロセス確認・自動再起動設定
4. **修正失敗**: エラーパターン追加・手動フォローアップ

### 緊急対応
```bash
# システム停止
pkill -f auto-fix-monitor

# 手動修正モード
python scripts/auto-fix-monitor.py --dry-run

# システム再起動
./scripts/restart-monitor.sh
```

## 📞 サポート

### 自動修正失敗時
1. **Issue確認**: GitHub IssueのClaude Codeコメント確認
2. **ログ確認**: `logs/auto-fix.log`でエラー詳細確認
3. **手動実行**: 問題を特定してClaude Codeで手動修正
4. **パターン追加**: 新しいエラーパターンをシステムに追加

### システム改善
- **エラーパターン**: 新しい失敗パターンの追加
- **エージェント拡張**: 専門エージェントの機能追加
- **監視強化**: より詳細な監視・通知機能

---

**🤖 Powered by Claude Code Auto-Fix System**  
**📅 Last Updated**: 2025-01-19  
**🔧 Version**: 1.0.0