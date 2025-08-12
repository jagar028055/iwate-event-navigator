#!/usr/bin/env python3
"""
TTD-DR Research Planner - Test Data & Demonstration
Task 1.2.2 - Test Data Generation and Real-world Examples

Comprehensive test data, example queries, and demonstration scenarios
for the Research Planner agent.
"""

import json
from research_planner_agent import ResearchPlannerAgent

# Test case categories
TEST_CATEGORIES = {
    'basic_queries': [
        "AIとは何か",
        "機械学習の基本概念",
        "深層学習の概要",
        "自然言語処理について",
        "コンピュータビジョンの基礎"
    ],
    
    'technical_surveys': [
        "Transformerアーキテクチャの技術的詳細と実装方法",
        "分散機械学習システムの設計原理とスケーラビリティ",
        "リアルタイム推薦システムの技術スタックと最適化手法",
        "エッジAIデバイスの処理能力向上技術",
        "量子機械学習の現状と技術的課題"
    ],
    
    'comparative_analyses': [
        "GPT-4、Claude 3.5、Gemini Proの性能・機能・コスト比較",
        "TensorFlow vs PyTorch: 深層学習フレームワーク詳細比較",
        "AWSとGoogle Cloudの機械学習サービス比較分析",
        "BERT、RoBERTa、DeBERTaの言語理解性能比較",
        "自動運転技術: Tesla vs Waymo vs Cruiseの技術戦略比較"
    ],
    
    'implementation_studies': [
        "大規模言語モデルの効率的なファインチューニング実装",
        "リアルタイム画像認識システムの構築方法",
        "分散深層学習の実装アーキテクチャ設計",
        "チャットボットシステムの企業導入実装ガイド",
        "MLOpsパイプラインの構築と運用自動化"
    ],
    
    'academic_research': [
        "説明可能AI(XAI)の理論的基盤と評価手法の包括的調査",
        "連合学習におけるプライバシー保護技術の最新研究動向",
        "多言語大規模言語モデルの言語間転移学習機構の解析",
        "ニューラル・シンボリックAIの統合アプローチの理論的考察",
        "人工知能の倫理的課題と規制フレームワークの国際比較研究"
    ],
    
    'industry_reports': [
        "2024年AI市場動向と主要プレイヤーの戦略分析",
        "企業のAI導入状況と投資対効果の実態調査",
        "AI人材の需給状況と人材育成の課題分析",
        "自動運転業界の市場予測と技術競争の現状",
        "AI半導体市場の成長予測と競合分析"
    ]
}

# Constraint templates for different use cases
CONSTRAINT_TEMPLATES = {
    'quick_overview': {
        'target_length': 2000,
        'max_sections': 4,
        'search_iterations': 8
    },
    
    'standard_research': {
        'target_length': 5000,
        'max_sections': 6,
        'search_iterations': 12
    },
    
    'comprehensive_study': {
        'target_length': 8000,
        'max_sections': 8,
        'search_iterations': 15
    },
    
    'academic_paper': {
        'target_length': 10000,
        'max_sections': 10,
        'search_iterations': 18,
        'academic_level': 'graduate',
        'citation_style': 'APA'
    },
    
    'industry_report': {
        'target_length': 6000,
        'max_sections': 7,
        'search_iterations': 12,
        'languages': ['ja', 'en']
    }
}

# Domain context templates
DOMAIN_CONTEXTS = {
    'ai_ml': {
        'field': 'AI/ML',
        'keywords': ['人工知能', '機械学習', '深層学習', 'ニューラルネットワーク'],
        'excluded_topics': []
    },
    
    'nlp': {
        'field': 'Natural Language Processing',
        'keywords': ['自然言語処理', 'NLP', '言語モデル', 'Transformer'],
        'excluded_topics': ['音声認識', '画像処理']
    },
    
    'computer_vision': {
        'field': 'Computer Vision',
        'keywords': ['画像認識', 'コンピュータビジョン', 'CNN', '物体検出'],
        'excluded_topics': ['音声', 'テキスト']
    },
    
    'robotics': {
        'field': 'Robotics',
        'keywords': ['ロボティクス', '自動化', '制御システム', 'センサー'],
        'excluded_topics': []
    },
    
    'autonomous_systems': {
        'field': 'Autonomous Systems',
        'keywords': ['自動運転', '自律システム', 'センサーフュージョン'],
        'excluded_topics': []
    }
}

# User preference templates
USER_PREFERENCES = {
    'evidence_focused': {
        'evidence_weight': 0.9,
        'creativity_level': 0.3,
        'technical_depth': 0.8
    },
    
    'creative_exploration': {
        'evidence_weight': 0.6,
        'creativity_level': 0.8,
        'technical_depth': 0.6
    },
    
    'technical_deep_dive': {
        'evidence_weight': 0.8,
        'creativity_level': 0.4,
        'technical_depth': 0.9
    },
    
    'balanced_approach': {
        'evidence_weight': 0.7,
        'creativity_level': 0.5,
        'technical_depth': 0.7
    }
}


def generate_test_data():
    """Generate comprehensive test data with expected outcomes"""
    
    agent = ResearchPlannerAgent()
    test_data = {}
    
    print("Generating test data for Research Planner...")
    
    for category, queries in TEST_CATEGORIES.items():
        print(f"Processing {category}...")
        test_data[category] = []
        
        for i, query in enumerate(queries):
            # Select appropriate constraints based on category
            if category == 'academic_research':
                constraints = CONSTRAINT_TEMPLATES['academic_paper']
                preferences = USER_PREFERENCES['evidence_focused']
            elif category == 'industry_reports':
                constraints = CONSTRAINT_TEMPLATES['industry_report']
                preferences = USER_PREFERENCES['balanced_approach']
            elif category == 'basic_queries':
                constraints = CONSTRAINT_TEMPLATES['quick_overview']
                preferences = USER_PREFERENCES['balanced_approach']
            else:
                constraints = CONSTRAINT_TEMPLATES['standard_research']
                preferences = USER_PREFERENCES['technical_deep_dive']
            
            # Select domain context
            if 'NLP' in query or '自然言語' in query or 'Transformer' in query:
                domain_context = DOMAIN_CONTEXTS['nlp']
            elif '画像' in query or 'ビジョン' in query or 'CV' in query:
                domain_context = DOMAIN_CONTEXTS['computer_vision']
            elif 'ロボット' in query or '自動運転' in query:
                domain_context = DOMAIN_CONTEXTS['autonomous_systems']
            else:
                domain_context = DOMAIN_CONTEXTS['ai_ml']
            
            # Generate plan
            result = agent.plan_research(query, constraints, domain_context, preferences)
            
            test_case = {
                'id': f"{category}_{i+1:02d}",
                'query': query,
                'constraints': constraints,
                'domain_context': domain_context,
                'user_preferences': preferences,
                'result': result,
                'timestamp': None  # Would be filled in real implementation
            }
            
            test_data[category].append(test_case)
    
    return test_data


def demonstrate_research_planner():
    """Demonstrate Research Planner capabilities with real examples"""
    
    agent = ResearchPlannerAgent()
    
    print("=== TTD-DR Research Planner Demonstration ===\n")
    
    # Demonstration 1: Basic Query
    print("📋 Demo 1: Basic Technical Query")
    print("Query: 'Transformerアーキテクチャの技術詳細'")
    
    result1 = agent.plan_research("Transformerアーキテクチャの技術詳細")
    
    if result1['status'] == 'success':
        plan1 = result1['plan']
        print(f"✅ Generated plan with {plan1['structure_plan']['section_count']} sections")
        print(f"📊 Complexity Score: {plan1['plan_metadata']['complexity_score']}")
        print(f"⏱️  Estimated Duration: {plan1['plan_metadata']['estimated_duration']} minutes")
        print(f"🔍 Search Iterations: {plan1['search_strategy']['total_iterations']}")
        print(f"📈 Quality Score: {result1['validation']['scores']['overall_score']:.3f}")
        
        print("\n📑 Section Structure:")
        for i, section in enumerate(plan1['structure_plan']['sections'], 1):
            print(f"  {i}. {section['title']} ({section['target_length']} words)")
    
    print("\n" + "="*60 + "\n")
    
    # Demonstration 2: Comparative Analysis
    print("📋 Demo 2: Comparative Analysis")
    print("Query: 'GPT-4とClaude 3.5の詳細性能比較'")
    
    constraints2 = {'target_length': 6000, 'max_sections': 7}
    result2 = agent.plan_research(
        "GPT-4とClaude 3.5の詳細性能比較", 
        constraints=constraints2
    )
    
    if result2['status'] == 'success':
        plan2 = result2['plan']
        print(f"✅ Generated comparative analysis plan")
        print(f"📊 Main Question: {plan2['research_objective']['main_question']}")
        print(f"🎯 Success Criteria:")
        for criterion in plan2['research_objective']['success_criteria']:
            print(f"   • {criterion}")
        
        print(f"\n🔍 Search Strategy ({len(plan2['search_strategy']['search_phases'])} phases):")
        for phase in plan2['search_strategy']['search_phases']:
            print(f"   Phase: {phase['phase_name']} ({phase['iteration_count']} iterations)")
    
    print("\n" + "="*60 + "\n")
    
    # Demonstration 3: Academic Research
    print("📋 Demo 3: Academic Research Scenario")
    print("Query: '説明可能AIの理論的基盤と評価手法の包括的調査'")
    
    academic_constraints = CONSTRAINT_TEMPLATES['academic_paper']
    academic_preferences = USER_PREFERENCES['evidence_focused']
    academic_domain = DOMAIN_CONTEXTS['ai_ml']
    
    result3 = agent.plan_research(
        "説明可能AIの理論的基盤と評価手法の包括的調査",
        constraints=academic_constraints,
        domain_context=academic_domain,
        user_preferences=academic_preferences
    )
    
    if result3['status'] == 'success':
        plan3 = result3['plan']
        print(f"✅ Generated academic research plan")
        print(f"📚 Evidence Requirements:")
        reqs = plan3['search_strategy']['source_requirements']
        print(f"   • Academic Sources: {reqs['academic_sources']}")
        print(f"   • Recent Sources: {reqs['recent_sources']}")
        print(f"   • Primary Sources: {reqs['primary_sources']}")
        
        print(f"📋 Quality Standards:")
        standards = plan3['quality_criteria']['evidence_standards']
        print(f"   • Citation Density: {standards['citation_density']:.1f} per 1000 words")
        print(f"   • Source Reliability: {standards['source_reliability']:.2f}")
        print(f"   • Fact Verification: {standards['fact_verification']}")
    
    print("\n" + "="*60 + "\n")
    
    # Demonstration 4: Error Handling
    print("📋 Demo 4: Error Handling & Edge Cases")
    
    # Test with minimal constraints
    minimal_result = agent.plan_research(
        "AI概要", 
        constraints={'target_length': 500, 'max_sections': 2}
    )
    
    print(f"Minimal constraints result: {minimal_result['status']}")
    if minimal_result['status'] == 'success':
        minimal_plan = minimal_result['plan']
        print(f"  Sections: {minimal_plan['structure_plan']['section_count']}")
        print(f"  Length: {minimal_plan['structure_plan']['report_length']} words")
    
    # Test with excessive constraints
    excessive_result = agent.plan_research(
        "複雑なAI分析",
        constraints={'target_length': 15000, 'search_iterations': 40}
    )
    
    print(f"Excessive constraints result: {excessive_result['status']}")
    if excessive_result['status'] == 'success':
        excessive_plan = excessive_result['plan']
        print(f"  Refined iterations: {excessive_plan['search_strategy']['total_iterations']}")
        
    print("\n=== Demonstration Complete ===")


def run_performance_benchmarks():
    """Run comprehensive performance benchmarks"""
    
    import time
    
    agent = ResearchPlannerAgent()
    
    print("=== Performance Benchmarks ===\n")
    
    # Benchmark 1: Query Processing Speed
    print("📊 Benchmark 1: Query Processing Speed")
    
    test_queries = [
        "AI基本概念",
        "機械学習技術の詳細分析と実装方法",
        "深層学習とTransformerアーキテクチャの包括的技術調査および性能比較分析"
    ]
    
    for i, query in enumerate(test_queries, 1):
        start_time = time.time()
        result = agent.plan_research(query)
        end_time = time.time()
        
        processing_time = end_time - start_time
        complexity = result['plan']['plan_metadata']['complexity_score'] if result['status'] == 'success' else 0
        
        print(f"  Query {i} (complexity {complexity:.1f}): {processing_time:.4f}s")
    
    # Benchmark 2: Constraint Handling Speed
    print("\n📊 Benchmark 2: Constraint Handling Performance")
    
    constraint_scenarios = [
        {'target_length': 1000, 'max_sections': 3},
        {'target_length': 5000, 'max_sections': 6},
        {'target_length': 10000, 'max_sections': 10}
    ]
    
    base_query = "AI技術の包括的調査"
    
    for i, constraints in enumerate(constraint_scenarios, 1):
        start_time = time.time()
        result = agent.plan_research(base_query, constraints=constraints)
        end_time = time.time()
        
        processing_time = end_time - start_time
        sections = result['plan']['structure_plan']['section_count'] if result['status'] == 'success' else 0
        
        print(f"  Scenario {i} ({sections} sections): {processing_time:.4f}s")
    
    # Benchmark 3: Validation Performance
    print("\n📊 Benchmark 3: Validation Performance")
    
    validation_queries = [
        "シンプルなAI調査",
        "複雑な多次元技術分析システムの包括的実装",
        "グローバルAI倫理フレームワークの国際比較"
    ]
    
    total_validation_time = 0
    
    for query in validation_queries:
        start_time = time.time()
        result = agent.plan_research(query)
        end_time = time.time()
        
        processing_time = end_time - start_time
        total_validation_time += processing_time
        
        if result['status'] == 'success':
            validation_score = result['validation']['scores']['overall_score']
            print(f"  Query (score {validation_score:.3f}): {processing_time:.4f}s")
    
    avg_validation_time = total_validation_time / len(validation_queries)
    print(f"  Average validation time: {avg_validation_time:.4f}s")
    
    print("\n=== Benchmark Complete ===")


def export_sample_plans():
    """Export sample research plans for documentation"""
    
    agent = ResearchPlannerAgent()
    
    sample_queries = [
        {
            'name': 'basic_ai_overview',
            'query': 'AI技術の基本概念と現状',
            'constraints': CONSTRAINT_TEMPLATES['quick_overview']
        },
        {
            'name': 'technical_survey',
            'query': 'Transformerアーキテクチャの技術詳細と実装',
            'constraints': CONSTRAINT_TEMPLATES['standard_research'],
            'domain': DOMAIN_CONTEXTS['nlp']
        },
        {
            'name': 'comparative_analysis',
            'query': 'GPT-4とClaude 3.5の詳細比較分析',
            'constraints': CONSTRAINT_TEMPLATES['comprehensive_study']
        },
        {
            'name': 'academic_research',
            'query': '説明可能AIの理論的基盤と評価手法',
            'constraints': CONSTRAINT_TEMPLATES['academic_paper'],
            'preferences': USER_PREFERENCES['evidence_focused']
        }
    ]
    
    for sample in sample_queries:
        result = agent.plan_research(
            sample['query'],
            constraints=sample.get('constraints'),
            domain_context=sample.get('domain'),
            user_preferences=sample.get('preferences')
        )
        
        if result['status'] == 'success':
            filename = f"sample_plan_{sample['name']}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(result['plan'], f, ensure_ascii=False, indent=2)
            
            print(f"✅ Exported {filename}")


if __name__ == "__main__":
    print("TTD-DR Research Planner - Test Data & Demonstration\n")
    
    # Run demonstration
    demonstrate_research_planner()
    
    print("\n" + "="*80 + "\n")
    
    # Run performance benchmarks
    run_performance_benchmarks()
    
    print("\n" + "="*80 + "\n")
    
    # Export sample plans
    print("📤 Exporting Sample Plans...")
    export_sample_plans()
    
    print("\n✅ Test data generation and demonstration complete!")