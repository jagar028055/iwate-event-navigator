# 🤖 Discord Webhook設定ガイド

## 概要

デプロイメント失敗時にDiscordに通知を送信するためのWebhook設定手順です。

## 📋 設定手順

### 1. Discordサーバー準備

1. **新しいサーバー作成** (または既存サーバー使用)
   - Discordを開く
   - 左側の「+」ボタンをクリック
   - 「サーバーを作成」を選択
   - サーバー名: `岩手イベントナビゲーター` (任意)

2. **専用チャンネル作成**
   - サーバー内で右クリック → 「チャンネルを作成」
   - チャンネル名: `deployment-alerts` (推奨)
   - タイプ: テキストチャンネル

### 2. Webhook URL取得

1. **チャンネル設定を開く**
   - `deployment-alerts` チャンネルで右クリック
   - 「チャンネルを編集」を選択

2. **Webhookを作成**
   - 左メニューの「連携サービス」をクリック
   - 「ウェブフックを作成」をクリック
   - 名前: `Deploy Monitor` (任意)
   - アバター: 設定したい画像をアップロード (任意)

3. **Webhook URLをコピー**
   - 「ウェブフックURLをコピー」をクリック
   - URL例: `https://discord.com/api/webhooks/1234567890/abcdefghijklmnop-qrstuvwxyz`
   - **重要**: このURLは秘密情報として扱ってください

### 3. GitHub Secrets設定

1. **GitHubリポジトリページを開く**
   - https://github.com/[username]/iwate-event-navigator

2. **Settings → Secrets and variables → Actions**
   - リポジトリ設定の「Settings」タブをクリック
   - 左メニューの「Secrets and variables」→「Actions」をクリック

3. **新しいSecret追加**
   - 「New repository secret」をクリック
   - **Name**: `DISCORD_WEBHOOK_URL`
   - **Secret**: コピーしたWebhook URL
   - 「Add secret」をクリック

## 🔔 通知内容

設定完了後、デプロイ失敗時に以下の内容がDiscordに送信されます：

```
🚨 デプロイメント失敗
岩手イベントナビゲーターのデプロイが失敗しました

Repository: username/iwate-event-navigator
Branch: main
Commit: [abc123d](リンク)
Workflow: [#12345](リンク)
```

## ⚡ 動作確認

### テスト方法

1. **意図的にビルドを失敗させる**
   ```bash
   # 一時的にpackage.jsonを破壊
   echo '{ "invalid": json }' > package.json
   git add package.json
   git commit -m "test: intentional build failure"
   git push
   ```

2. **GitHub Actionsを確認**
   - Actions タブでワークフローの失敗を確認

3. **Discord通知を確認**
   - Discord の `deployment-alerts` チャンネルに通知が来るか確認

4. **修復**
   ```bash
   git revert HEAD
   git push
   ```

## 🛠 カスタマイズオプション

### 通知メッセージの変更

`.github/workflows/deploy.yml` の以下の部分を編集：

```yaml
- name: Send Discord Notification (Optional)
  # ... 省略 ...
  run: |
    curl -H "Content-Type: application/json" \
         -X POST \
         -d '{
           "embeds": [{
             "title": "🚨 カスタムタイトル",  # ← ここを変更
             "description": "カスタム説明",    # ← ここを変更
             "color": 15548997,              # ← 色も変更可能 (赤系)
             # ... その他のフィールド ...
           }]
         }' \
         "$DISCORD_WEBHOOK_URL"
```

### 通知の無効化

Discord通知を無効にしたい場合：

1. GitHub SecretsからDISCORD_WEBHOOK_URLを削除
2. または環境変数として空文字を設定

## 🔐 セキュリティ注意事項

- ✅ Webhook URLは絶対に公開リポジトリにコミットしない
- ✅ GitHub Secretsに保存することでURL保護
- ✅ 不要になった場合はDiscord側でWebhookを削除
- ✅ URLが漏洩した場合は即座に再生成

## 📞 トラブルシューティング

### 通知が来ない場合

1. **Webhook URL確認**
   - GitHub SecretsのDISCORD_WEBHOOK_URLが正しいか確認
   - Discord側でWebhookが削除されていないか確認

2. **権限確認**
   - Botがチャンネルにメッセージ送信権限を持っているか確認

3. **GitHub Actionsログ確認**
   - Workflowの「Send Discord Notification」ステップのログを確認
   - エラーメッセージがないか確認

### Discord側での確認方法

1. **Webhook テスト**
   ```bash
   curl -H "Content-Type: application/json" \
        -X POST \
        -d '{"content": "テスト通知"}' \
        "YOUR_WEBHOOK_URL"
   ```

2. **Webhookの状態確認**
   - Discord チャンネル設定の「連携サービス」で確認
   - 削除されている場合は再作成

## 📊 運用開始後の効果

- ⚡ **即座の問題検知**: デプロイ失敗を数秒で通知
- 🔄 **迅速な対応**: Claude Codeによる自動修正開始を確認可能
- 📱 **モバイル対応**: Discordアプリで外出先でも通知受信
- 👥 **チーム共有**: 複数人でデプロイ状況を監視可能