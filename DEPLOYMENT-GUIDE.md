# 🚀 品質チェックワークフロー導入ガイド

## 📋 あなたが実行すること

このガイドに従って、品質チェックシステムを有効化してください。**所要時間: 約20分**

---

## Step 1: 依存関係インストール ⏱️ 5分

```bash
# ターミナルでプロジェクトディレクトリに移動
cd iwate-event-navigator

# 依存関係をインストール
npm ci

# Playwrightブラウザをインストール
npx playwright install --with-deps
```

**期待される出力**:
```
✔ Success! Created package-lock.json
✔ Browser installation complete
```

**エラーが出た場合**:
```bash
# Node.jsバージョン確認（20以上推奨）
node --version

# npmキャッシュクリア
npm cache clean --force
npm ci
```

---

## Step 2: ローカルテスト実行 ⏱️ 5分

```bash
# ビルドテスト
npm run build

# E2Eテスト実行
npm run test
```

**期待される出力**:
```
✅ ページが正常に読み込まれる
✅ 地図コンポーネントが表示される  
✅ JavaScriptエラーが発生しない
✅ レスポンシブデザインが機能する
⚠️ API健全性チェック (スキップされる場合があります)

Running 8 tests using 2 workers
  8 passed (30s)
```

**テスト結果の確認**:
```bash
# HTMLレポートを開く
npx playwright show-report
```

---

## Step 3: Git commit & push ⏱️ 2分

```bash
# 変更をステージング
git add .

# コミット作成
git commit -m "feat: add quality gate system with Playwright E2E tests

- Add Playwright testing framework
- Implement Critical/Important/Nice-to-have test categories  
- Add build→test→deploy workflow
- Add preview deployment for Pull Requests
- Block deployment on critical test failures

🤖 Generated with Claude Code"

# mainブランチにpush（これでワークフローが自動実行される）
git push origin main
```

---

## Step 4: GitHub Actions動作確認 ⏱️ 5分

### 4.1 GitHub リポジトリページを開く
1. https://github.com/[username]/iwate-event-navigator にアクセス
2. **Actions** タブをクリック

### 4.2 ワークフロー実行状況を確認
最新の "Deploy to GitHub Pages" ワークフローで以下の順序で実行されることを確認:

```
🔄 Build (1-2分)
  ├── Checkout
  ├── Setup Node.js  
  ├── Install dependencies
  ├── Build
  └── Upload artifact

🔄 Test (2-3分)
  ├── Checkout
  ├── Install dependencies
  ├── Install Playwright Browsers
  ├── Build for testing
  ├── Start preview server
  ├── Run Playwright tests ← ここが重要！
  ├── Upload test results
  └── Evaluate test results ← ここで品質判定！

🔄 Deploy (1分)
  └── Deploy to GitHub Pages
```

### 4.3 結果パターン

#### ✅ **成功パターン**
```
✅ Build completed
✅ Test completed - All tests passed
✅ Deploy completed  
```
→ サイトが正常にデプロイされ、完全に動作します

#### ❌ **失敗パターン**  
```
✅ Build completed
❌ Test failed - Critical test failures
⏭️ Deploy skipped
🔄 Handle-failure - Issue created
```
→ デプロイがブロックされ、GitHub Issueが自動作成されます

---

## Step 5: 動作テスト ⏱️ 3分

### 5.1 正常デプロイの確認
1. GitHub Pages URLにアクセス
2. サイトが完全に動作することを確認
3. 地図が表示される
4. JavaScriptエラーがない

### 5.2 失敗ケースのテスト（オプション）
```bash
# 意図的にエラーを作成
echo "console.error('Test error for quality gate');" >> src/main.tsx

# コミット・プッシュ
git add .
git commit -m "test: intentional error for quality gate testing" 
git push

# 結果確認:
# 1. Actions でテスト失敗を確認
# 2. Issues で自動作成されたIssueを確認  
# 3. 自動修正システムが起動することを確認
```

**元に戻す**:
```bash
git revert HEAD
git push
```

---

## 🎯 導入完了の確認チェックリスト

- [ ] `npm run test` がローカルで成功する
- [ ] GitHub Actions でワークフローが正常実行される
- [ ] テスト成功時にデプロイが実行される
- [ ] テスト失敗時にデプロイがブロックされる
- [ ] 失敗時にGitHub Issueが自動作成される

---

## 📊 これで何が変わるのか？

### 🔄 **今まで（導入前）**
```
1. コードをpush
2. デプロイ成功 
3. サイトにアクセス
4. 「あれ？動かない...」😰
5. 手動でデバッグ・修正 (30分-2時間)
6. 再デプロイ
7. 再度確認...
```

### ⚡ **これから（導入後）**  
```
1. コードをpush
2. 自動テスト実行
3a. テスト成功 → デプロイ → 完全動作 ✅
3b. テスト失敗 → デプロイブロック → Issue自動作成 → 自動修正 🤖
```

**効果**:
- ⏱️ **修正時間**: 30分-2時間 → 0-10分
- 🛡️ **品質保証**: デプロイ成功 = 完全動作
- 😌 **安心感**: 「デプロイ恐怖症」からの解放
- 🚀 **開発速度**: 本質的な開発に集中

---

## 🚨 トラブルシューティング

### Q: `npm run test` でエラーが出る
```bash
# ブラウザを再インストール
npx playwright install --with-deps chromium

# ポート競合の場合
lsof -ti:4173 | xargs kill -9
npm run test
```

### Q: GitHub Actions でテストが失敗する
1. **Actions** → **失敗したワークフロー** → **Test** ステップのログを確認
2. エラー内容に応じて対応:
   - 環境変数エラー: `GEMINI_API_KEY` の設定確認
   - タイムアウト: 正常（外部サービス依存のため）
   - Critical失敗: 実際の問題 → 修正が必要

### Q: Issue が自動作成されない
1. **Settings** → **Actions** → **General** で "Allow GitHub Actions to create and approve pull requests" が有効か確認
2. **Settings** → **Issues** が有効か確認

---

## 🎉 完了！

これで品質チェックシステムが有効になりました！

- 🛡️ **Critical テスト失敗** → デプロイブロック
- ⚠️ **Important テスト失敗** → 警告付きデプロイ  
- 📊 **Nice-to-have テスト失敗** → ログ記録のみ

**今後は「デプロイ成功 = サイト完全動作」が保証されます！**

何か問題があれば、GitHub の Issues または Claude Code で相談してください。