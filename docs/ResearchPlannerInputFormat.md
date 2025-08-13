# Research Planner - 入力形式定義

## 概要
ユーザクエリを受け取り、構造化された研究計画パラメータに変換するための入力形式定義

## 入力データ構造

### 1. 基本入力形式
```json
{
  "user_query": "string",           // 必須: ユーザの研究質問
  "constraints": {                  // オプション: 制約条件
    "max_sections": "number",       // 最大セクション数 (デフォルト: 6)
    "target_length": "number",      // 目標文字数 (デフォルト: 5000)
    "search_iterations": "number",  // 最大検索反復数 (デフォルト: 15)
    "languages": ["string"],        // 検索言語 (デフォルト: ["ja", "en"])
    "academic_level": "string",     // 学術レベル (undergraduate/graduate/research)
    "citation_style": "string"      // 引用スタイル (APA/MLA/IEEE等)
  },
  "domain_context": {               // オプション: 分野コンテキスト
    "field": "string",              // 研究分野 (AI/医学/経済学等)
    "keywords": ["string"],         // 重要キーワード
    "excluded_topics": ["string"]   // 除外トピック
  },
  "user_preferences": {             // オプション: ユーザ設定
    "evidence_weight": "number",    // エビデンス重視度 (0.0-1.0)
    "creativity_level": "number",   // 創造性レベル (0.0-1.0)
    "technical_depth": "number"     // 技術的深度 (0.0-1.0)
  }
}
```

### 2. クエリ解析パターン

#### パターン1: 直接的質問形式
```
Input: "AIチャットボットの自然言語処理技術について調査して"
Parse: {
  "main_topic": "AIチャットボット",
  "focus_area": "自然言語処理技術",
  "query_type": "survey",
  "scope": "technology_focused"
}
```

#### パターン2: 比較分析形式
```
Input: "GPT-4とClaude 3.5の性能比較を詳しく分析したい"
Parse: {
  "main_topic": "大規模言語モデル",
  "subjects": ["GPT-4", "Claude 3.5"],
  "query_type": "comparative_analysis",
  "scope": "performance_evaluation"
}
```

#### パターン3: 実装指向形式
```
Input: "リアルタイム音声認識システムの実装方法を研究"
Parse: {
  "main_topic": "音声認識システム",
  "focus_area": "実装方法",
  "query_type": "implementation_study",
  "scope": "practical_application"
}
```

### 3. 構造化パラメータ変換ルール

#### 3.1 セクション数推定
```python
def estimate_sections(query_complexity, target_length):
    base_sections = 4  # イントロ, メイン×2, 結論
    
    if query_complexity == "simple":
        return min(base_sections, 5)
    elif query_complexity == "moderate":
        return min(base_sections + 2, 8)
    elif query_complexity == "complex":
        return min(base_sections + 4, 12)
    
    # 文字数ベース調整
    length_factor = target_length / 1000
    return int(base_sections * min(length_factor, 3))
```

#### 3.2 検索戦略決定
```python
def determine_search_strategy(query_type, domain):
    strategies = {
        "survey": {
            "breadth_first": True,
            "depth_iterations": 3,
            "source_diversity": "high"
        },
        "comparative_analysis": {
            "breadth_first": False,
            "depth_iterations": 5,
            "source_diversity": "balanced"
        },
        "implementation_study": {
            "breadth_first": False,
            "depth_iterations": 7,
            "source_diversity": "technical_focused"
        }
    }
    return strategies.get(query_type, strategies["survey"])
```

### 4. エラーケース・フォールバック処理

#### 4.1 不完全入力への対応
```json
{
  "error_types": {
    "ambiguous_query": {
      "action": "clarification_request",
      "fallback": "general_survey_approach"
    },
    "overly_broad_query": {
      "action": "scope_narrowing",
      "fallback": "multi_section_breakdown"
    },
    "overly_narrow_query": {
      "action": "scope_expansion",
      "fallback": "context_enrichment"
    },
    "missing_context": {
      "action": "context_inference",
      "fallback": "default_parameters"
    }
  }
}
```

#### 4.2 制約調整ロジック
```python
def adjust_constraints(raw_constraints, query_complexity):
    adjusted = raw_constraints.copy()
    
    # 複雑度に応じた自動調整
    if query_complexity == "high":
        adjusted["search_iterations"] *= 1.5
        adjusted["max_sections"] += 2
    
    # リソース制限チェック
    if adjusted["target_length"] > 15000:
        adjusted["target_length"] = 15000
        adjusted["max_sections"] = min(adjusted["max_sections"], 10)
    
    return adjusted
```

## 検証・テストケース

### テストケース1: 基本的な技術調査
```json
{
  "input": "ブロックチェーン技術の仕組みと応用について",
  "expected_parsing": {
    "main_topic": "ブロックチェーン技術",
    "aspects": ["仕組み", "応用"],
    "query_type": "explanatory_survey",
    "estimated_sections": 6,
    "search_strategy": "breadth_first"
  }
}
```

### テストケース2: 複雑な比較分析
```json
{
  "input": "量子コンピュータと従来コンピュータの計算能力、実用性、コスト面での徹底比較",
  "expected_parsing": {
    "main_topic": "コンピュータ技術比較",
    "comparison_axes": ["計算能力", "実用性", "コスト"],
    "query_type": "multi_dimensional_comparison",
    "estimated_sections": 8,
    "search_strategy": "structured_comparative"
  }
}
```

### テストケース3: エラーケース
```json
{
  "input": "なんか面白いAIの話",
  "error_type": "ambiguous_query",
  "fallback_action": "scope_clarification",
  "default_parsing": {
    "main_topic": "人工知能",
    "query_type": "general_survey",
    "estimated_sections": 4,
    "search_strategy": "exploratory"
  }
}
```

## 実装仕様

### クラス設計
```python
class ResearchPlannerInputProcessor:
    def __init__(self):
        self.query_patterns = load_query_patterns()
        self.domain_knowledge = load_domain_knowledge()
    
    def parse_user_input(self, raw_input):
        # 1. クエリ解析
        parsed_query = self.analyze_query(raw_input)
        
        # 2. 制約推定
        estimated_constraints = self.estimate_constraints(parsed_query)
        
        # 3. パラメータ構造化
        structured_params = self.structure_parameters(
            parsed_query, estimated_constraints
        )
        
        return structured_params
    
    def validate_input(self, structured_params):
        # 入力妥当性検証
        pass
    
    def apply_fallback(self, error_type, partial_params):
        # エラー時フォールバック処理
        pass
```

この入力形式定義により、多様なユーザクエリを一貫した構造化パラメータに変換し、後続のResearch Planner処理に適切に渡すことができます。