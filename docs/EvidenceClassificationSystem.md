# 充足基準・エビデンス要件の分類体系設計

## 概要
TTD-DRシステムにおける研究品質を客観的に評価するための充足基準とエビデンス要件の分類体系。セクション別、研究タイプ別の詳細基準を定義。

## 1. 充足基準の階層構造

### 1.1 レベル1: 基本充足基準
```json
{
  "basic_sufficiency_criteria": {
    "content_completeness": {
      "description": "要求された内容要素の網羅度",
      "measurement": "covered_elements / required_elements",
      "thresholds": {
        "minimum": 0.80,
        "good": 0.90,
        "excellent": 0.95
      }
    },
    "information_accuracy": {
      "description": "情報の正確性・信頼性",
      "measurement": "verified_facts / total_facts",
      "thresholds": {
        "minimum": 0.85,
        "good": 0.92,
        "excellent": 0.97
      }
    },
    "source_diversity": {
      "description": "情報源の多様性",
      "measurement": "unique_source_types / min_required_types",
      "thresholds": {
        "minimum": 1.0,
        "good": 1.5,
        "excellent": 2.0
      }
    },
    "citation_adequacy": {
      "description": "適切な引用・出典",
      "measurement": "cited_claims / verifiable_claims",
      "thresholds": {
        "minimum": 0.70,
        "good": 0.85,
        "excellent": 0.95
      }
    }
  }
}
```

### 1.2 レベル2: 品質充足基準
```json
{
  "quality_sufficiency_criteria": {
    "logical_coherence": {
      "description": "論理的一貫性・整合性",
      "measurement": "coherent_connections / total_connections",
      "thresholds": {
        "minimum": 0.75,
        "good": 0.85,
        "excellent": 0.93
      }
    },
    "depth_of_analysis": {
      "description": "分析の深度・洞察度",
      "measurement": "deep_insights / surface_statements",
      "thresholds": {
        "minimum": 0.30,
        "good": 0.50,
        "excellent": 0.70
      }
    },
    "neutrality_balance": {
      "description": "中立性・バランス",
      "measurement": "balanced_perspectives / biased_statements",
      "thresholds": {
        "minimum": 2.0,
        "good": 3.0,
        "excellent": 5.0
      }
    },
    "novelty_contribution": {
      "description": "新規性・独自性",
      "measurement": "unique_insights / total_insights",
      "thresholds": {
        "minimum": 0.15,
        "good": 0.25,
        "excellent": 0.40
      }
    }
  }
}
```

### 1.3 レベル3: 高度充足基準
```json
{
  "advanced_sufficiency_criteria": {
    "synthesis_quality": {
      "description": "情報統合・シンセシス品質",
      "measurement": "synthesized_connections / isolated_facts",
      "thresholds": {
        "minimum": 1.5,
        "good": 2.5,
        "excellent": 4.0
      }
    },
    "practical_applicability": {
      "description": "実用性・応用可能性",
      "measurement": "actionable_insights / theoretical_statements",
      "thresholds": {
        "minimum": 0.25,
        "good": 0.40,
        "excellent": 0.60
      }
    },
    "future_relevance": {
      "description": "将来性・持続的価値",
      "measurement": "forward_looking_insights / current_facts",
      "thresholds": {
        "minimum": 0.20,
        "good": 0.35,
        "excellent": 0.50
      }
    }
  }
}
```

## 2. エビデンス要件分類体系

### 2.1 エビデンスタイプ分類
```json
{
  "evidence_types": {
    "primary_evidence": {
      "original_research": {
        "description": "オリジナル研究・実験結果",
        "reliability_weight": 1.0,
        "required_attributes": ["methodology", "sample_size", "peer_review"],
        "min_count_per_section": 1
      },
      "empirical_data": {
        "description": "実証データ・統計",
        "reliability_weight": 0.9,
        "required_attributes": ["source", "collection_method", "sample_size"],
        "min_count_per_section": 2
      },
      "expert_statements": {
        "description": "専門家の見解・証言",
        "reliability_weight": 0.8,
        "required_attributes": ["credentials", "relevance", "context"],
        "min_count_per_section": 1
      }
    },
    "secondary_evidence": {
      "literature_review": {
        "description": "文献レビュー・メタ分析",
        "reliability_weight": 0.85,
        "required_attributes": ["scope", "methodology", "recency"],
        "min_count_per_section": 1
      },
      "case_studies": {
        "description": "ケーススタディ・事例分析",
        "reliability_weight": 0.75,
        "required_attributes": ["context", "methodology", "generalizability"],
        "min_count_per_section": 1
      },
      "industry_reports": {
        "description": "業界レポート・市場分析",
        "reliability_weight": 0.70,
        "required_attributes": ["organization", "methodology", "scope"],
        "min_count_per_section": 1
      }
    },
    "supporting_evidence": {
      "technical_documentation": {
        "description": "技術文書・仕様書",
        "reliability_weight": 0.80,
        "required_attributes": ["authoritativeness", "currency", "completeness"],
        "min_count_per_section": 0
      },
      "news_media": {
        "description": "ニュース・メディア報道",
        "reliability_weight": 0.60,
        "required_attributes": ["source_credibility", "fact_checking", "bias_assessment"],
        "min_count_per_section": 0
      },
      "web_resources": {
        "description": "ウェブリソース・ブログ",
        "reliability_weight": 0.50,
        "required_attributes": ["authority", "verifiability", "recency"],
        "min_count_per_section": 0
      }
    }
  }
}
```

### 2.2 セクション別エビデンス要件
```json
{
  "section_evidence_requirements": {
    "introduction": {
      "total_evidence_count": 3,
      "required_types": ["industry_reports", "literature_review"],
      "preferred_types": ["empirical_data", "expert_statements"],
      "recency_requirement": "within_3_years",
      "diversity_requirement": "min_2_source_types"
    },
    "technical_overview": {
      "total_evidence_count": 5,
      "required_types": ["technical_documentation", "original_research"],
      "preferred_types": ["case_studies", "empirical_data"],
      "recency_requirement": "within_2_years",
      "diversity_requirement": "min_3_source_types"
    },
    "comparative_analysis": {
      "total_evidence_count": 7,
      "required_types": ["empirical_data", "case_studies"],
      "preferred_types": ["original_research", "literature_review"],
      "recency_requirement": "within_1_year",
      "diversity_requirement": "min_4_source_types"
    },
    "implementation": {
      "total_evidence_count": 4,
      "required_types": ["case_studies", "technical_documentation"],
      "preferred_types": ["expert_statements", "original_research"],
      "recency_requirement": "within_2_years",
      "diversity_requirement": "min_2_source_types"
    },
    "future_prospects": {
      "total_evidence_count": 3,
      "required_types": ["expert_statements", "industry_reports"],
      "preferred_types": ["original_research", "literature_review"],
      "recency_requirement": "within_1_year",
      "diversity_requirement": "min_2_source_types"
    }
  }
}
```

## 3. 研究タイプ別基準調整

### 3.1 技術調査特化基準
```json
{
  "technical_research_criteria": {
    "evidence_weight_adjustments": {
      "technical_documentation": 1.2,
      "original_research": 1.1,
      "empirical_data": 1.1,
      "case_studies": 1.0,
      "industry_reports": 0.9
    },
    "additional_requirements": {
      "implementation_examples": {
        "min_count": 2,
        "attributes": ["code_samples", "architecture_diagrams", "performance_metrics"]
      },
      "technical_specifications": {
        "min_count": 3,
        "attributes": ["version_info", "compatibility", "requirements"]
      },
      "benchmark_data": {
        "min_count": 1,
        "attributes": ["methodology", "baseline_comparison", "statistical_significance"]
      }
    }
  }
}
```

### 3.2 比較分析特化基準
```json
{
  "comparative_analysis_criteria": {
    "comparison_completeness": {
      "all_subjects_covered": "required",
      "all_dimensions_addressed": "required",
      "balanced_treatment": "minimum_0.8_ratio"
    },
    "evidence_consistency": {
      "same_evaluation_criteria": "required",
      "comparable_data_sources": "preferred",
      "temporal_alignment": "within_same_period"
    },
    "objectivity_requirements": {
      "neutral_language": "required",
      "bias_acknowledgment": "required",
      "limitation_discussion": "required"
    }
  }
}
```

## 4. 自動評価アルゴリズム

### 4.1 充足度計算
```python
def calculate_sufficiency_score(section_content, criteria):
    """セクション充足度の計算"""
    scores = {}
    
    # 基本充足基準
    scores['content_completeness'] = calculate_content_coverage(
        section_content, criteria.required_elements
    )
    
    # 品質充足基準  
    scores['logical_coherence'] = analyze_logical_flow(section_content)
    
    # エビデンス充足基準
    scores['evidence_adequacy'] = evaluate_evidence_quality(
        section_content, criteria.evidence_requirements
    )
    
    # 重み付き総合スコア
    weighted_score = sum(
        score * criteria.weights[criterion]
        for criterion, score in scores.items()
    )
    
    return {
        'overall_score': weighted_score,
        'component_scores': scores,
        'deficiencies': identify_deficiencies(scores, criteria.thresholds)
    }

def calculate_content_coverage(content, required_elements):
    """コンテンツカバレッジの計算"""
    covered_elements = extract_covered_elements(content)
    coverage_ratio = len(covered_elements) / len(required_elements)
    return min(coverage_ratio, 1.0)

def analyze_logical_flow(content):
    """論理的流れの分析"""
    sentences = extract_sentences(content)
    coherence_score = 0.0
    
    for i in range(len(sentences) - 1):
        connection_strength = calculate_sentence_connection(
            sentences[i], sentences[i+1]
        )
        coherence_score += connection_strength
    
    return coherence_score / (len(sentences) - 1) if len(sentences) > 1 else 0.0
```

### 4.2 エビデンス品質評価
```python
def evaluate_evidence_quality(content, evidence_requirements):
    """エビデンス品質の評価"""
    extracted_evidence = extract_evidence_items(content)
    
    quality_score = 0.0
    total_weight = 0.0
    
    for evidence in extracted_evidence:
        evidence_type = classify_evidence_type(evidence)
        reliability_weight = get_reliability_weight(evidence_type)
        
        # 個別エビデンスの品質評価
        individual_score = evaluate_individual_evidence(evidence)
        
        quality_score += individual_score * reliability_weight
        total_weight += reliability_weight
    
    # 要件充足度チェック
    requirement_satisfaction = check_evidence_requirements(
        extracted_evidence, evidence_requirements
    )
    
    final_score = (quality_score / total_weight) * requirement_satisfaction
    return min(final_score, 1.0)

def extract_evidence_items(content):
    """エビデンス項目の抽出"""
    # 引用、データ、専門家発言等の抽出
    citations = extract_citations(content)
    data_points = extract_data_points(content)
    expert_quotes = extract_expert_quotes(content)
    
    return citations + data_points + expert_quotes
```

## 5. 不足検出・改善提案

### 5.1 不足項目検出
```json
{
  "deficiency_detection": {
    "content_gaps": {
      "missing_elements": ["検出された不足要素"],
      "insufficient_coverage": ["カバレッジ不足領域"],
      "superficial_treatment": ["表面的な扱いの項目"]
    },
    "evidence_gaps": {
      "missing_evidence_types": ["不足しているエビデンスタイプ"],
      "weak_evidence": ["信頼性の低いエビデンス"],
      "outdated_sources": ["古い情報源"]
    },
    "quality_issues": {
      "logical_inconsistencies": ["論理的矛盾"],
      "bias_indicators": ["バイアスの兆候"],
      "unsupported_claims": ["根拠不足の主張"]
    }
  }
}
```

### 5.2 改善提案生成
```python
def generate_improvement_suggestions(deficiencies, section_type):
    """改善提案の生成"""
    suggestions = []
    
    for deficiency in deficiencies:
        if deficiency.type == "content_gap":
            suggestions.append({
                "type": "content_enhancement",
                "priority": "high",
                "action": f"Add detailed explanation of {deficiency.missing_element}",
                "search_query": f"{deficiency.missing_element} detailed explanation",
                "expected_improvement": "content_completeness +0.2"
            })
        
        elif deficiency.type == "evidence_gap":
            suggestions.append({
                "type": "evidence_strengthening", 
                "priority": "medium",
                "action": f"Find {deficiency.missing_evidence_type} evidence",
                "search_query": f"{section_type} {deficiency.missing_evidence_type}",
                "expected_improvement": "evidence_adequacy +0.15"
            })
    
    return prioritize_suggestions(suggestions)
```

この分類体系により、TTD-DRシステムは研究の品質を客観的に測定し、具体的な改善方向を特定できます。