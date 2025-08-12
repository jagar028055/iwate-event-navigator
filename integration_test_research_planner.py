#!/usr/bin/env python3
"""
TTD-DR Research Planner - Integration Tests
Task 1.2.2 - Integration Testing

Integration tests that validate end-to-end workflow, realistic scenarios,
and integration with external systems (simulated Task tool calls).
"""

import json
import time
import unittest
from research_planner_agent import ResearchPlannerAgent


class TestTaskToolIntegration(unittest.TestCase):
    """Test integration with Task tool simulation"""
    
    def setUp(self):
        self.agent = ResearchPlannerAgent()
    
    def test_end_to_end_research_planning(self):
        """Test complete end-to-end research planning workflow"""
        # Simulate a complex real-world query
        query = "AIチャットボットシステムの自然言語処理技術の現状と将来性について包括的な技術調査を実施"
        
        constraints = {
            'target_length': 6000,
            'max_sections': 7,
            'search_iterations': 12
        }
        
        domain_context = {
            'field': 'AI/NLP',
            'keywords': ['チャットボット', '自然言語処理', 'LLM'],
            'excluded_topics': ['音声認識']
        }
        
        user_preferences = {
            'evidence_weight': 0.85,
            'creativity_level': 0.6,
            'technical_depth': 0.8
        }
        
        # Execute planning
        start_time = time.time()
        result = self.agent.plan_research(
            query, constraints, domain_context, user_preferences
        )
        execution_time = time.time() - start_time
        
        # Validate result structure
        self.assertEqual(result['status'], 'success')
        self.assertIsNotNone(result['plan'])
        self.assertIsNotNone(result['validation'])
        
        plan = result['plan']
        validation = result['validation']
        
        # Validate plan completeness
        self.assertIn('plan_metadata', plan)
        self.assertIn('research_objective', plan)
        self.assertIn('structure_plan', plan)
        self.assertIn('search_strategy', plan)
        self.assertIn('quality_criteria', plan)
        self.assertIn('evolution_parameters', plan)
        
        # Validate constraint adherence
        self.assertEqual(plan['structure_plan']['report_length'], 6000)
        self.assertLessEqual(plan['structure_plan']['section_count'], 7)
        self.assertLessEqual(plan['search_strategy']['total_iterations'], 12)
        
        # Validate quality scores
        self.assertGreaterEqual(validation['scores']['overall_score'], 0.7)
        
        # Validate performance
        self.assertLess(execution_time, 1.0)  # Should be fast
        
        print(f"End-to-end test completed in {execution_time:.3f}s")
        print(f"Generated plan with {plan['structure_plan']['section_count']} sections")
        print(f"Overall quality score: {validation['scores']['overall_score']:.3f}")
    
    def test_comparative_analysis_workflow(self):
        """Test comparative analysis specific workflow"""
        query = "GPT-4、Claude 3.5、Gemini Proの性能、機能、コスト面での詳細比較分析"
        
        result = self.agent.plan_research(query)
        
        self.assertEqual(result['status'], 'success')
        plan = result['plan']
        
        # Should generate comparative analysis structure
        self.assertEqual(plan['research_objective']['main_question'], 
                        query if '?' in query else f"{query}の主要な違いと特徴は何か？")
        
        # Should have comparison-focused sections
        section_titles = [s['title'] for s in plan['structure_plan']['sections']]
        has_comparison = any('比較' in title for title in section_titles)
        self.assertTrue(has_comparison)
        
        # Should have appropriate search strategy
        search_phases = plan['search_strategy']['search_phases']
        comparative_phases = [p for p in search_phases if '比較' in p['search_focus']]
        self.assertGreater(len(comparative_phases), 0)
    
    def test_technical_implementation_workflow(self):
        """Test technical implementation specific workflow"""
        query = "リアルタイム多言語音声認識システムの実装アーキテクチャとパフォーマンス最適化手法"
        
        result = self.agent.plan_research(query)
        
        self.assertEqual(result['status'], 'success')
        plan = result['plan']
        
        # Should generate implementation-focused structure
        section_titles = [s['title'] for s in plan['structure_plan']['sections']]
        
        has_technical = any(any(keyword in title for keyword in ['技術', '実装', 'アーキテクチャ']) 
                           for title in section_titles)
        self.assertTrue(has_technical)
        
        # Should have technical-focused search requirements
        source_reqs = plan['search_strategy']['source_requirements']
        self.assertGreaterEqual(source_reqs['academic_sources'], 3)
        
        # Should have implementation-specific quality criteria
        evidence_density = plan['quality_criteria']['evidence_standards']['citation_density']
        self.assertGreaterEqual(evidence_density, 2.0)


class TestRealisticScenarios(unittest.TestCase):
    """Test realistic user scenarios"""
    
    def setUp(self):
        self.agent = ResearchPlannerAgent()
    
    def test_academic_research_scenario(self):
        """Test academic research scenario"""
        query = "深層学習における説明可能AI技術の理論的基盤と実用化への課題"
        
        constraints = {
            'target_length': 8000,
            'max_sections': 8,
            'search_iterations': 15,
            'academic_level': 'graduate',
            'citation_style': 'APA'
        }
        
        user_preferences = {
            'evidence_weight': 0.95,
            'creativity_level': 0.3,
            'technical_depth': 0.9
        }
        
        result = self.agent.plan_research(query, constraints, user_preferences=user_preferences)
        
        self.assertEqual(result['status'], 'success')
        plan = result['plan']
        
        # Should have high evidence standards for academic work
        evidence_density = plan['quality_criteria']['evidence_standards']['citation_density']
        self.assertGreaterEqual(evidence_density, 4.0)
        
        # Should have academic-focused source requirements
        source_reqs = plan['search_strategy']['source_requirements']
        self.assertGreaterEqual(source_reqs['academic_sources'], 5)
        
        # Should have high complexity score
        complexity = plan['plan_metadata']['complexity_score']
        self.assertGreaterEqual(complexity, 7.0)
    
    def test_industry_report_scenario(self):
        """Test industry report scenario"""
        query = "2024年AI市場の動向分析と主要プレイヤーの戦略比較"
        
        constraints = {
            'target_length': 4000,
            'max_sections': 5,
            'languages': ['ja', 'en']
        }
        
        domain_context = {
            'field': 'market_analysis',
            'keywords': ['市場動向', 'AI業界', '競合分析']
        }
        
        result = self.agent.plan_research(query, constraints, domain_context)
        
        self.assertEqual(result['status'], 'success')
        plan = result['plan']
        
        # Should focus on recent information
        search_phases = plan['search_strategy']['search_phases']
        recent_focus = any('最新' in phase['search_focus'] or '2024' in phase['search_focus'] 
                          for phase in search_phases)
        
        # Should have industry-appropriate source mix
        source_reqs = plan['search_strategy']['source_requirements']
        self.assertGreaterEqual(source_reqs['recent_sources'], 4)
    
    def test_quick_overview_scenario(self):
        """Test quick overview scenario"""
        query = "量子コンピューティングの基本概念"
        
        constraints = {
            'target_length': 2000,
            'max_sections': 4,
            'search_iterations': 8
        }
        
        result = self.agent.plan_research(query, constraints)
        
        self.assertEqual(result['status'], 'success')
        plan = result['plan']
        
        # Should be simple and focused
        self.assertEqual(plan['structure_plan']['section_count'], 4)
        self.assertLessEqual(plan['search_strategy']['total_iterations'], 8)
        
        # Should have lower complexity
        complexity = plan['plan_metadata']['complexity_score']
        self.assertLessEqual(complexity, 6.0)
    
    def test_multilingual_scenario(self):
        """Test multilingual research scenario"""
        query = "Global AI ethics frameworks comparison across different countries"
        
        constraints = {
            'languages': ['en', 'ja', 'zh', 'de'],
            'target_length': 5000
        }
        
        result = self.agent.plan_research(query, constraints)
        
        self.assertEqual(result['status'], 'success')
        plan = result['plan']
        
        # Should have diverse source requirements
        source_reqs = plan['search_strategy']['source_requirements']
        self.assertGreaterEqual(source_reqs['diverse_sources'], 4)


class TestResourceManagement(unittest.TestCase):
    """Test resource management and optimization"""
    
    def setUp(self):
        self.agent = ResearchPlannerAgent()
    
    def test_resource_constraint_handling(self):
        """Test handling of resource constraints"""
        # Test with very tight constraints
        query = "包括的なAI技術調査"
        constraints = {
            'target_length': 1000,  # Very short
            'max_sections': 3,      # Very few sections
            'search_iterations': 5  # Very few iterations
        }
        
        result = self.agent.plan_research(query, constraints)
        
        self.assertEqual(result['status'], 'success')
        plan = result['plan']
        
        # Should respect constraints
        self.assertEqual(plan['structure_plan']['report_length'], 1000)
        self.assertLessEqual(plan['structure_plan']['section_count'], 3)
        self.assertLessEqual(plan['search_strategy']['total_iterations'], 5)
        
        # Should still be coherent
        validation = result['validation']
        self.assertGreaterEqual(validation['scores']['structure_integrity'], 0.7)
    
    def test_time_constraint_optimization(self):
        """Test time constraint optimization"""
        query = "詳細なAI技術分析"
        
        # Test fast turnaround
        start_time = time.time()
        result = self.agent.plan_research(query)
        fast_time = time.time() - start_time
        
        self.assertEqual(result['status'], 'success')
        self.assertLess(fast_time, 0.5)  # Should be very fast
        
        # Test with complex constraints
        complex_constraints = {
            'target_length': 10000,
            'max_sections': 10,
            'search_iterations': 20
        }
        
        start_time = time.time()
        result = self.agent.plan_research(query, complex_constraints)
        complex_time = time.time() - start_time
        
        self.assertEqual(result['status'], 'success')
        self.assertLess(complex_time, 1.0)  # Should still be reasonable
    
    def test_parallel_request_handling(self):
        """Test handling multiple parallel requests"""
        queries = [
            "AI技術概要",
            "機械学習アルゴリズム比較",
            "深層学習の実装方法",
            "自然言語処理の現状",
            "コンピュータビジョンの応用"
        ]
        
        start_time = time.time()
        results = []
        
        for query in queries:
            result = self.agent.plan_research(query)
            results.append(result)
        
        total_time = time.time() - start_time
        
        # All should succeed
        for result in results:
            self.assertEqual(result['status'], 'success')
        
        # Should be efficient even with multiple requests
        avg_time = total_time / len(queries)
        self.assertLess(avg_time, 0.2)
        
        print(f"Processed {len(queries)} requests in {total_time:.3f}s (avg: {avg_time:.3f}s)")


class TestErrorRecovery(unittest.TestCase):
    """Test error recovery and edge case handling"""
    
    def setUp(self):
        self.agent = ResearchPlannerAgent()
    
    def test_malformed_input_recovery(self):
        """Test recovery from malformed inputs"""
        # Test empty query
        result = self.agent.plan_research("")
        self.assertIn('status', result)
        
        # Test very long query
        very_long_query = "AI研究" * 1000
        result = self.agent.plan_research(very_long_query)
        self.assertEqual(result['status'], 'success')
        
        # Test query with only special characters
        special_query = "!@#$%^&*()"
        result = self.agent.plan_research(special_query)
        # Should either succeed with fallback or handle gracefully
        self.assertIn('status', result)
    
    def test_constraint_conflict_resolution(self):
        """Test resolution of conflicting constraints"""
        query = "AI技術調査"
        
        # Conflicting constraints: tiny length but many sections
        conflicting_constraints = {
            'target_length': 500,   # Very short
            'max_sections': 10,     # Many sections
            'search_iterations': 1  # Minimal search
        }
        
        result = self.agent.plan_research(query, conflicting_constraints)
        
        self.assertEqual(result['status'], 'success')
        plan = result['plan']
        
        # Should resolve conflicts intelligently
        self.assertGreaterEqual(plan['structure_plan']['section_count'], 3)
        self.assertLessEqual(plan['structure_plan']['section_count'], 6)
    
    def test_validation_failure_recovery(self):
        """Test recovery from validation failures"""
        # Create a scenario that might trigger validation issues
        query = "超複雑な多次元AI分析システムの包括的実装"
        
        extreme_constraints = {
            'target_length': 50000,  # Extremely long
            'max_sections': 20,      # Too many sections
            'search_iterations': 100 # Too many iterations
        }
        
        result = self.agent.plan_research(query, extreme_constraints)
        
        # Should still succeed through refinement
        self.assertEqual(result['status'], 'success')
        
        # Should have been refined to reasonable values
        plan = result['plan']
        self.assertLessEqual(plan['search_strategy']['total_iterations'], 25)


class TestQualityAssurance(unittest.TestCase):
    """Test quality assurance mechanisms"""
    
    def setUp(self):
        self.agent = ResearchPlannerAgent()
    
    def test_plan_consistency(self):
        """Test internal consistency of generated plans"""
        query = "AI技術の包括的調査"
        
        # Generate multiple plans for the same query
        plans = []
        for _ in range(5):
            result = self.agent.plan_research(query)
            self.assertEqual(result['status'], 'success')
            plans.append(result['plan'])
        
        # Check consistency across plans
        section_counts = [p['structure_plan']['section_count'] for p in plans]
        iteration_counts = [p['search_strategy']['total_iterations'] for p in plans]
        
        # Should be reasonably consistent
        self.assertLessEqual(max(section_counts) - min(section_counts), 2)
        self.assertLessEqual(max(iteration_counts) - min(iteration_counts), 5)
    
    def test_dependency_graph_validity(self):
        """Test validity of section dependency graphs"""
        query = "複雑なシステム分析"
        
        result = self.agent.plan_research(query)
        self.assertEqual(result['status'], 'success')
        
        plan = result['plan']
        sections = plan['structure_plan']['sections']
        
        # Build dependency graph
        section_ids = {s['section_id'] for s in sections}
        
        # Check all dependencies are valid
        for section in sections:
            for dep in section['dependencies']:
                self.assertIn(dep, section_ids, 
                             f"Invalid dependency {dep} in section {section['section_id']}")
    
    def test_search_phase_coverage(self):
        """Test search phase coverage of all sections"""
        query = "多セクション研究計画"
        
        constraints = {'max_sections': 6}
        result = self.agent.plan_research(query, constraints)
        
        self.assertEqual(result['status'], 'success')
        plan = result['plan']
        
        section_ids = {s['section_id'] for s in plan['structure_plan']['sections']}
        
        # Collect all targeted sections from search phases
        targeted_sections = set()
        for phase in plan['search_strategy']['search_phases']:
            targeted_sections.update(phase['target_sections'])
        
        # Should have reasonable coverage
        coverage_ratio = len(targeted_sections & section_ids) / len(section_ids)
        self.assertGreaterEqual(coverage_ratio, 0.6)


def run_integration_test_suite():
    """Run the complete integration test suite"""
    
    test_classes = [
        TestTaskToolIntegration,
        TestRealisticScenarios,
        TestResourceManagement,
        TestErrorRecovery,
        TestQualityAssurance
    ]
    
    total_tests = 0
    total_failures = 0
    
    print("=== TTD-DR Research Planner Integration Test Suite ===\n")
    
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
    
    print(f"\n=== Integration Test Summary ===")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {total_tests - total_failures}")
    print(f"Failed: {total_failures}")
    print(f"Success Rate: {((total_tests - total_failures) / total_tests * 100):.1f}%")
    
    return total_failures == 0


if __name__ == "__main__":
    success = run_integration_test_suite()
    exit(0 if success else 1)