#!/usr/bin/env python3
"""
TTD-DR Research Planner Agent
Task 1.2.2 Implementation

High-performance research planning agent that generates structured, 
comprehensive research plans using the Task tool for LLM integration.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import re
import hashlib


@dataclass
class PlanMetadata:
    """Research plan metadata"""
    plan_id: str
    created_at: str
    version: str
    estimated_duration: int
    complexity_score: float


@dataclass
class ResearchObjective:
    """Research objective definition"""
    main_question: str
    sub_questions: List[str]
    scope: str
    expected_outcomes: List[str]
    success_criteria: List[str]


@dataclass
class ContentRequirements:
    """Content requirements for a section"""
    required_elements: List[str]
    key_concepts: List[str]
    evidence_types: List[str]


@dataclass
class SearchSpecifications:
    """Search specifications for a section"""
    primary_keywords: List[str]
    secondary_keywords: List[str]
    search_operators: List[str]
    source_filters: Dict[str, Any]


@dataclass
class QualityIndicators:
    """Quality indicators for section evaluation"""
    completion_criteria: List[str]
    deficiency_markers: List[str]


@dataclass
class Subsection:
    """Subsection definition"""
    subsection_id: str
    title: str
    key_points: List[str]
    evidence_requirements: List[str]


@dataclass
class Section:
    """Section definition with complete specifications"""
    section_id: str
    title: str
    description: str
    target_length: int
    priority: int
    dependencies: List[str]
    subsections: List[Subsection]
    content_requirements: ContentRequirements
    search_specifications: SearchSpecifications
    quality_indicators: QualityIndicators


@dataclass
class SearchPhase:
    """Search phase definition"""
    phase_id: str
    phase_name: str
    target_sections: List[str]
    search_focus: str
    query_types: List[str]
    iteration_count: int


@dataclass
class SourceRequirements:
    """Source requirements specification"""
    academic_sources: int
    recent_sources: int
    diverse_sources: int
    primary_sources: int


@dataclass
class SearchStrategy:
    """Search strategy specification"""
    total_iterations: int
    search_phases: List[SearchPhase]
    source_requirements: SourceRequirements


@dataclass
class CoverageThresholds:
    """Coverage threshold specifications"""
    minimum_coverage: float
    target_coverage: float
    section_balance: float


@dataclass
class EvidenceStandards:
    """Evidence standards specification"""
    citation_density: float
    source_reliability: float
    fact_verification: bool


@dataclass
class CoherenceRequirements:
    """Coherence requirements specification"""
    logical_flow: bool
    consistency_check: bool
    contradiction_detection: bool


@dataclass
class QualityCriteria:
    """Quality criteria specification"""
    coverage_thresholds: CoverageThresholds
    evidence_standards: EvidenceStandards
    coherence_requirements: CoherenceRequirements


@dataclass
class EvaluationCriterion:
    """Evaluation criterion for evolution"""
    criterion_name: str
    weight: float
    threshold: float


@dataclass
class EvolutionParameters:
    """Evolution parameters specification"""
    self_evolution_enabled: bool
    variant_count: int
    evolution_iterations: int
    evaluation_criteria: List[EvaluationCriterion]


@dataclass
class StructurePlan:
    """Structure plan specification"""
    report_length: int
    section_count: int
    sections: List[Section]


@dataclass
class ResearchPlan:
    """Complete research plan"""
    plan_metadata: PlanMetadata
    research_objective: ResearchObjective
    structure_plan: StructurePlan
    search_strategy: SearchStrategy
    quality_criteria: QualityCriteria
    evolution_parameters: EvolutionParameters
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(asdict(self), ensure_ascii=False, indent=2)
    
    def validate(self) -> Tuple[bool, List[str]]:
        """Validate research plan structure and content"""
        errors = []
        
        # Basic structure validation
        if not self.research_objective.main_question.strip():
            errors.append("Main question cannot be empty")
        
        if len(self.structure_plan.sections) == 0:
            errors.append("Must have at least one section")
        
        if self.structure_plan.section_count != len(self.structure_plan.sections):
            errors.append("Section count mismatch")
        
        # Section dependency validation
        section_ids = {s.section_id for s in self.structure_plan.sections}
        for section in self.structure_plan.sections:
            for dep in section.dependencies:
                if dep not in section_ids:
                    errors.append(f"Invalid dependency: {dep} in section {section.section_id}")
        
        # Search strategy validation
        total_phase_iterations = sum(p.iteration_count for p in self.search_strategy.search_phases)
        if total_phase_iterations != self.search_strategy.total_iterations:
            errors.append("Phase iteration count doesn't match total iterations")
        
        return len(errors) == 0, errors


class QueryAnalyzer:
    """Analyzes user queries to extract research parameters"""
    
    def __init__(self):
        self.query_patterns = {
            'technical_survey': r'(技術|テクノロジー|システム|実装|開発)',
            'comparative_analysis': r'(比較|対比|違い|VS|対|分析)',
            'implementation_study': r'(実装|構築|開発|作成|方法)',
            'explanatory_survey': r'(とは|について|概要|説明|理解)',
            'future_analysis': r'(将来|今後|未来|トレンド|展望)'
        }
        
        self.complexity_indicators = {
            'simple': r'(簡単|基本|概要|入門)',
            'moderate': r'(詳細|分析|比較|調査)',
            'complex': r'(徹底|包括|多面|システム|アーキテクチャ)'
        }
    
    def analyze_query(self, user_query: str) -> Dict[str, Any]:
        """Analyze user query and extract research parameters"""
        analysis = {
            'main_topic': self._extract_main_topic(user_query),
            'query_type': self._classify_query_type(user_query),
            'complexity_level': self._assess_complexity(user_query),
            'key_elements': self._extract_key_elements(user_query),
            'scope_indicators': self._extract_scope_indicators(user_query)
        }
        return analysis
    
    def _extract_main_topic(self, query: str) -> str:
        """Extract main topic from query"""
        # Simple keyword extraction - in real implementation, use NLP
        words = query.split()
        key_words = [w for w in words if len(w) > 2 and not w in ['について', 'の', 'を', 'に', 'は', 'が']]
        return ' '.join(key_words[:3]) if key_words else "AI技術"
    
    def _classify_query_type(self, query: str) -> str:
        """Classify query type based on patterns"""
        # Check for specific patterns in order of specificity
        if re.search(r'(比較|対比|違い|VS|対|分析)', query):
            return 'comparative_analysis'
        elif re.search(r'(実装|構築|開発|作成|方法)', query):
            return 'implementation_study'
        elif re.search(r'(技術|テクノロジー|システム|実装|開発)', query):
            return 'technical_survey'
        elif re.search(r'(将来|今後|未来|トレンド|展望)', query):
            return 'future_analysis'
        else:
            return 'explanatory_survey'
    
    def _assess_complexity(self, query: str) -> str:
        """Assess query complexity"""
        for complexity, pattern in self.complexity_indicators.items():
            if re.search(pattern, query):
                return complexity
        
        # Length-based assessment
        word_count = len(query.split())
        if word_count < 5:
            return 'simple'
        elif word_count < 15:
            return 'moderate'
        else:
            return 'complex'
    
    def _extract_key_elements(self, query: str) -> List[str]:
        """Extract key elements from query"""
        # Simple implementation - extract nouns and technical terms
        words = query.split()
        key_elements = []
        
        for word in words:
            if len(word) > 3 and any(char.isupper() for char in word):
                key_elements.append(word)
            elif word in ['AI', 'ML', 'IoT', 'API', 'GPU', 'CPU']:
                key_elements.append(word)
        
        return key_elements[:5]
    
    def _extract_scope_indicators(self, query: str) -> List[str]:
        """Extract scope indicators from query"""
        scope_indicators = []
        
        if re.search(r'(最新|2024|2025|今年)', query):
            scope_indicators.append('recent_focus')
        if re.search(r'(歴史|発展|変遷)', query):
            scope_indicators.append('historical_perspective')
        if re.search(r'(実用|実際|現実|実装|応用)', query):
            scope_indicators.append('practical_focus')
        if re.search(r'(理論|学術|研究)', query):
            scope_indicators.append('theoretical_focus')
        
        return scope_indicators


class PlanGenerator:
    """Generates structured research plans"""
    
    def __init__(self):
        self.analyzer = QueryAnalyzer()
        self.section_templates = self._load_section_templates()
        self.search_strategies = self._load_search_strategies()
    
    def generate_plan(self, user_query: str, constraints: Optional[Dict] = None, 
                     domain_context: Optional[Dict] = None,
                     user_preferences: Optional[Dict] = None) -> ResearchPlan:
        """Generate comprehensive research plan from user query"""
        
        # Analyze query
        query_analysis = self.analyzer.analyze_query(user_query)
        
        # Apply defaults and constraints
        constraints = constraints or {}
        domain_context = domain_context or {}
        user_preferences = user_preferences or {}
        
        # Generate plan components
        plan_id = self._generate_plan_id(user_query)
        metadata = self._create_metadata(plan_id, query_analysis, constraints)
        objective = self._create_research_objective(user_query, query_analysis)
        structure = self._create_structure_plan(query_analysis, constraints)
        search_strategy = self._create_search_strategy(query_analysis, structure, constraints)
        quality_criteria = self._create_quality_criteria(query_analysis, user_preferences)
        evolution_params = self._create_evolution_parameters(query_analysis, user_preferences)
        
        plan = ResearchPlan(
            plan_metadata=metadata,
            research_objective=objective,
            structure_plan=structure,
            search_strategy=search_strategy,
            quality_criteria=quality_criteria,
            evolution_parameters=evolution_params
        )
        
        return plan
    
    def _generate_plan_id(self, user_query: str) -> str:
        """Generate unique plan ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        query_hash = hashlib.md5(user_query.encode()).hexdigest()[:8]
        return f"rp_{timestamp}_{query_hash}"
    
    def _create_metadata(self, plan_id: str, analysis: Dict, constraints: Dict) -> PlanMetadata:
        """Create plan metadata"""
        complexity_score = self._calculate_complexity_score(analysis)
        estimated_duration = self._estimate_duration(analysis, constraints)
        
        return PlanMetadata(
            plan_id=plan_id,
            created_at=datetime.now().isoformat(),
            version="1.0",
            estimated_duration=estimated_duration,
            complexity_score=complexity_score
        )
    
    def _create_research_objective(self, user_query: str, analysis: Dict) -> ResearchObjective:
        """Create research objective from analysis"""
        main_question = self._formulate_main_question(user_query, analysis)
        sub_questions = self._generate_sub_questions(analysis)
        scope = self._define_scope(analysis)
        outcomes = self._define_expected_outcomes(analysis)
        criteria = self._define_success_criteria(analysis)
        
        return ResearchObjective(
            main_question=main_question,
            sub_questions=sub_questions,
            scope=scope,
            expected_outcomes=outcomes,
            success_criteria=criteria
        )
    
    def _create_structure_plan(self, analysis: Dict, constraints: Dict) -> StructurePlan:
        """Create structure plan with sections"""
        target_length = constraints.get('target_length', 5000)
        max_sections = constraints.get('max_sections', 6)
        
        section_count = self._determine_section_count(analysis, max_sections)
        sections = self._generate_sections(analysis, section_count, target_length)
        
        return StructurePlan(
            report_length=target_length,
            section_count=section_count,
            sections=sections
        )
    
    def _create_search_strategy(self, analysis: Dict, structure: StructurePlan, 
                              constraints: Dict) -> SearchStrategy:
        """Create search strategy"""
        total_iterations = constraints.get('search_iterations', 15)
        phases = self._generate_search_phases(analysis, structure, total_iterations)
        source_reqs = self._define_source_requirements(analysis)
        
        return SearchStrategy(
            total_iterations=total_iterations,
            search_phases=phases,
            source_requirements=source_reqs
        )
    
    def _create_quality_criteria(self, analysis: Dict, preferences: Dict) -> QualityCriteria:
        """Create quality criteria"""
        evidence_weight = preferences.get('evidence_weight', 0.8)
        
        coverage = CoverageThresholds(
            minimum_coverage=0.80,
            target_coverage=0.90,
            section_balance=0.75
        )
        
        evidence = EvidenceStandards(
            citation_density=3.0 * evidence_weight,
            source_reliability=0.85,
            fact_verification=True
        )
        
        coherence = CoherenceRequirements(
            logical_flow=True,
            consistency_check=True,
            contradiction_detection=True
        )
        
        return QualityCriteria(
            coverage_thresholds=coverage,
            evidence_standards=evidence,
            coherence_requirements=coherence
        )
    
    def _create_evolution_parameters(self, analysis: Dict, preferences: Dict) -> EvolutionParameters:
        """Create evolution parameters"""
        creativity_level = preferences.get('creativity_level', 0.5)
        
        criteria = [
            EvaluationCriterion("completeness", 0.3, 0.85),
            EvaluationCriterion("accuracy", 0.35, 0.90),
            EvaluationCriterion("coherence", 0.25, 0.80),
            EvaluationCriterion("novelty", 0.1 * creativity_level, 0.20)
        ]
        
        return EvolutionParameters(
            self_evolution_enabled=True,
            variant_count=2,
            evolution_iterations=3,
            evaluation_criteria=criteria
        )
    
    def _calculate_complexity_score(self, analysis: Dict) -> float:
        """Calculate complexity score 1-10"""
        base_score = 5.0
        
        if analysis['complexity_level'] == 'simple':
            base_score = 3.0
        elif analysis['complexity_level'] == 'complex':
            base_score = 8.0
        
        if analysis['query_type'] == 'comparative_analysis':
            base_score += 1.5
        elif analysis['query_type'] == 'implementation_study':
            base_score += 2.0
        
        return min(base_score, 10.0)
    
    def _estimate_duration(self, analysis: Dict, constraints: Dict) -> int:
        """Estimate duration in minutes"""
        base_duration = 30
        
        if analysis['complexity_level'] == 'complex':
            base_duration += 20
        
        target_length = constraints.get('target_length', 5000)
        length_factor = target_length / 1000
        
        return int(base_duration * length_factor)
    
    def _formulate_main_question(self, user_query: str, analysis: Dict) -> str:
        """Formulate clear main research question"""
        if '?' in user_query:
            return user_query.strip()
        
        topic = analysis['main_topic']
        query_type = analysis['query_type']
        
        if query_type == 'comparative_analysis':
            return f"{topic}に関する比較分析：主要な違いと特徴は何か？"
        elif query_type == 'implementation_study':
            return f"{topic}の実装方法と技術的要件は何か？"
        elif query_type == 'technical_survey':
            return f"{topic}の技術動向と実用性はどの程度か？"
        else:
            return f"{topic}の現状と今後の展望はどうか？"
    
    def _generate_sub_questions(self, analysis: Dict) -> List[str]:
        """Generate sub-questions based on analysis"""
        query_type = analysis['query_type']
        topic = analysis['main_topic']
        
        if query_type == 'technical_survey':
            return [
                f"{topic}の核心技術は何か？",
                f"現在の技術的限界は何か？",
                f"実用化における課題は何か？",
                f"今後の発展方向はどうか？"
            ]
        elif query_type == 'comparative_analysis':
            return [
                "主要な比較対象は何か？",
                "技術的な違いは何か？",
                "性能・効率面での差異は？",
                "用途・適用領域の違いは？"
            ]
        else:
            return [
                f"{topic}の基本概念は何か？",
                "現在の動向はどうか？",
                "実用例・事例はあるか？",
                "将来性はどうか？"
            ]
    
    def _define_scope(self, analysis: Dict) -> str:
        """Define research scope"""
        scope_parts = []
        
        if 'recent_focus' in analysis['scope_indicators']:
            scope_parts.append("2023年以降の最新動向に焦点")
        if 'practical_focus' in analysis['scope_indicators']:
            scope_parts.append("実用的な応用事例を重視")
        if 'theoretical_focus' in analysis['scope_indicators']:
            scope_parts.append("理論的背景を含む学術的観点")
        
        if not scope_parts:
            scope_parts.append("包括的な現状分析と将来展望")
        
        return "、".join(scope_parts)
    
    def _define_expected_outcomes(self, analysis: Dict) -> List[str]:
        """Define expected outcomes"""
        outcomes = ["包括的な技術概要レポート"]
        
        if analysis['query_type'] == 'comparative_analysis':
            outcomes.append("詳細比較分析表")
        if analysis['query_type'] == 'implementation_study':
            outcomes.append("実装指針・ガイドライン")
        
        outcomes.extend([
            "主要な課題・制限事項の整理",
            "今後の研究・開発方向の提示"
        ])
        
        return outcomes
    
    def _define_success_criteria(self, analysis: Dict) -> List[str]:
        """Define success criteria"""
        return [
            "主要な技術要素の90%以上をカバー",
            "信頼性の高い情報源からの引用3件以上/セクション",
            "論理的一貫性スコア85%以上",
            "最新情報（2年以内）の比率60%以上"
        ]
    
    def _determine_section_count(self, analysis: Dict, max_sections: int) -> int:
        """Determine optimal section count"""
        base_sections = 4  # intro, main×2, conclusion
        
        if analysis['complexity_level'] == 'simple':
            return min(base_sections, max_sections)
        elif analysis['complexity_level'] == 'moderate':
            return min(base_sections + 2, max_sections)
        else:
            return min(base_sections + 3, max_sections)
    
    def _generate_sections(self, analysis: Dict, section_count: int, 
                          target_length: int) -> List[Section]:
        """Generate section specifications"""
        sections = []
        avg_length = target_length // section_count
        
        query_type = analysis['query_type']
        topic = analysis['main_topic']
        
        # Introduction section
        sections.append(self._create_section(
            "intro_001", "イントロダクション",
            "研究背景、問題定義、論文構成",
            int(avg_length * 0.8), 5, [], query_type, topic
        ))
        
        # Main sections based on query type
        if query_type == 'technical_survey':
            sections.extend(self._create_technical_sections(analysis, avg_length))
        elif query_type == 'comparative_analysis':
            sections.extend(self._create_comparative_sections(analysis, avg_length))
        else:
            sections.extend(self._create_general_sections(analysis, avg_length))
        
        # Conclusion section
        sections.append(self._create_section(
            f"conclusion_{section_count:03d}", "結論・今後の展望",
            "研究結果の総括と今後の方向性",
            int(avg_length * 0.9), 4, 
            [s.section_id for s in sections[-2:]], query_type, topic
        ))
        
        return sections[:section_count]
    
    def _create_section(self, section_id: str, title: str, description: str,
                       target_length: int, priority: int, dependencies: List[str],
                       query_type: str, topic: str) -> Section:
        """Create a section with complete specifications"""
        
        subsections = self._generate_subsections(section_id, title, query_type)
        content_reqs = self._generate_content_requirements(title, query_type, topic)
        search_specs = self._generate_search_specifications(title, query_type, topic)
        quality_indicators = self._generate_quality_indicators(title, query_type)
        
        return Section(
            section_id=section_id,
            title=title,
            description=description,
            target_length=target_length,
            priority=priority,
            dependencies=dependencies,
            subsections=subsections,
            content_requirements=content_reqs,
            search_specifications=search_specs,
            quality_indicators=quality_indicators
        )
    
    def _generate_subsections(self, section_id: str, title: str, query_type: str) -> List[Subsection]:
        """Generate subsections for a section"""
        if "イントロダクション" in title:
            return [
                Subsection(f"{section_id}_1", "背景情報", 
                          ["現状把握", "問題提起"], ["統計データ", "先行研究"]),
                Subsection(f"{section_id}_2", "研究目的", 
                          ["目的明確化", "意義説明"], ["研究gap", "期待効果"])
            ]
        elif "技術概要" in title:
            return [
                Subsection(f"{section_id}_1", "基本原理", 
                          ["核心技術", "動作原理"], ["技術文書", "実装例"]),
                Subsection(f"{section_id}_2", "技術仕様", 
                          ["性能指標", "制限事項"], ["ベンチマーク", "比較データ"])
            ]
        else:
            return [
                Subsection(f"{section_id}_1", "主要論点", 
                          ["核心要素", "重要側面"], ["専門家見解", "事例"]),
                Subsection(f"{section_id}_2", "詳細分析", 
                          ["深掘り", "考察"], ["データ分析", "検証結果"])
            ]
    
    def _generate_content_requirements(self, title: str, query_type: str, topic: str) -> ContentRequirements:
        """Generate content requirements for section"""
        if "イントロダクション" in title:
            return ContentRequirements(
                required_elements=["背景情報", "問題定義", "研究意義", "論文構成"],
                key_concepts=[topic, "技術動向", "市場状況"],
                evidence_types=["統計データ", "先行研究", "業界動向"]
            )
        elif "技術概要" in title:
            return ContentRequirements(
                required_elements=["技術原理", "仕様詳細", "実装方法", "性能評価"],
                key_concepts=[topic, "アーキテクチャ", "アルゴリズム"],
                evidence_types=["技術文書", "実装事例", "性能データ"]
            )
        else:
            return ContentRequirements(
                required_elements=["現状分析", "課題整理", "解決方向", "展望"],
                key_concepts=[topic, "課題", "ソリューション"],
                evidence_types=["事例研究", "専門家見解", "データ分析"]
            )
    
    def _generate_search_specifications(self, title: str, query_type: str, topic: str) -> SearchSpecifications:
        """Generate search specifications for section"""
        primary_keywords = [topic]
        secondary_keywords = []
        
        if "イントロダクション" in title:
            secondary_keywords = ["背景", "現状", "動向", "市場"]
        elif "技術概要" in title:
            secondary_keywords = ["技術", "実装", "アーキテクチャ", "仕様"]
        else:
            secondary_keywords = ["分析", "課題", "解決", "将来"]
        
        return SearchSpecifications(
            primary_keywords=primary_keywords,
            secondary_keywords=secondary_keywords,
            search_operators=["AND", "OR"],
            source_filters={
                "publication_year": ">= 2021",
                "source_types": ["academic", "industry_report", "technical"],
                "languages": ["ja", "en"]
            }
        )
    
    def _generate_quality_indicators(self, title: str, query_type: str) -> QualityIndicators:
        """Generate quality indicators for section"""
        if "イントロダクション" in title:
            return QualityIndicators(
                completion_criteria=[
                    "背景情報の網羅性 >= 80%",
                    "問題定義の明確性 >= 90%",
                    "引用数 >= 3"
                ],
                deficiency_markers=[
                    "具体的データ不足",
                    "先行研究不足",
                    "問題定義曖昧"
                ]
            )
        else:
            return QualityIndicators(
                completion_criteria=[
                    "内容の網羅性 >= 85%",
                    "論理的整合性 >= 80%",
                    "エビデンス充実度 >= 75%"
                ],
                deficiency_markers=[
                    "説明不足",
                    "根拠薄弱",
                    "論理飛躍"
                ]
            )
    
    def _create_technical_sections(self, analysis: Dict, avg_length: int) -> List[Section]:
        """Create technical survey specific sections"""
        topic = analysis['main_topic']
        return [
            self._create_section("tech_overview_002", "技術概要", 
                                "核心技術とアーキテクチャ", avg_length, 5, ["intro_001"], 
                                'technical_survey', topic),
            self._create_section("implementation_003", "実装・事例", 
                                "実装方法と実用事例", avg_length, 4, ["tech_overview_002"],
                                'technical_survey', topic),
            self._create_section("evaluation_004", "性能・評価", 
                                "性能分析と評価結果", avg_length, 4, ["implementation_003"],
                                'technical_survey', topic)
        ]
    
    def _create_comparative_sections(self, analysis: Dict, avg_length: int) -> List[Section]:
        """Create comparative analysis specific sections"""
        topic = analysis['main_topic']
        return [
            self._create_section("subjects_002", "比較対象", 
                                "比較対象の特徴と選定理由", avg_length, 5, ["intro_001"],
                                'comparative_analysis', topic),
            self._create_section("comparison_003", "詳細比較", 
                                "多軸での詳細比較分析", int(avg_length * 1.2), 5, ["subjects_002"],
                                'comparative_analysis', topic),
            self._create_section("evaluation_004", "総合評価", 
                                "比較結果の評価と考察", avg_length, 4, ["comparison_003"],
                                'comparative_analysis', topic)
        ]
    
    def _create_general_sections(self, analysis: Dict, avg_length: int) -> List[Section]:
        """Create general sections"""
        topic = analysis['main_topic']
        return [
            self._create_section("overview_002", "概要・現状", 
                                "基本概要と現状分析", avg_length, 5, ["intro_001"],
                                'explanatory_survey', topic),
            self._create_section("analysis_003", "詳細分析", 
                                "詳細な分析と考察", avg_length, 4, ["overview_002"],
                                'explanatory_survey', topic),
            self._create_section("applications_004", "応用・展望", 
                                "応用事例と将来展望", avg_length, 4, ["analysis_003"],
                                'explanatory_survey', topic)
        ]
    
    def _generate_search_phases(self, analysis: Dict, structure: StructurePlan, 
                               total_iterations: int) -> List[SearchPhase]:
        """Generate search phases"""
        phases = []
        sections = [s.section_id for s in structure.sections]
        
        # Phase 1: Broad survey (1/3 of iterations)
        phase1_iterations = total_iterations // 3
        phases.append(SearchPhase(
            phase_id="phase_1",
            phase_name="広範囲情報収集",
            target_sections=sections[:len(sections)//2],
            search_focus="基本概念・全体像把握",
            query_types=["broad_survey", "overview"],
            iteration_count=phase1_iterations
        ))
        
        # Phase 2: Detailed analysis (1/2 of remaining)
        phase2_iterations = (total_iterations - phase1_iterations) // 2
        phases.append(SearchPhase(
            phase_id="phase_2",
            phase_name="詳細調査・分析",
            target_sections=sections[1:-1],
            search_focus="詳細技術・比較分析",
            query_types=["detailed_analysis", "technical_deep_dive"],
            iteration_count=phase2_iterations
        ))
        
        # Phase 3: Verification (remaining)
        phase3_iterations = total_iterations - phase1_iterations - phase2_iterations
        phases.append(SearchPhase(
            phase_id="phase_3",
            phase_name="検証・補完",
            target_sections=sections,
            search_focus="情報検証・不足補完",
            query_types=["verification", "gap_filling"],
            iteration_count=phase3_iterations
        ))
        
        return phases
    
    def _define_source_requirements(self, analysis: Dict) -> SourceRequirements:
        """Define source requirements based on analysis"""
        if analysis['query_type'] == 'technical_survey':
            return SourceRequirements(
                academic_sources=5,
                recent_sources=8,
                diverse_sources=6,
                primary_sources=3
            )
        elif analysis['query_type'] == 'comparative_analysis':
            return SourceRequirements(
                academic_sources=4,
                recent_sources=6,
                diverse_sources=8,
                primary_sources=2
            )
        else:
            return SourceRequirements(
                academic_sources=3,
                recent_sources=5,
                diverse_sources=4,
                primary_sources=2
            )
    
    def _load_section_templates(self) -> Dict:
        """Load section templates (simplified)"""
        return {}
    
    def _load_search_strategies(self) -> Dict:
        """Load search strategies (simplified)"""
        return {}


class PlanValidator:
    """Validates research plans for quality and feasibility"""
    
    def validate_plan(self, plan: ResearchPlan) -> Tuple[bool, Dict[str, Any], List[str]]:
        """Comprehensive plan validation"""
        is_valid, errors = plan.validate()
        
        # Additional validation
        validation_scores = self._calculate_validation_scores(plan)
        suggestions = self._generate_improvement_suggestions(plan, validation_scores)
        
        return is_valid, validation_scores, suggestions
    
    def _calculate_validation_scores(self, plan: ResearchPlan) -> Dict[str, float]:
        """Calculate validation scores for different aspects"""
        scores = {}
        
        # Structure integrity
        scores['structure_integrity'] = self._validate_structure_integrity(plan)
        
        # Feasibility
        scores['feasibility'] = self._validate_feasibility(plan)
        
        # Completeness
        scores['completeness'] = self._validate_completeness(plan)
        
        # Efficiency
        scores['efficiency'] = self._validate_efficiency(plan)
        
        # Quality standards
        scores['quality_standards'] = self._validate_quality_standards(plan)
        
        scores['overall_score'] = sum(scores.values()) / len(scores)
        
        return scores
    
    def _validate_structure_integrity(self, plan: ResearchPlan) -> float:
        """Validate structure integrity"""
        score = 1.0
        
        # Check section dependencies
        section_graph = {}
        for section in plan.structure_plan.sections:
            section_graph[section.section_id] = section.dependencies
        
        # Check for cycles
        if self._has_circular_dependencies(section_graph):
            score -= 0.3
        
        # Check logical flow
        if not self._has_logical_flow(plan.structure_plan.sections):
            score -= 0.2
        
        return max(score, 0.0)
    
    def _validate_feasibility(self, plan: ResearchPlan) -> float:
        """Validate plan feasibility"""
        score = 1.0
        
        # Check time constraints
        if plan.plan_metadata.estimated_duration > 180:  # 3 hours
            score -= 0.2
        
        # Check resource requirements
        total_sources_required = (
            plan.search_strategy.source_requirements.academic_sources +
            plan.search_strategy.source_requirements.recent_sources +
            plan.search_strategy.source_requirements.diverse_sources
        )
        
        if total_sources_required > 30:
            score -= 0.3
        
        return max(score, 0.0)
    
    def _validate_completeness(self, plan: ResearchPlan) -> float:
        """Validate plan completeness"""
        score = 1.0
        
        # Check if all essential sections are present
        section_titles = [s.title for s in plan.structure_plan.sections]
        
        if not any("イントロダクション" in title for title in section_titles):
            score -= 0.2
        
        if not any("結論" in title or "展望" in title for title in section_titles):
            score -= 0.2
        
        # Check subsection coverage
        avg_subsections = sum(len(s.subsections) for s in plan.structure_plan.sections) / len(plan.structure_plan.sections)
        if avg_subsections < 2:
            score -= 0.1
        
        return max(score, 0.0)
    
    def _validate_efficiency(self, plan: ResearchPlan) -> float:
        """Validate plan efficiency"""
        score = 1.0
        
        # Check search iteration distribution
        total_iterations = plan.search_strategy.total_iterations
        phase_iterations = sum(p.iteration_count for p in plan.search_strategy.search_phases)
        
        if phase_iterations != total_iterations:
            score -= 0.3
        
        # Check section length balance
        lengths = [s.target_length for s in plan.structure_plan.sections]
        if max(lengths) / min(lengths) > 3:
            score -= 0.2
        
        return max(score, 0.0)
    
    def _validate_quality_standards(self, plan: ResearchPlan) -> float:
        """Validate quality standards"""
        score = 1.0
        
        # Check quality thresholds
        criteria = plan.quality_criteria
        
        if criteria.coverage_thresholds.minimum_coverage < 0.7:
            score -= 0.2
        
        if criteria.evidence_standards.citation_density < 2.0:
            score -= 0.1
        
        return max(score, 0.0)
    
    def _has_circular_dependencies(self, graph: Dict[str, List[str]]) -> bool:
        """Check for circular dependencies in section graph"""
        visited = set()
        rec_stack = set()
        
        def dfs(node):
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node)
            return False
        
        for node in graph:
            if node not in visited:
                if dfs(node):
                    return True
        
        return False
    
    def _has_logical_flow(self, sections: List[Section]) -> bool:
        """Check if sections have logical flow"""
        # Simple check: introduction first, conclusion last
        if len(sections) < 2:
            return True
        
        first_title = sections[0].title.lower()
        last_title = sections[-1].title.lower()
        
        has_intro = "イントロダクション" in first_title or "序論" in first_title
        has_conclusion = "結論" in last_title or "展望" in last_title
        
        return has_intro and has_conclusion
    
    def _generate_improvement_suggestions(self, plan: ResearchPlan, scores: Dict[str, float]) -> List[str]:
        """Generate improvement suggestions based on validation scores"""
        suggestions = []
        
        if scores['structure_integrity'] < 0.8:
            suggestions.append("セクション間の依存関係を見直し、論理的な流れを改善してください")
        
        if scores['feasibility'] < 0.7:
            suggestions.append("リソース要件を削減し、より実現可能な計画に調整してください")
        
        if scores['completeness'] < 0.8:
            suggestions.append("必要なセクション（序論・結論）を追加し、網羅性を向上させてください")
        
        if scores['efficiency'] < 0.7:
            suggestions.append("検索反復数の配分とセクション長のバランスを最適化してください")
        
        return suggestions


class ResearchPlannerAgent:
    """Main Research Planner Agent class"""
    
    def __init__(self):
        self.generator = PlanGenerator()
        self.validator = PlanValidator()
    
    def plan_research(self, user_query: str, constraints: Optional[Dict] = None,
                     domain_context: Optional[Dict] = None,
                     user_preferences: Optional[Dict] = None) -> Dict[str, Any]:
        """Main entry point for research planning"""
        
        try:
            # Generate initial plan
            plan = self.generator.generate_plan(
                user_query, constraints, domain_context, user_preferences
            )
            
            # Validate plan
            is_valid, validation_scores, suggestions = self.validator.validate_plan(plan)
            
            # If validation score is too low, refine plan
            if validation_scores['overall_score'] < 0.7:
                plan = self._refine_plan(plan, suggestions)
                is_valid, validation_scores, suggestions = self.validator.validate_plan(plan)
            
            return {
                'status': 'success',
                'plan': json.loads(plan.to_json()),
                'validation': {
                    'is_valid': is_valid,
                    'scores': validation_scores,
                    'suggestions': suggestions
                }
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'plan': None,
                'validation': None
            }
    
    def _refine_plan(self, plan: ResearchPlan, suggestions: List[str]) -> ResearchPlan:
        """Refine plan based on suggestions"""
        # Simplified refinement - in real implementation, use LLM for refinement
        
        # Adjust search iterations if efficiency is low
        if any("検索反復数" in s or "最適化" in s for s in suggestions):
            original_total = plan.search_strategy.total_iterations
            plan.search_strategy.total_iterations = min(original_total, 15)
            
            # Redistribute phase iterations
            new_total = plan.search_strategy.total_iterations
            phase1_iter = max(1, new_total // 3)
            phase2_iter = max(1, (new_total - phase1_iter) // 2) 
            phase3_iter = max(1, new_total - phase1_iter - phase2_iter)
            
            if len(plan.search_strategy.search_phases) >= 3:
                plan.search_strategy.search_phases[0].iteration_count = phase1_iter
                plan.search_strategy.search_phases[1].iteration_count = phase2_iter
                plan.search_strategy.search_phases[2].iteration_count = phase3_iter
        
        # Adjust section lengths if balance is poor
        if any("セクション長" in s or "バランス" in s for s in suggestions):
            total_length = plan.structure_plan.report_length
            section_count = len(plan.structure_plan.sections)
            avg_length = total_length // section_count
            
            for section in plan.structure_plan.sections:
                if "イントロダクション" in section.title:
                    section.target_length = int(avg_length * 0.8)
                elif "結論" in section.title or "展望" in section.title:
                    section.target_length = int(avg_length * 0.9)
                else:
                    section.target_length = avg_length
        
        # Reduce resource requirements if feasibility is low
        if any("リソース" in s or "実現可能" in s for s in suggestions):
            reqs = plan.search_strategy.source_requirements
            reqs.academic_sources = min(reqs.academic_sources, 8)
            reqs.recent_sources = min(reqs.recent_sources, 10)
            reqs.diverse_sources = min(reqs.diverse_sources, 8)
            reqs.primary_sources = min(reqs.primary_sources, 5)
        
        return plan


# Test function
def test_research_planner():
    """Test the research planner with sample queries"""
    
    agent = ResearchPlannerAgent()
    
    test_queries = [
        "AIチャットボットの自然言語処理技術について詳しく調査して",
        "GPT-4とClaude 3.5の性能を比較分析したい",
        "リアルタイム音声認識システムの実装方法を研究",
        "ブロックチェーン技術の仕組みと応用"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n=== Test Case {i}: {query} ===")
        
        result = agent.plan_research(
            query,
            constraints={'target_length': 4000, 'max_sections': 5},
            user_preferences={'evidence_weight': 0.8, 'creativity_level': 0.6}
        )
        
        if result['status'] == 'success':
            plan = result['plan']
            validation = result['validation']
            
            print(f"Plan ID: {plan['plan_metadata']['plan_id']}")
            print(f"Complexity Score: {plan['plan_metadata']['complexity_score']}")
            print(f"Estimated Duration: {plan['plan_metadata']['estimated_duration']} min")
            print(f"Section Count: {plan['structure_plan']['section_count']}")
            print(f"Validation Score: {validation['scores']['overall_score']:.2f}")
            
            if validation['suggestions']:
                print("Suggestions:")
                for suggestion in validation['suggestions']:
                    print(f"  - {suggestion}")
        else:
            print(f"Error: {result['error']}")


if __name__ == "__main__":
    test_research_planner()