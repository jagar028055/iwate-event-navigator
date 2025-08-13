# 🧠 TTD-DR (Test-Driven Development for Research)
## Phase 1 MVP - 自動研究レポート生成システム

[![Status](https://img.shields.io/badge/Status-Production_Ready-green.svg)](https://github.com)
[![Version](https://img.shields.io/badge/Version-1.0.0_MVP-blue.svg)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-green.svg)](tests/)

> **高品質な研究レポートを自動生成する4エージェント統合システム**

---

## ✨ 特徴

🤖 **4エージェント自動化**: 計画→研究→進化→統合の完全自動パイプライン  
📊 **品質保証**: 多段階品質チェックと詳細メトリクス  
⚡ **即座に実行**: ワンコマンドで高品質レポート生成  
🇯🇵 **日本語最適化**: 日本語研究クエリに特化した設計  
🔧 **実運用対応**: エラーハンドリング・監視・ログ完備  

---

## 🚀 クイックスタート

### 1. 即座に開始
```bash
python quick_research.py "機械学習の最新動向について"
```

### 2. 詳細設定版
```bash
python run_ttd_dr.py
# 対話式で詳細設定可能
```

### 3. 結果確認
```bash
ls ttd_dr_output/
# 生成されたレポートをチェック
```

---

## 🏗️ システム構成

```mermaid
graph LR
    A[📝 Research Planner<br/>研究計画] --> B[🔍 Iterative Researcher<br/>反復研究]
    B --> C[🧬 Self-Evolution<br/>自己進化]
    C --> D[📋 Final Integrator<br/>最終統合]
    D --> E[📄 高品質研究レポート]
```

### 4つのコアエージェント

| エージェント | 役割 | 主要機能 |
|-------------|------|---------|
| 🧠 **Research Planner** | 研究計画立案 | クエリ分析・戦略策定・リソース配分 |
| 🔬 **Iterative Researcher** | 反復的情報収集 | 効率的検索・品質評価・関連性抽出 |
| ⭐ **Self-Evolution** | 自己進化最適化 | 多視点生成・AI審査・品質向上 |
| 📊 **Final Integrator** | 最終統合 | 一貫性確保・品質検証・出力最適化 |

---

## 📊 実行結果例

### 生成される品質メトリクス
```json
{
  "overall_quality": 4.2,     // 総合品質スコア (5.0満点)
  "completeness_score": 0.92, // 完全性 (網羅度)
  "consistency_score": 0.88,  // 一貫性 (論理的整合性)
  "coherence_score": 0.90,    // 論理性 (文章構造)
  "word_count": 3500,         // 文字数
  "sections": 6,              // セクション数
  "citations": 15             // 引用・参考文献数
}
```

### サンプル実行結果
```bash
🔍 研究クエリ: Obsidianの効果的な運用方法とベストプラクティス
🚀 TTD-DR実行中...
✅ 研究完了!
📄 TTD-DR Research Report
📊 品質スコア: 4.1/5.0
📝 文字数: 3500
🆔 実行ID: ttd_dr_1754990109
💾 結果: ttd_dr_output/ttd_dr_1754990109_report.md
```

---

## 📁 ファイル構成

```
TTD-DR/
├── 🔧 コアシステム
│   ├── research_planner_agent.py          # 研究計画エージェント
│   ├── iterative_researcher_agent.py      # 反復研究エージェント
│   ├── self_evolution_agent.py            # 自己進化エージェント  
│   ├── final_integrator_agent.py          # 最終統合エージェント
│   └── ttd_dr_system_integration.py       # システム統合フレームワーク
├── 🛡️ 品質保証
│   ├── ttd_dr_error_handling.py           # エラーハンドリング
│   ├── ttd_dr_performance_optimization.py # パフォーマンス最適化
│   ├── ttd_dr_monitoring_logging.py       # 監視・ログシステム
│   └── ttd_dr_final_qa_certification.py   # QA認証システム
├── 🚀 実行スクリプト
│   ├── run_ttd_dr.py                      # 対話型実行（詳細設定可能）
│   └── quick_research.py                  # クイック実行（高速）
├── 📚 ドキュメント
│   ├── TTD-DR_運用マニュアル.md            # 📖 完全運用ガイド
│   ├── TTD-DR_クイックスタート.md          # ⚡ 5分で始めるガイド
│   ├── TTD_DR_System_Documentation.md     # 🔧 技術ドキュメント
│   └── obsidian_運用ガイド.md             # 💎 Obsidian活用法
└── 📁 ttd_dr_output/                      # 出力ディレクトリ
    ├── {実行ID}_report.md                 # 📄 最終研究レポート
    ├── {実行ID}_output.json               # 📊 詳細データ・品質メトリクス
    └── {実行ID}_execution.json            # 🔍 実行ログ・システム情報
```

---

## 💡 使用例・ユースケース

### 📈 ビジネス・業務
```bash
python quick_research.py "2025年AI市場動向と競合分析"
python quick_research.py "DX推進のための組織変革戦略"
python quick_research.py "リモートワーク効果測定方法"
```

### 🎓 学術・研究
```bash
python run_ttd_dr.py
# → "機械学習における説明可能AIの研究動向と課題"
# 高品質設定: 8000文字、10セクション、20回検索、10回進化
```

### 📚 学習・教育
```bash
python quick_research.py "Python習得のための効率的学習ロードマップ"
python quick_research.py "データサイエンス検定対策要点整理"
```

### ✍️ コンテンツ制作
```bash
python quick_research.py "テクノロジー記事: 量子コンピュータの実用化展望"
```

---

## 🔧 詳細設定オプション

### パフォーマンスレベル

| レベル | 文字数 | セクション | 検索回数 | 進化回数 | 実行時間 | 品質 |
|--------|--------|-----------|----------|----------|----------|------|
| ⚡ 高速 | 2000 | 4 | 3-5 | 2-3 | 1-2分 | 3.0-3.5 |
| 🎯 標準 | 3000 | 6 | 8-12 | 5-7 | 5-10分 | 3.5-4.2 |
| 🏆 高品質 | 5000 | 8 | 15-20 | 8-10 | 15-30分 | 4.0-4.8 |
| 💎 最高品質 | 8000+ | 10+ | 25+ | 12+ | 30-60分 | 4.5-5.0 |

### カスタム設定例
```python
# custom_config.py
config.planner_config['target_length'] = 6000      # 文字数
config.researcher_config['search_iterations'] = 15 # 検索回数
config.evolution_config['max_iterations'] = 8      # 進化回数
```

---

## 🧪 テスト・品質保証

### ✅ Phase 1 MVP テスト結果

| テストカテゴリ | 実行結果 | 成功率 |
|---------------|----------|--------|
| 🔬 QA認証テスト | ✅ 完全成功 | 100% |
| 🔧 システム統合テスト | ✅ 完全成功 | 100% |  
| 📊 実研究クエリテスト | ✅ 完全成功 | 100% |

### 品質認証
- ✅ **JSON Serialization**: 問題解決済み
- ✅ **エラーハンドリング**: 完全実装
- ✅ **パフォーマンス**: 最適化完了
- ✅ **4エージェント統合**: 正常動作確認
- ✅ **実運用対応**: システム認証完了

---

## 📖 ドキュメント

| ドキュメント | 内容 | 対象者 |
|-------------|------|--------|
| 📖 [**TTD-DR_運用マニュアル.md**](TTD-DR_運用マニュアル.md) | 完全運用ガイド・詳細設定・トラブルシューティング | 全ユーザー |
| ⚡ [**TTD-DR_クイックスタート.md**](TTD-DR_クイックスタート.md) | 5分で始める簡単ガイド | 初回ユーザー |
| 🔧 [**TTD_DR_System_Documentation.md**](TTD_DR_System_Documentation.md) | 技術仕様・アーキテクチャ・API | 開発者・上級ユーザー |
| 💎 [**obsidian_運用ガイド.md**](obsidian_運用ガイド.md) | Obsidian PKMシステム活用法 | 知識管理ユーザー |

---

## 🚨 トラブルシューティング

### よくある問題

**Q: 実行エラーが発生する**
```bash
# A: ディレクトリとファイル存在確認
pwd && ls *.py
```

**Q: 結果の品質が低い**  
```bash
# A: より詳細な設定で再実行
python run_ttd_dr.py  # 検索・進化回数を増加
```

**Q: 実行が遅い**
```bash  
# A: 高速設定を使用
python quick_research.py "テーマ"  # 最高速実行
```

---

## 🔮 今後の予定

### Phase 2 開発計画
- 🌐 **マルチモーダル対応**: 画像・動画分析機能
- 🤝 **コラボレーション機能**: チーム研究支援
- 📊 **リアルタイムダッシュボード**: 進捗可視化
- 🔗 **外部システム連携**: API・Webhook対応
- 🧠 **専門分野特化エージェント**: ドメイン特化機能

---

## 💻 システム要件

**最小要件:**
- Python 3.8+
- 2GB RAM
- 1GB ストレージ空き容量

**推奨要件:**
- Python 3.10+
- 4GB RAM  
- インターネット接続（情報収集用）

**対応環境:**
- ✅ Linux (Ubuntu, CentOS, etc.)
- ✅ macOS
- ✅ Windows 10/11
- ✅ Termux (Android)

---

## 🎯 今すぐ始める

### 1分で最初の研究レポート生成：

```bash
# Step 1: クイック実行
python quick_research.py "人工知能の産業応用について"

# Step 2: 結果確認  
ls ttd_dr_output/

# Step 3: レポート閲覧
cat ttd_dr_output/ttd_dr_*_report.md
```

---

## 📞 サポート

**ドキュメント**: 各種マニュアル参照  
**技術情報**: システムドキュメント確認  
**トラブル**: 運用マニュアルのトラブルシューティング章

---

## 🏆 ライセンス

MIT License - 自由にご利用ください

---

**🎉 TTD-DR Phase 1 MVP - 今すぐ高品質な研究レポートを生成しよう！**

```bash
python quick_research.py "あなたの研究テーマ"
```

*Happy Research! 🚀*