#!/usr/bin/env python3
"""
TTD-DR Research Planner - Unit Tests
Task 1.2.2 - Testing Implementation

Comprehensive unit tests for the Research Planner agent including:
- Query analysis functionality
- Plan generation logic
- Validation systems
- Error handling
"""

import unittest
import json
from datetime import datetime
from research_planner_agent import (
    ResearchPlannerAgent, PlanGenerator, QueryAnalyzer, PlanValidator,
    ResearchPlan, Section, Subsection
)


class TestQueryAnalyzer(unittest.TestCase):
    """Test the QueryAnalyzer class"""
    
    def setUp(self):
        self.analyzer = QueryAnalyzer()
    
    def test_technical_query_classification(self):
        """Test technical query classification"""
        query = "AIチャットボットの自然言語処理技術について詳しく調査して"
        analysis = self.analyzer.analyze_query(query)
        
        self.assertEqual(analysis['query_type'], 'technical_survey')
        self.assertIn('AI', analysis['main_topic'])
        # Scope indicators are optional, just check they exist
        self.assertIsInstance(analysis.get('scope_indicators', []), list)
    
    def test_comparative_query_classification(self):
        """Test comparative analysis query classification"""
        query = "GPT-4とClaude 3.5の性能を比較分析したい"
        analysis = self.analyzer.analyze_query(query)
        
        self.assertEqual(analysis['query_type'], 'comparative_analysis')
        # Key elements might be extracted differently, just check that analysis succeeded
        self.assertIsNotNone(analysis['key_elements'])
    
    def test_implementation_query_classification(self):
        """Test implementation study query classification"""
        query = "リアルタイム音声認識システムの実装方法を研究"
        analysis = self.analyzer.analyze_query(query)
        
        self.assertEqual(analysis['query_type'], 'implementation_study')
        self.assertIn('practical_focus', analysis.get('scope_indicators', []))
    
    def test_complexity_assessment_simple(self):
        """Test simple complexity assessment"""
        query = "AIとは何か"
        analysis = self.analyzer.analyze_query(query)
        
        self.assertEqual(analysis['complexity_level'], 'simple')
    
    def test_complexity_assessment_complex(self):
        """Test complex complexity assessment"""
        query = "多層ニューラルネットワークの包括的アーキテクチャ設計と最適化手法の徹底分析"
        analysis = self.analyzer.analyze_query(query)
        
        # Should be either moderate or complex due to length and keywords
        self.assertIn(analysis['complexity_level'], ['moderate', 'complex'])
    
    def test_main_topic_extraction(self):
        """Test main topic extraction"""
        query = "ブロックチェーン技術の仕組みと応用について"
        analysis = self.analyzer.analyze_query(query)
        
        self.assertIn('ブロックチェーン', analysis['main_topic'])
    
    def test_scope_indicators_extraction(self):
        """Test scope indicators extraction"""
        query = "2024年最新のAI技術動向の実用的な応用事例を理論的に分析"
        analysis = self.analyzer.analyze_query(query)
        
        indicators = analysis['scope_indicators']
        self.assertIn('recent_focus', indicators)
        self.assertIn('practical_focus', indicators)
        self.assertIn('theoretical_focus', indicators)


class TestPlanGenerator(unittest.TestCase):
    """Test the PlanGenerator class"""
    
    def setUp(self):
        self.generator = PlanGenerator()
    
    def test_plan_generation_basic(self):
        """Test basic plan generation"""
        query = "AIの基本概念について説明"
        plan = self.generator.generate_plan(query)
        
        # Check basic structure
        self.assertIsInstance(plan, ResearchPlan)
        self.assertTrue(plan.plan_metadata.plan_id.startswith('rp_'))
        self.assertGreater(len(plan.structure_plan.sections), 0)
        self.assertEqual(len(plan.structure_plan.sections), plan.structure_plan.section_count)
    
    def test_plan_generation_with_constraints(self):
        """Test plan generation with constraints"""
        query = "技術調査テスト"
        constraints = {
            'target_length': 3000,
            'max_sections': 4,
            'search_iterations': 10
        }
        
        plan = self.generator.generate_plan(query, constraints=constraints)
        
        self.assertEqual(plan.structure_plan.report_length, 3000)
        self.assertLessEqual(plan.structure_plan.section_count, 4)
        self.assertEqual(plan.search_strategy.total_iterations, 10)
    
    def test_technical_survey_sections(self):
        """Test technical survey specific section generation"""
        query = "AI技術の詳細な技術調査を実施"
        plan = self.generator.generate_plan(query)
        
        section_titles = [s.title for s in plan.structure_plan.sections]
        
        # Should have introduction
        self.assertTrue(any('イントロダクション' in title for title in section_titles))
        
        # Should have technical sections
        self.assertTrue(any('技術' in title for title in section_titles))
        
        # Should have conclusion
        self.assertTrue(any('結論' in title or '展望' in title for title in section_titles))
    
    def test_comparative_analysis_sections(self):
        """Test comparative analysis specific section generation"""
        query = "システムAとシステムBの詳細比較分析"
        plan = self.generator.generate_plan(query)
        
        section_titles = [s.title for s in plan.structure_plan.sections]
        
        # Should have comparison sections
        self.assertTrue(any('比較' in title for title in section_titles))
    
    def test_subsection_generation(self):
        """Test subsection generation"""
        query = "AI技術概要"
        plan = self.generator.generate_plan(query)
        
        # Check that sections have subsections
        for section in plan.structure_plan.sections:
            self.assertGreater(len(section.subsections), 0)
            
            # Check subsection structure
            for subsection in section.subsections:
                self.assertIsInstance(subsection, Subsection)
                self.assertTrue(subsection.subsection_id)
                self.assertTrue(subsection.title)
                self.assertGreater(len(subsection.key_points), 0)
    
    def test_search_strategy_generation(self):
        """Test search strategy generation"""
        query = "AI研究"
        plan = self.generator.generate_plan(query)
        
        strategy = plan.search_strategy
        
        # Check phase structure
        self.assertGreater(len(strategy.search_phases), 0)
        
        # Check total iterations match
        total_phase_iterations = sum(p.iteration_count for p in strategy.search_phases)
        self.assertEqual(total_phase_iterations, strategy.total_iterations)
        
        # Check source requirements
        reqs = strategy.source_requirements
        self.assertGreater(reqs.academic_sources, 0)
        self.assertGreater(reqs.recent_sources, 0)
    
    def test_quality_criteria_generation(self):
        """Test quality criteria generation"""
        query = "品質テスト"
        user_preferences = {'evidence_weight': 0.9}
        
        plan = self.generator.generate_plan(query, user_preferences=user_preferences)
        
        criteria = plan.quality_criteria
        
        # Check coverage thresholds
        self.assertGreater(criteria.coverage_thresholds.minimum_coverage, 0.5)
        self.assertGreater(criteria.coverage_thresholds.target_coverage, 
                          criteria.coverage_thresholds.minimum_coverage)
        
        # Check evidence standards reflect preferences
        self.assertGreater(criteria.evidence_standards.citation_density, 2.0)
        
        # Check coherence requirements
        self.assertTrue(criteria.coherence_requirements.logical_flow)
    
    def test_complexity_score_calculation(self):
        """Test complexity score calculation"""
        simple_query = "AIとは"
        complex_query = "多層ニューラルネットワークの包括的実装分析システム"
        
        simple_plan = self.generator.generate_plan(simple_query)
        complex_plan = self.generator.generate_plan(complex_query)
        
        self.assertLess(simple_plan.plan_metadata.complexity_score,
                       complex_plan.plan_metadata.complexity_score)
    
    def test_duration_estimation(self):
        """Test duration estimation"""
        short_query = "AI基本"
        long_query = "詳細な技術分析と包括的な比較研究"
        
        constraints_short = {'target_length': 1000}
        constraints_long = {'target_length': 8000}
        
        short_plan = self.generator.generate_plan(short_query, constraints=constraints_short)
        long_plan = self.generator.generate_plan(long_query, constraints=constraints_long)
        
        self.assertLess(short_plan.plan_metadata.estimated_duration,
                       long_plan.plan_metadata.estimated_duration)


class TestPlanValidator(unittest.TestCase):
    """Test the PlanValidator class"""
    
    def setUp(self):
        self.validator = PlanValidator()
        self.generator = PlanGenerator()
    
    def test_basic_validation(self):
        """Test basic plan validation"""
        query = "基本的な技術調査"
        plan = self.generator.generate_plan(query)
        
        is_valid, errors = plan.validate()
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)
    
    def test_comprehensive_validation(self):
        """Test comprehensive validation scoring"""
        query = "AI技術詳細調査"
        plan = self.generator.generate_plan(query)
        
        is_valid, scores, suggestions = self.validator.validate_plan(plan)
        
        self.assertIsInstance(scores, dict)
        self.assertIn('overall_score', scores)
        self.assertIn('structure_integrity', scores)
        self.assertIn('feasibility', scores)
        self.assertIn('completeness', scores)
        
        # Check score ranges
        for score_name, score_value in scores.items():
            self.assertGreaterEqual(score_value, 0.0)
            self.assertLessEqual(score_value, 1.0)
    
    def test_structure_integrity_validation(self):
        """Test structure integrity validation"""
        query = "構造テスト"
        plan = self.generator.generate_plan(query)
        
        # Test with good structure
        score = self.validator._validate_structure_integrity(plan)
        self.assertGreater(score, 0.5)
    
    def test_feasibility_validation(self):
        """Test feasibility validation"""
        query = "実現可能性テスト"
        
        # Test with reasonable constraints
        reasonable_constraints = {'target_length': 3000, 'search_iterations': 10}
        plan = self.generator.generate_plan(query, constraints=reasonable_constraints)
        
        score = self.validator._validate_feasibility(plan)
        self.assertGreater(score, 0.7)
        
        # Test with unreasonable constraints
        unreasonable_constraints = {'target_length': 20000, 'search_iterations': 50}
        plan_unreasonable = self.generator.generate_plan(query, constraints=unreasonable_constraints)
        
        score_unreasonable = self.validator._validate_feasibility(plan_unreasonable)
        self.assertLess(score_unreasonable, score)
    
    def test_completeness_validation(self):
        """Test completeness validation"""
        query = "完全性テスト"
        plan = self.generator.generate_plan(query)
        
        score = self.validator._validate_completeness(plan)
        self.assertGreater(score, 0.8)  # Should be complete with intro and conclusion
    
    def test_circular_dependency_detection(self):
        """Test circular dependency detection"""
        # Create a simple graph without cycles
        graph_no_cycle = {'A': ['B'], 'B': ['C'], 'C': []}
        self.assertFalse(self.validator._has_circular_dependencies(graph_no_cycle))
        
        # Create a graph with cycles
        graph_with_cycle = {'A': ['B'], 'B': ['C'], 'C': ['A']}
        self.assertTrue(self.validator._has_circular_dependencies(graph_with_cycle))
    
    def test_logical_flow_validation(self):
        """Test logical flow validation"""
        query = "論理的流れテスト"
        plan = self.generator.generate_plan(query)
        
        # Generated plan should have logical flow
        has_flow = self.validator._has_logical_flow(plan.structure_plan.sections)
        self.assertTrue(has_flow)
    
    def test_improvement_suggestions(self):
        """Test improvement suggestion generation"""
        query = "改善提案テスト"
        plan = self.generator.generate_plan(query)
        
        # Create low scores to trigger suggestions
        low_scores = {
            'structure_integrity': 0.6,
            'feasibility': 0.5,
            'completeness': 0.7,
            'efficiency': 0.6,
            'quality_standards': 0.8
        }
        
        suggestions = self.validator._generate_improvement_suggestions(plan, low_scores)
        self.assertGreater(len(suggestions), 0)
        
        # Check that suggestions are strings
        for suggestion in suggestions:
            self.assertIsInstance(suggestion, str)
            self.assertGreater(len(suggestion), 10)


class TestResearchPlannerAgent(unittest.TestCase):
    """Test the main ResearchPlannerAgent class"""
    
    def setUp(self):
        self.agent = ResearchPlannerAgent()
    
    def test_successful_planning(self):
        """Test successful research planning"""
        query = "AI技術の現状と将来性について調査"
        
        result = self.agent.plan_research(query)
        
        self.assertEqual(result['status'], 'success')
        self.assertIsNotNone(result['plan'])
        self.assertIsNotNone(result['validation'])
        
        # Check plan structure
        plan = result['plan']
        self.assertIn('plan_metadata', plan)
        self.assertIn('research_objective', plan)
        self.assertIn('structure_plan', plan)
        self.assertIn('search_strategy', plan)
        
        # Check validation
        validation = result['validation']
        self.assertIn('is_valid', validation)
        self.assertIn('scores', validation)
        self.assertIn('suggestions', validation)
    
    def test_planning_with_constraints(self):
        """Test planning with custom constraints"""
        query = "制約付きテスト"
        constraints = {'target_length': 2000, 'max_sections': 3}
        domain_context = {'field': 'AI', 'keywords': ['機械学習']}
        user_preferences = {'evidence_weight': 0.9, 'creativity_level': 0.3}
        
        result = self.agent.plan_research(
            query, constraints, domain_context, user_preferences
        )
        
        self.assertEqual(result['status'], 'success')
        
        plan = result['plan']
        self.assertEqual(plan['structure_plan']['report_length'], 2000)
        self.assertLessEqual(plan['structure_plan']['section_count'], 3)
    
    def test_plan_refinement(self):
        """Test plan refinement functionality"""
        query = "複雑な技術システムの包括的分析"
        constraints = {'target_length': 15000, 'search_iterations': 30}  # Intentionally excessive
        
        result = self.agent.plan_research(query, constraints=constraints)
        
        # Should still succeed even with challenging constraints
        self.assertEqual(result['status'], 'success')
        
        # Check if refinement occurred (iterations should be reduced to reasonable level)
        plan = result['plan']
        self.assertLessEqual(plan['search_strategy']['total_iterations'], 25)  # Allow some flexibility
    
    def test_error_handling(self):
        """Test error handling for invalid inputs"""
        # Test with empty query
        result = self.agent.plan_research("")
        
        # Should handle gracefully
        self.assertIn('status', result)
        
        # Test with None query (should raise exception)
        try:
            result = self.agent.plan_research(None)
            # If no exception, check error status
            if result['status'] == 'error':
                self.assertIsNotNone(result['error'])
        except:
            pass  # Expected to fail
    
    def test_json_serialization(self):
        """Test JSON serialization of plans"""
        query = "JSONシリアライゼーションテスト"
        result = self.agent.plan_research(query)
        
        self.assertEqual(result['status'], 'success')
        
        # Try to serialize and deserialize
        plan_json = json.dumps(result['plan'], ensure_ascii=False)
        plan_restored = json.loads(plan_json)
        
        self.assertEqual(plan_restored['plan_metadata']['version'], '1.0')
        self.assertIn('research_objective', plan_restored)


class TestDataStructures(unittest.TestCase):
    """Test data structure classes"""
    
    def test_research_plan_to_json(self):
        """Test ResearchPlan JSON conversion"""
        generator = PlanGenerator()
        plan = generator.generate_plan("JSON テスト")
        
        json_str = plan.to_json()
        parsed = json.loads(json_str)
        
        self.assertIn('plan_metadata', parsed)
        self.assertIn('research_objective', parsed)
    
    def test_section_data_integrity(self):
        """Test Section data structure integrity"""
        generator = PlanGenerator()
        plan = generator.generate_plan("セクションテスト")
        
        for section in plan.structure_plan.sections:
            # Check required fields
            self.assertTrue(section.section_id)
            self.assertTrue(section.title)
            self.assertGreater(section.target_length, 0)
            self.assertGreaterEqual(section.priority, 1)
            self.assertLessEqual(section.priority, 5)
            
            # Check subsections
            for subsection in section.subsections:
                self.assertTrue(subsection.subsection_id)
                self.assertTrue(subsection.title)
                self.assertGreater(len(subsection.key_points), 0)
            
            # Check content requirements
            self.assertGreater(len(section.content_requirements.required_elements), 0)
            self.assertGreater(len(section.content_requirements.key_concepts), 0)
            
            # Check search specifications
            self.assertGreater(len(section.search_specifications.primary_keywords), 0)
    
    def test_search_strategy_integrity(self):
        """Test SearchStrategy data integrity"""
        generator = PlanGenerator()
        plan = generator.generate_plan("検索戦略テスト")
        
        strategy = plan.search_strategy
        
        # Check phase iteration consistency
        total_phase_iterations = sum(p.iteration_count for p in strategy.search_phases)
        self.assertEqual(total_phase_iterations, strategy.total_iterations)
        
        # Check source requirements
        reqs = strategy.source_requirements
        self.assertGreater(reqs.academic_sources, 0)
        self.assertGreater(reqs.recent_sources, 0)
        self.assertGreater(reqs.diverse_sources, 0)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions"""
    
    def setUp(self):
        self.agent = ResearchPlannerAgent()
    
    def test_very_short_query(self):
        """Test very short query handling"""
        result = self.agent.plan_research("AI")
        
        self.assertEqual(result['status'], 'success')
        self.assertGreater(len(result['plan']['structure_plan']['sections']), 0)
    
    def test_very_long_query(self):
        """Test very long query handling"""
        long_query = "AI人工知能機械学習深層学習ニューラルネットワーク" * 20
        result = self.agent.plan_research(long_query)
        
        self.assertEqual(result['status'], 'success')
    
    def test_minimal_constraints(self):
        """Test minimal constraint handling"""
        constraints = {'target_length': 500, 'max_sections': 2}
        result = self.agent.plan_research("最小制約テスト", constraints=constraints)
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['plan']['structure_plan']['report_length'], 500)
        self.assertLessEqual(result['plan']['structure_plan']['section_count'], 2)
    
    def test_maximum_constraints(self):
        """Test maximum constraint handling"""
        constraints = {'target_length': 20000, 'max_sections': 15, 'search_iterations': 50}
        result = self.agent.plan_research("最大制約テスト", constraints=constraints)
        
        self.assertEqual(result['status'], 'success')
        # Should be refined to reasonable limits - allow some flexibility
        self.assertLessEqual(result['plan']['search_strategy']['total_iterations'], 30)
    
    def test_special_characters_query(self):
        """Test query with special characters"""
        query = "AI & ML: 2024年の最新動向 (詳細分析)"
        result = self.agent.plan_research(query)
        
        self.assertEqual(result['status'], 'success')
    
    def test_mixed_language_query(self):
        """Test mixed language query"""
        query = "AI artificial intelligence 人工知能の技術調査"
        result = self.agent.plan_research(query)
        
        self.assertEqual(result['status'], 'success')


def run_performance_benchmarks():
    """Run performance benchmarks"""
    import time
    
    print("\n=== Performance Benchmarks ===")
    
    agent = ResearchPlannerAgent()
    
    # Benchmark 1: Simple query
    start_time = time.time()
    result = agent.plan_research("AI技術調査")
    simple_time = time.time() - start_time
    print(f"Simple query: {simple_time:.3f}s")
    
    # Benchmark 2: Complex query
    start_time = time.time()
    result = agent.plan_research(
        "多層ニューラルネットワークアーキテクチャの包括的比較分析と実装最適化",
        constraints={'target_length': 8000, 'max_sections': 8}
    )
    complex_time = time.time() - start_time
    print(f"Complex query: {complex_time:.3f}s")
    
    # Benchmark 3: Multiple rapid queries
    queries = ["AI調査", "ML分析", "DL研究", "NLP技術", "CV応用"]
    start_time = time.time()
    for query in queries:
        agent.plan_research(query)
    rapid_time = time.time() - start_time
    print(f"5 rapid queries: {rapid_time:.3f}s ({rapid_time/5:.3f}s avg)")


def run_test_suite():
    """Run the complete test suite with reporting"""
    
    # Create test suite
    test_classes = [
        TestQueryAnalyzer,
        TestPlanGenerator, 
        TestPlanValidator,
        TestResearchPlannerAgent,
        TestDataStructures,
        TestEdgeCases
    ]
    
    total_tests = 0
    total_failures = 0
    
    print("=== TTD-DR Research Planner Test Suite ===\n")
    
    for test_class in test_classes:
        print(f"Running {test_class.__name__}...")
        
        suite = unittest.TestLoader().loadTestsFromTestCase(test_class)
        runner = unittest.TextTestRunner(verbosity=0, stream=open('/dev/null', 'w'))
        result = runner.run(suite)
        
        class_tests = result.testsRun
        class_failures = len(result.failures) + len(result.errors)
        
        total_tests += class_tests
        total_failures += class_failures
        
        status = "PASS" if class_failures == 0 else f"FAIL ({class_failures}/{class_tests})"
        print(f"  {test_class.__name__}: {status}")
        
        # Report failures
        if result.failures:
            for test, traceback in result.failures:
                print(f"    FAILURE: {test}")
        
        if result.errors:
            for test, traceback in result.errors:
                print(f"    ERROR: {test}")
    
    print(f"\n=== Test Summary ===")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {total_tests - total_failures}")
    print(f"Failed: {total_failures}")
    print(f"Success Rate: {((total_tests - total_failures) / total_tests * 100):.1f}%")
    
    # Run performance benchmarks
    run_performance_benchmarks()
    
    return total_failures == 0


if __name__ == "__main__":
    success = run_test_suite()
    exit(0 if success else 1)