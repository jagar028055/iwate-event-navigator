# TTD-DR クイックスタートガイド
## 5分で始める研究レポート自動生成

*🚀 今すぐ使い始められる簡単ガイド*

---

## ⚡ 超簡単！3ステップで開始

### Step 1: 準備確認（30秒）
```bash
# ファイルがあることを確認
ls run_ttd_dr.py quick_research.py
# OK と表示されればOK
```

### Step 2: 最初の実行（1分）
```bash
python quick_research.py "AIの基本概念について"
```

### Step 3: 結果確認（30秒）
```bash
# 生成されたレポートを確認
ls ttd_dr_output/
# 最新のファイルをチェック
```

## 🎯 基本的な使い方

### パターン1: 即座に研究レポート生成
```bash
python quick_research.py "研究したいテーマ"
```

**例:**
```bash
python quick_research.py "リモートワークの効果的な運営方法"
python quick_research.py "機械学習の産業応用事例"
python quick_research.py "持続可能なエネルギー技術の最新動向"
```

### パターン2: 詳細設定で高品質レポート
```bash
python run_ttd_dr.py
```
↓ 対話式で設定入力
- 研究テーマ入力
- 文字数設定（3000推奨）
- セクション数（6推奨）
- 詳細度調整

## 📊 すぐ使える設定パターン

### ⚡ 高速モード（1-2分）
```bash
# 標準のquick_research.pyを使用
python quick_research.py "テーマ"
```

### 🎯 標準モード（5-10分）
```bash
python run_ttd_dr.py
# 設定例:
# 文字数: 3000
# セクション: 6  
# 検索: 10回
# 進化: 5回
```

### 🏆 高品質モード（15-30分）
```bash
python run_ttd_dr.py
# 設定例:
# 文字数: 6000
# セクション: 8
# 検索: 20回
# 進化: 10回
```

## 💡 効果的な研究クエリの書き方

### ✅ 良い例
```
"中小企業のデジタル変革における成功要因と課題分析"
"機械学習を活用したマーケティング自動化の実践方法"
"リモートワーク環境での生産性向上施策の比較研究"
```

### ❌ 改善が必要な例
```
"AI" → "AI技術の具体的活用方法"  
"経営" → "中小企業の経営戦略立案方法"
"勉強方法" → "プログラミング習得のための効果的学習法"
```

## 📁 出力ファイルの見方

実行後、`ttd_dr_output/`フォルダに3つのファイルが生成：

```
📄 {実行ID}_report.md    ← 📌 これがメインの研究レポート！
📊 {実行ID}_output.json  ← 詳細データ・品質スコア
🔧 {実行ID}_execution.json ← システム実行ログ
```

### メインレポートを読む
```bash
# 最新のレポートを表示
ls -t ttd_dr_output/*_report.md | head -1 | xargs cat
```

## 🚨 よくある問題と瞬時解決

### 問題: 実行エラーが出る
```bash
# 解決法: ディレクトリを確認
pwd
ls *.py
# TTD-DR関連のpyファイルがあるディレクトリで実行
```

### 問題: 結果が表示されない
```bash
# 解決法: 出力フォルダを確認
ls ttd_dr_output/
# ファイルがあるか確認。なければ権限チェック
chmod 755 ttd_dr_output/
```

### 問題: 品質が低い
```bash
# 解決法: より詳細な設定で再実行
python run_ttd_dr.py
# 検索回数・進化回数を増やす
```

## ⭐ 実用例テンプレート

すぐにコピペして使える実用例：

### ビジネス調査
```bash
python quick_research.py "SaaS企業の成長戦略と成功事例分析"
```

### 技術調査  
```bash
python quick_research.py "Kubernetes導入のベストプラクティスとトラブルシューティング"
```

### 学習・教育
```bash
python quick_research.py "データサイエンス学習の効率的なロードマップ2025年版"
```

### 市場分析
```bash
python quick_research.py "電気自動車市場の現状と2025年の展望予測"
```

## 🎯 品質スコアの読み方

実行後の品質スコア（5.0点満点）:

```
🏆 4.5-5.0: 最高品質（そのまま使用OK）
⭐ 4.0-4.4: 高品質（実用レベル）  
✅ 3.5-3.9: 良好（基本的に問題なし）
⚠️ 3.0-3.4: 要改善（設定調整推奨）
❌ 3.0未満: 再実行推奨
```

## 🔥 今すぐ試そう！

### 最初の一歩
```bash
python quick_research.py "プログラミング学習の効果的な方法"
```

### 結果確認
```bash
ls -la ttd_dr_output/
```

### レポート閲覧
```bash
# 最新レポートを確認（ファイル名は実行IDによって異なります）
cat ttd_dr_output/ttd_dr_*_report.md | head -50
```

---

## 📞 困った時は？

1. **基本トラブル**: この文書の「よくある問題」を確認
2. **詳細情報**: `TTD-DR_運用マニュアル.md` を参照  
3. **システム情報**: `TTD_DR_System_Documentation.md` を確認

---

**🚀 今すぐスタート！**
```bash
python quick_research.py "あなたの興味のあるテーマ"
```

*Happy Research! 🎉*