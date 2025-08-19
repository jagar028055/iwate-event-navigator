# 🤖 自動修正システム セットアップガイド

## 概要

GitHub Actions デプロイ失敗を監視し、Claude Code が自動で問題を分析・修正するシステムのセットアップ手順です。

## 🎯 システム構成

```
GitHub Actions 失敗
       ↓
Issue 自動作成 (GitHub)
       ↓
Python監視スクリプト (ローカル/サーバー)
       ↓
Claude Code 自動起動
       ↓
問題分析・修正実行
       ↓
修正完了・Issue クローズ
```

## 📋 セットアップ手順

### 1. 前提条件

- **Python 3.7+** がインストール済み
- **Claude Code** がインストール済み
- **GitHub Personal Access Token** が取得済み

### 2. 依存関係インストール

```bash
# プロジェクトディレクトリに移動
cd iwate-event-navigator

# Python依存関係をインストール
pip install -r scripts/requirements.txt
```

### 3. GitHub Personal Access Token 作成

1. **GitHub Settings を開く**
   - https://github.com/settings/tokens

2. **新しいトークンを作成**
   - 「Generate new token (classic)」をクリック
   - **Note**: `Claude Code Auto-Fix System`
   - **Expiration**: 90 days (推奨)

3. **必要な権限を選択**
   ```
   ✅ repo (Full control of private repositories)
     ✅ repo:status
     ✅ repo_deployment  
     ✅ public_repo
   ✅ write:repo_hook (Read and write repository hooks)
   ✅ notifications (Access notifications)
   ```

4. **トークンをコピー**
   - 生成されたトークンをメモ帳などに保存
   - **重要**: このトークンは二度と表示されません

### 4. 環境変数設定

#### macOS/Linux の場合
```bash
# ~/.bashrc または ~/.zshrc に追加
export GITHUB_TOKEN="ghp_your_token_here"
export GITHUB_REPO="username/iwate-event-navigator"
export CLAUDE_CODE_PATH="/usr/local/bin/claude-code"  # Claude Codeのパス

# 設定を反映
source ~/.bashrc  # または source ~/.zshrc
```

#### Windows の場合
```powershell
# PowerShell で実行
$env:GITHUB_TOKEN="ghp_your_token_here"
$env:GITHUB_REPO="username/iwate-event-navigator"
$env:CLAUDE_CODE_PATH="C:\path\to\claude-code.exe"

# 永続的に設定する場合
[System.Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_your_token_here", [System.EnvironmentVariableTarget]::User)
```

### 5. 実行権限付与 (macOS/Linux)

```bash
chmod +x scripts/auto-fix-monitor.py
```

### 6. 動作テスト

#### テスト実行 (Dry Run)
```bash
python scripts/auto-fix-monitor.py --dry-run --interval 60
```

期待される出力:
```
🤖 Claude Code Auto-Fix Monitor started
Repository: username/iwate-event-navigator  
Check interval: 60 seconds
Dry run: True
--------------------------------------------------
[2025-01-19 10:30:00] Checking for deployment failure issues...
No new deployment failure issues found.
Next check in 60 seconds...
```

### 7. 本格運用開始

#### バックグラウンド実行
```bash
# ログファイル付きで実行
nohup python scripts/auto-fix-monitor.py --interval 300 > logs/auto-fix.log 2>&1 &

# プロセス確認
ps aux | grep auto-fix-monitor
```

#### systemd サービス として実行 (Linux)
```bash
# サービスファイル作成
sudo nano /etc/systemd/system/claude-autofix.service
```

```ini
[Unit]
Description=Claude Code Auto-Fix Monitor
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/iwate-event-navigator
Environment=GITHUB_TOKEN=ghp_your_token_here
Environment=GITHUB_REPO=username/iwate-event-navigator
ExecStart=/usr/bin/python3 scripts/auto-fix-monitor.py --interval 300
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# サービス有効化・開始
sudo systemctl enable claude-autofix.service
sudo systemctl start claude-autofix.service

# ステータス確認
sudo systemctl status claude-autofix.service
```

## 🔧 設定オプション

### コマンドライン引数

```bash
python scripts/auto-fix-monitor.py \
    --repo username/iwate-event-navigator \  # リポジトリ指定
    --interval 300 \                          # チェック間隔（秒）
    --dry-run \                              # テストモード
    --claude-path /path/to/claude-code       # Claude Codeのパス
```

### 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `GITHUB_TOKEN` | ✅ | GitHub Personal Access Token |
| `GITHUB_REPO` | ✅ | リポジトリ名 (owner/repo) |
| `CLAUDE_CODE_PATH` | ❌ | Claude Code実行ファイルのパス (デフォルト: `claude-code`) |

### チェック間隔の推奨設定

- **開発中**: `60-120秒` (頻繁なチェック)
- **本番運用**: `300-600秒` (5-10分間隔)
- **節約モード**: `900-1800秒` (15-30分間隔)

## 📊 監視・ログ

### ログファイル確認
```bash
# リアルタイムログ監視
tail -f logs/auto-fix.log

# エラーログのみ表示
grep -i error logs/auto-fix.log

# 成功した修正のみ表示
grep "✅ Successfully" logs/auto-fix.log
```

### 監視ダッシュボード作成
```bash
# 簡単な監視スクリプト
cat << 'EOF' > scripts/monitor-status.sh
#!/bin/bash
echo "=== Claude Code Auto-Fix Monitor Status ==="
echo "Process: $(pgrep -f auto-fix-monitor.py | wc -l) running"
echo "Last log entry:"
tail -n 1 logs/auto-fix.log
echo
echo "Recent activity (last 10 entries):"
tail -n 10 logs/auto-fix.log | grep -E "(✅|❌|🔍)"
EOF

chmod +x scripts/monitor-status.sh
```

## 🚨 トラブルシューティング

### 問題1: GitHub API認証エラー
```
Error: 401 Unauthorized
```

**解決方法**:
1. GITHUB_TOKEN が正しく設定されているか確認
2. トークンに必要な権限があるか確認
3. トークンの有効期限を確認

### 問題2: Claude Code が見つからない
```
Error: claude-code: command not found
```

**解決方法**:
1. Claude Code のインストール確認
2. CLAUDE_CODE_PATH 環境変数を正しく設定
3. PATH にClaude Codeのディレクトリを追加

### 問題3: Issue が検出されない
```
No new deployment failure issues found.
```

**確認ポイント**:
1. GitHub Actions workflow でIssue作成が有効か確認
2. ラベル「deployment-failure」「auto-created」が付いているか
3. リポジトリ名が正しく設定されているか

### 問題4: 修正が失敗する
```
❌ Failed to process issue #123
```

**デバッグ手順**:
1. ログで詳細なエラー内容を確認
2. Claude Code を手動で実行してテスト
3. 該当のGitHub Actionsログを直接確認

## 🔐 セキュリティ注意事項

### トークン管理
- ✅ 個人用トークンのみ使用（組織トークンは避ける）
- ✅ 必要最小限の権限のみ付与
- ✅ 定期的にトークンをローテーション（90日推奨）
- ✅ トークンをコード内にハードコードしない

### アクセス制御
- ✅ 監視スクリプトは信頼できるサーバーでのみ実行
- ✅ ログファイルのアクセス権限を適切に設定
- ✅ 不要になった場合はトークンを即座に削除

## 📈 運用開始後の期待効果

### 修正時間の短縮
- **従来**: 手動確認・修正で2-3時間
- **自動化後**: 10-15分で自動解決

### 可用性向上
- **24時間監視**: 深夜・休日のデプロイ失敗も自動対応
- **即座の対応**: 失敗検知から数分で修正開始

### 開発効率向上
- **集中力維持**: デバッグ作業からの解放
- **品質向上**: 一貫した修正手順による安定性向上

## 📞 サポート・メンテナンス

### 定期メンテナンス
- 月1回: ログファイルのローテーション
- 月1回: GitHub トークンの有効期限確認
- 四半期ごと: システム全体の動作確認

### アップデート手順
1. スクリプトの最新版を取得
2. dry-run でテスト実行
3. 段階的に本番環境にデプロイ

システムが正常に動作していることを確認したら、実際のデプロイ失敗を発生させてテストしてください。