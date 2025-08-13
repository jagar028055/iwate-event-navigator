# Research Planner - プロンプトテンプレート設計

## 概要
Task toolで呼び出すResearch Planner用の高性能プロンプトテンプレート。構造化された研究計画を確実に生成するための設計仕様。

## メインプロンプトテンプレート

### 1. 基本研究計画生成プロンプト
```markdown
# TTD-DR Research Planner - 構造化研究計画生成

## ロール
あなたは高度な研究計画立案専門家です。ユーザの研究質問を分析し、包括的で実行可能な構造化研究計画を作成してください。

## 入力情報
**ユーザクエリ**: {user_query}
**制約条件**: {constraints}
**分野コンテキスト**: {domain_context}
**ユーザ設定**: {user_preferences}

## 出力要件
以下のJSON形式で完全な研究計画を生成してください:

```json
{
  "plan_metadata": {
    "plan_id": "rp_{timestamp}_{hash}",
    "created_at": "{current_datetime}",
    "version": "1.0",
    "estimated_duration": {duration_minutes},
    "complexity_score": {1-10}
  },
  "research_objective": {
    "main_question": "{明確で具体的なメイン研究質問}",
    "sub_questions": ["{詳細なサブ質問リスト}"],
    "scope": "{研究範囲の明確な定義}",
    "expected_outcomes": ["{期待される具体的成果}"],
    "success_criteria": ["{明確で測定可能な成功基準}"]
  },
  "structure_plan": {
    "report_length": {target_word_count},
    "section_count": {optimal_section_count},
    "sections": [
      {
        "section_id": "{unique_section_id}",
        "title": "{セクションタイトル}",
        "description": "{セクション内容説明}",
        "target_length": {words},
        "priority": {1-5},
        "dependencies": ["{依存セクションID}"],
        "subsections": [
          {
            "subsection_id": "{unique_subsection_id}",
            "title": "{サブセクションタイトル}",
            "key_points": ["{重要ポイント}"],
            "evidence_requirements": ["{必要エビデンス}"]
          }
        ]
      }
    ]
  },
  "search_strategy": {
    "total_iterations": {optimized_iteration_count},
    "search_phases": [
      {
        "phase_id": "phase_{number}",
        "phase_name": "{フェーズ名}",
        "target_sections": ["{対象セクションID}"],
        "search_focus": "{検索焦点}",
        "query_types": ["{クエリタイプ}"],
        "iteration_count": {phase_iterations}
      }
    ],
    "source_requirements": {
      "academic_sources": {min_academic_sources},
      "recent_sources": {min_recent_sources},
      "diverse_sources": {min_diverse_sources},
      "primary_sources": {min_primary_sources}
    }
  },
  "quality_criteria": {
    "coverage_thresholds": {
      "minimum_coverage": {min_coverage_ratio},
      "target_coverage": {target_coverage_ratio},
      "section_balance": {balance_threshold}
    },
    "evidence_standards": {
      "citation_density": {citations_per_1000_words},
      "source_reliability": {min_reliability_score},
      "fact_verification": {true/false}
    },
    "coherence_requirements": {
      "logical_flow": true,
      "consistency_check": true,
      "contradiction_detection": true
    }
  },
  "evolution_parameters": {
    "self_evolution_enabled": {true/false},
    "variant_count": {variant_number},
    "evolution_iterations": {evolution_iterations},
    "evaluation_criteria": [
      {
        "criterion_name": "{評価基準名}",
        "weight": {0.0-1.0},
        "threshold": {閾値}
      }
    ]
  }
}
```

## 設計原則
1. **明確性**: 各セクションの目的と内容を明確に定義
2. **実行可能性**: Claude Codeツールで実現可能な計画
3. **測定可能性**: 進捗と品質を客観的に評価可能
4. **適応性**: ユーザの要求レベルに応じた柔軟な調整
5. **効率性**: リソース使用量を最適化した設計

## 重要な考慮事項
- セクション間の論理的依存関係を適切に設定
- 検索戦略は段階的に深度を増す設計
- 品質基準は実現可能かつ高品質を保証する水準
- エビデンス要件は信頼性と効率性のバランス

出力は必ず完全で有効な JSON 形式としてください。
```

### 2. 特化型プロンプトテンプレート

#### 2.1 技術調査特化プロンプト
```markdown
# TTD-DR Research Planner - 技術調査特化版

## 専門領域設定
技術文書・システム実装に特化した研究計画を生成します。

## 追加考慮事項
- **技術的深度**: 実装レベルの詳細を含む
- **実用性重視**: 実際の開発・導入に役立つ情報
- **最新性**: 技術の急速な変化に対応
- **実証データ**: ベンチマーク・性能データを重視

## 特化セクション構成
推奨セクション構成：
1. 技術概要・背景
2. 核心技術・アルゴリズム
3. 実装・アーキテクチャ
4. 性能・評価
5. 課題・制限事項
6. 今後の展望

## 検索戦略調整
- 技術論文・特許を優先
- GitHub・技術ブログも対象
- 実装事例・ケーススタディ重視
- ベンダー資料・ホワイトペーパー活用

{base_prompt}
```

#### 2.2 比較分析特化プロンプト
```markdown
# TTD-DR Research Planner - 比較分析特化版

## 比較分析設計
複数対象の体系的比較に特化した研究計画を生成します。

## 比較軸設定
各比較対象について以下の軸を設定：
- **機能・性能軸**: 定量的比較可能な指標
- **技術・方式軸**: アプローチの違い
- **実用・運用軸**: 実際の使用における差異
- **コスト・効率軸**: 経済性・効率性

## 構造化比較マトリックス
section構造に比較マトリックスを組み込み：
```json
"comparison_matrix": {
  "subjects": ["{比較対象リスト}"],
  "comparison_axes": ["{比較軸リスト}"],
  "evaluation_criteria": ["{評価基準}"]
}
```

{base_prompt}
```

### 3. 品質制御プロンプト

#### 3.1 計画妥当性検証プロンプト
```markdown
# Research Plan Validation

以下の研究計画の妥当性を検証し、改善提案を行ってください：

## 検証項目
1. **構造整合性**: セクション間の論理的関係
2. **実現可能性**: 制約内での実行可能性
3. **完全性**: 研究目的に対する網羅性
4. **効率性**: リソース使用の最適性
5. **品質基準**: 設定基準の適切性

## 入力計画
```json
{research_plan_json}
```

## 出力形式
```json
{
  "validation_result": {
    "overall_score": {0-100},
    "validation_items": {
      "structure_integrity": {"score": {0-100}, "issues": ["問題点"]},
      "feasibility": {"score": {0-100}, "issues": ["問題点"]},
      "completeness": {"score": {0-100}, "issues": ["問題点"]},
      "efficiency": {"score": {0-100}, "issues": ["問題点"]},
      "quality_standards": {"score": {0-100}, "issues": ["問題点"]}
    },
    "improvement_suggestions": [
      {
        "category": "構造改善",
        "priority": "high",
        "suggestion": "具体的改善提案",
        "expected_impact": "改善効果説明"
      }
    ]
  }
}
```
```

### 4. エラーハンドリング・フォールバックプロンプト

#### 4.1 曖昧クエリ対応プロンプト
```markdown
# Ambiguous Query Handler

## 状況
ユーザクエリが曖昧または不完全です。

## 入力
**曖昧クエリ**: {ambiguous_query}
**部分情報**: {partial_context}

## 対応手順
1. **推測可能要素の抽出**
2. **デフォルト設定の適用**
3. **明確化質問の生成**
4. **フォールバック計画の作成**

## 出力形式
```json
{
  "interpretation": {
    "inferred_topic": "{推測されるトピック}",
    "confidence_level": {0.0-1.0},
    "assumptions": ["{仮定した要素}"]
  },
  "clarification_questions": [
    "{具体的な質問1}",
    "{具体的な質問2}"
  ],
  "fallback_plan": {research_plan_json},
  "customization_points": [
    {
      "element": "{カスタマイズ要素}",
      "options": ["{選択肢}"],
      "recommendation": "{推奨値}"
    }
  ]
}
```
```

### 5. 動的調整プロンプト

#### 5.1 制約適応プロンプト
```markdown
# Constraint Adaptation

## 制約条件変更
以下の制約変更に対応して研究計画を調整してください：

**新制約**: {new_constraints}
**既存計画**: {existing_plan}

## 調整優先順位
1. 品質維持
2. 完全性保持
3. 効率最適化
4. 柔軟性確保

## 調整戦略
- **時間制約**: 並列化・優先度調整
- **リソース制約**: 検索効率化・キャッシュ活用
- **品質制約**: 基準調整・代替指標
- **スコープ制約**: 焦点絞り込み・詳細度調整

{adaptation_output_format}
```

## 実装設計

### プロンプト選択ロジック
```python
def select_prompt_template(query_analysis, constraints):
    if query_analysis.query_type == "technical_survey":
        return TECHNICAL_SPECIALIZED_PROMPT
    elif query_analysis.query_type == "comparative_analysis":
        return COMPARATIVE_SPECIALIZED_PROMPT
    elif query_analysis.ambiguity_level > 0.7:
        return AMBIGUOUS_QUERY_PROMPT
    else:
        return BASE_RESEARCH_PROMPT

def customize_prompt(template, input_data):
    """プロンプトテンプレートをカスタマイズ"""
    return template.format(**input_data)
```

### 品質保証メカニズム
```python
def validate_prompt_output(generated_plan):
    """生成された計画の妥当性検証"""
    validation_prompt = VALIDATION_PROMPT.format(
        research_plan_json=generated_plan
    )
    validation_result = call_validation_agent(validation_prompt)
    
    if validation_result.overall_score < 70:
        return apply_improvement_suggestions(generated_plan, 
                                           validation_result.suggestions)
    return generated_plan
```

これらのプロンプトテンプレートにより、多様な研究要求に対して一貫性のある高品質な研究計画を生成できます。