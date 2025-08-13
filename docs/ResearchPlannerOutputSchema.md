# Research Planner - 出力形式定義 (JSON研究計画スキーマ)

## 概要
Research Plannerが生成する構造化研究計画のJSONスキーマ定義。後続のIterative Researcher、Self-Evolution、Final Integratorが利用する標準形式。

## メインスキーマ構造

### 1. 研究計画全体スキーマ
```json
{
  "$schema": "https://ttd-dr.com/schema/research-plan-v1.0.json",
  "plan_metadata": {
    "plan_id": "string",              // 一意識別子
    "created_at": "ISO8601 datetime", // 作成日時
    "version": "string",              // スキーマバージョン
    "estimated_duration": "number",   // 推定処理時間(分)
    "complexity_score": "number"      // 複雑度スコア (1-10)
  },
  "research_objective": {
    "main_question": "string",        // メイン研究質問
    "sub_questions": ["string"],      // サブ質問配列
    "scope": "string",                // 研究範囲記述
    "expected_outcomes": ["string"],  // 期待される成果
    "success_criteria": ["string"]    // 成功基準
  },
  "structure_plan": {
    "report_length": "number",        // 目標文字数
    "section_count": "number",        // セクション数
    "sections": [                     // セクション詳細配列
      {
        "section_id": "string",
        "title": "string",
        "description": "string",
        "target_length": "number",
        "priority": "number",         // 優先度 (1-5)
        "dependencies": ["string"],   // 依存セクションID
        "subsections": [
          {
            "subsection_id": "string",
            "title": "string",
            "key_points": ["string"],
            "evidence_requirements": ["string"]
          }
        ]
      }
    ]
  },
  "search_strategy": {
    "total_iterations": "number",     // 総検索反復数
    "search_phases": [                // 検索フェーズ配列
      {
        "phase_id": "string",
        "phase_name": "string",
        "target_sections": ["string"], // 対象セクションID
        "search_focus": "string",      // 検索焦点
        "query_types": ["string"],     // クエリタイプ
        "iteration_count": "number"    // フェーズ内反復数
      }
    ],
    "source_requirements": {
      "academic_sources": "number",    // 学術ソース最小数
      "recent_sources": "number",      // 最新ソース最小数
      "diverse_sources": "number",     // 多様ソース最小数
      "primary_sources": "number"      // 一次ソース最小数
    }
  },
  "quality_criteria": {
    "coverage_thresholds": {
      "minimum_coverage": "number",    // 最小カバレッジ (0.0-1.0)
      "target_coverage": "number",     // 目標カバレッジ (0.0-1.0)
      "section_balance": "number"      // セクション間バランス閾値
    },
    "evidence_standards": {
      "citation_density": "number",    // 引用密度 (citations/1000words)
      "source_reliability": "number",  // ソース信頼性最小値
      "fact_verification": "boolean"   // ファクトチェック要求
    },
    "coherence_requirements": {
      "logical_flow": "boolean",       // 論理的流れ要求
      "consistency_check": "boolean",  // 一貫性チェック要求
      "contradiction_detection": "boolean" // 矛盾検出要求
    }
  },
  "evolution_parameters": {
    "self_evolution_enabled": "boolean",
    "variant_count": "number",        // 生成バリアント数
    "evolution_iterations": "number", // 進化反復数
    "evaluation_criteria": [
      {
        "criterion_name": "string",
        "weight": "number",           // 重み (0.0-1.0)
        "threshold": "number"         // 閾値
      }
    ]
  }
}
```

### 2. セクション詳細構造
```json
{
  "section_detail": {
    "section_id": "intro_001",
    "title": "イントロダクション",
    "description": "研究背景と問題提起",
    "target_length": 800,
    "priority": 5,
    "content_requirements": {
      "required_elements": [
        "背景情報",
        "問題定義",
        "研究意義",
        "論文構成"
      ],
      "key_concepts": ["人工知能", "自然言語処理"],
      "evidence_types": ["統計データ", "先行研究", "業界動向"]
    },
    "search_specifications": {
      "primary_keywords": ["AI", "NLP", "チャットボット"],
      "secondary_keywords": ["対話システム", "言語モデル"],
      "search_operators": ["AND", "OR", "NOT"],
      "source_filters": {
        "publication_year": ">= 2020",
        "source_types": ["academic", "industry_report"],
        "languages": ["ja", "en"]
      }
    },
    "quality_indicators": {
      "completion_criteria": [
        "背景情報の網羅性 >= 80%",
        "問題定義の明確性 >= 90%",
        "引用数 >= 3"
      ],
      "deficiency_markers": [
        "具体的データ不足",
        "先行研究不足",
        "問題定義曖昧"
      ]
    }
  }
}
```

### 3. 検索戦略詳細
```json
{
  "search_strategy_detail": {
    "phase_1": {
      "phase_name": "広範囲情報収集",
      "duration": "iterations 1-5",
      "objectives": [
        "基本概念の理解",
        "研究分野の全体像把握",
        "主要プレイヤー特定"
      ],
      "search_patterns": [
        {
          "pattern_type": "broad_survey",
          "query_template": "{main_topic} AND (overview OR survey OR review)",
          "source_priority": ["academic_review", "industry_report"],
          "depth_level": "shallow",
          "coverage_target": 0.6
        }
      ]
    },
    "phase_2": {
      "phase_name": "詳細調査・分析",
      "duration": "iterations 6-12",
      "objectives": [
        "特定技術の深掘り",
        "比較分析データ収集",
        "実装事例調査"
      ],
      "search_patterns": [
        {
          "pattern_type": "focused_analysis",
          "query_template": "{specific_technology} AND (implementation OR case_study)",
          "source_priority": ["technical_paper", "case_study"],
          "depth_level": "deep",
          "coverage_target": 0.9
        }
      ]
    },
    "phase_3": {
      "phase_name": "検証・補完",
      "duration": "iterations 13-15",
      "objectives": [
        "情報の検証",
        "不足部分の補完",
        "反証の確認"
      ],
      "search_patterns": [
        {
          "pattern_type": "verification",
          "query_template": "{claim} AND (contradiction OR limitation OR criticism)",
          "source_priority": ["peer_review", "critical_analysis"],
          "depth_level": "verification",
          "coverage_target": 1.0
        }
      ]
    }
  }
}
```

### 4. 品質評価基準
```json
{
  "quality_evaluation": {
    "coverage_metrics": {
      "topic_coverage": {
        "calculation": "covered_topics / total_required_topics",
        "threshold": 0.85,
        "weight": 0.3
      },
      "evidence_coverage": {
        "calculation": "cited_evidence / required_evidence",
        "threshold": 0.90,
        "weight": 0.3
      },
      "depth_coverage": {
        "calculation": "detailed_sections / total_sections",
        "threshold": 0.75,
        "weight": 0.2
      }
    },
    "quality_metrics": {
      "coherence_score": {
        "calculation": "logical_connections / total_connections",
        "threshold": 0.80,
        "weight": 0.25
      },
      "accuracy_score": {
        "calculation": "verified_facts / total_facts",
        "threshold": 0.95,
        "weight": 0.35
      },
      "novelty_score": {
        "calculation": "unique_insights / total_insights",
        "threshold": 0.20,
        "weight": 0.15
      }
    }
  }
}
```

## 実装クラス設計

### メインプランナークラス
```python
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime

@dataclass
class ResearchPlan:
    plan_metadata: PlanMetadata
    research_objective: ResearchObjective
    structure_plan: StructurePlan
    search_strategy: SearchStrategy
    quality_criteria: QualityCriteria
    evolution_parameters: EvolutionParameters
    
    def to_json(self) -> str:
        """JSON形式でプランを出力"""
        pass
    
    def validate(self) -> bool:
        """プランの妥当性検証"""
        pass
    
    def estimate_resources(self) -> Dict:
        """必要リソースの推定"""
        pass

@dataclass
class PlanMetadata:
    plan_id: str
    created_at: datetime
    version: str
    estimated_duration: int
    complexity_score: float

@dataclass
class Section:
    section_id: str
    title: str
    description: str
    target_length: int
    priority: int
    dependencies: List[str]
    content_requirements: ContentRequirements
    search_specifications: SearchSpecifications
    quality_indicators: QualityIndicators
```

### バリデーション関数
```python
def validate_research_plan(plan: ResearchPlan) -> Dict[str, bool]:
    """研究計画の包括的バリデーション"""
    validation_results = {
        "structure_valid": validate_structure(plan.structure_plan),
        "search_strategy_valid": validate_search_strategy(plan.search_strategy),
        "quality_criteria_valid": validate_quality_criteria(plan.quality_criteria),
        "resource_feasible": validate_resource_requirements(plan),
        "timeline_realistic": validate_timeline(plan)
    }
    return validation_results

def validate_section_dependencies(sections: List[Section]) -> bool:
    """セクション依存関係の循環参照チェック"""
    pass

def validate_search_coverage(search_strategy: SearchStrategy, 
                           sections: List[Section]) -> bool:
    """検索戦略のセクションカバレッジ検証"""
    pass
```

## 使用例

### 基本的な技術調査プラン
```json
{
  "plan_metadata": {
    "plan_id": "rp_ai_chatbot_001",
    "created_at": "2025-01-15T10:00:00Z",
    "version": "1.0",
    "estimated_duration": 45,
    "complexity_score": 6.5
  },
  "research_objective": {
    "main_question": "AIチャットボットの自然言語処理技術の現状と課題",
    "sub_questions": [
      "主要なNLP技術は何か？",
      "現在の技術的限界は？",
      "今後の発展方向は？"
    ],
    "scope": "2020年以降の技術動向に焦点",
    "expected_outcomes": [
      "技術概要レポート",
      "比較分析表",
      "実装指針"
    ]
  },
  "structure_plan": {
    "report_length": 5000,
    "section_count": 6,
    "sections": [
      {
        "section_id": "intro_001",
        "title": "イントロダクション",
        "target_length": 800,
        "priority": 5
      },
      {
        "section_id": "tech_overview_002",
        "title": "技術概要",
        "target_length": 1200,
        "priority": 5
      }
    ]
  }
}
```

このスキーマにより、一貫性のある構造化された研究計画を生成し、後続の処理段階で効率的に利用できます。