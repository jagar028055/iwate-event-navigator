# TTD-DR (Test-Time Diffusion Deep Researcher) System Documentation

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Component Documentation](#component-documentation)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Monitoring & Logging](#monitoring--logging)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

The TTD-DR (Test-Time Diffusion Deep Researcher) system is a comprehensive research automation framework that leverages Claude Code's tool ecosystem to generate high-quality research reports through iterative improvement and self-evolution.

### Key Features

- **4-Agent Pipeline Architecture**: Research Planner, Iterative Researcher, Self-Evolution, and Final Integrator agents
- **Intelligent Caching**: Multi-strategy adaptive caching system for performance optimization
- **Real-time Monitoring**: Comprehensive metrics collection and alerting system
- **Error Recovery**: Robust error handling with multiple recovery strategies
- **Performance Optimization**: Dynamic resource management and parallel processing
- **Quality Assurance**: Multi-dimensional quality assessment and validation

### System Requirements

- Python 3.8+
- Claude Code CLI environment
- 2GB+ RAM recommended
- 1GB+ disk space for logs and cache
- Network connectivity for external research

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TTD-DR System                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  System Integ.  │  │ Error Handling  │  │ Monitoring      │ │
│  │     Framework   │  │    & Recovery   │  │   & Logging     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Performance   │  │    Quality      │  │   Resource      │ │
│  │  Optimization   │  │   Assurance     │  │   Management    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        Core Agents                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Research      │  │   Iterative     │  │ Self-Evolution  │ │
│  │    Planner      │──│   Researcher    │──│     Agent       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                │                                │
│                        ┌─────────────────┐                     │
│                        │ Final Integrator│                     │
│                        │     Agent       │                     │
│                        └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Documentation

### Core Agents

#### 1. Research Planner Agent (`research_planner_agent.py`)

**Purpose**: Generates structured research plans from user queries.

**Key Components**:
- `QueryAnalyzer`: Analyzes and classifies user queries
- `PlanGenerator`: Creates comprehensive research plans
- `PlanValidator`: Validates plan structure and feasibility

**Input**: User query string + constraints
**Output**: Structured research plan with sections, search strategy, and quality criteria

```python
# Example usage
planner = ResearchPlannerAgent()
result = planner.plan_research(
    user_query="AIチャットボットの自然言語処理技術について詳しく調査して",
    constraints={'target_length': 5000, 'max_sections': 6}
)
```

#### 2. Iterative Researcher Agent (`iterative_researcher_agent.py`)

**Purpose**: Executes research plan through systematic search and quality evaluation.

**Key Components**:
- `QueryGenerator`: Generates targeted search queries
- `InformationExtractor`: Extracts structured content from search results
- `QualityEvaluator`: Evaluates search result quality and relevance
- `ProgressTracker`: Tracks research progress and convergence

**Input**: Research plan from Planner Agent
**Output**: Comprehensive search results with quality metrics

```python
# Example usage
researcher = IterativeResearcherAgent()
result = researcher.execute_research_plan(research_plan)
```

#### 3. Self-Evolution Agent (`self_evolution_agent.py`)

**Purpose**: Generates multiple content variants and selects optimal versions.

**Key Components**:
- `VariantGenerator`: Creates diverse content variants using different strategies
- `LLMJudgeEvaluator`: Comprehensive quality evaluation system
- `VariantMerger`: Intelligent merging of multiple variants

**Input**: Research results from Iterative Researcher
**Output**: Enhanced content with improved quality scores

```python
# Example usage
evolution_agent = SelfEvolutionAgent()
result = evolution_agent.evolve_content({
    'content': base_content,
    'research_results': search_results,
    'target_section': section_spec
})
```

#### 4. Final Integrator Agent (`final_integrator_agent.py`)

**Purpose**: Combines all outputs into polished, publication-ready reports.

**Key Components**:
- Content integration and deduplication
- Consistency checking and resolution
- Reference standardization
- Multi-format output generation

**Input**: Outputs from all previous agents
**Output**: Final research report in multiple formats

### System Framework Components

#### System Integration Framework (`ttd_dr_system_integration.py`)

**Purpose**: Orchestrates the entire TTD-DR pipeline with comprehensive coordination.

**Key Features**:
- **Pipeline Orchestration**: Manages sequential agent execution
- **Quality Gates**: Validates agent outputs at each stage
- **Recovery Management**: Handles agent failures gracefully
- **Performance Tracking**: Records execution metrics
- **State Management**: Maintains execution state and context

```python
# Example usage
config = create_default_configuration()
system = TTDDRSystemIntegrator(config)
result = system.execute_research_pipeline(
    user_query="Your research question",
    constraints={'target_length': 3000}
)
```

#### Error Handling System (`ttd_dr_error_handling.py`)

**Purpose**: Comprehensive error management and recovery.

**Key Features**:
- **Error Classification**: Automatic categorization by type and severity
- **Recovery Strategies**: Multiple recovery approaches (retry, fallback, degrade)
- **Context Preservation**: Maintains execution context for debugging
- **Statistics Tracking**: Error pattern analysis and reporting

**Recovery Strategies**:
- **Retry**: Exponential backoff retry with configurable attempts
- **Fallback**: Use simplified or cached data
- **Degrade**: Continue with reduced functionality  
- **Skip**: Skip failed operation and continue
- **Partial Continue**: Use partial results
- **Abort**: Stop execution for critical errors

#### Performance Optimization (`ttd_dr_performance_optimization.py`)

**Purpose**: Speed and memory efficiency optimization.

**Key Features**:
- **Intelligent Caching**: Multi-strategy adaptive caching (LRU, LFU, TTL, Adaptive)
- **Resource Monitoring**: Real-time CPU and memory tracking
- **Parallel Processing**: Dynamic worker allocation
- **Memory Optimization**: Data structure optimization and garbage collection
- **Performance Metrics**: Comprehensive performance tracking

**Optimization Levels**:
- **Minimal**: Basic optimizations only
- **Balanced**: Standard optimizations for most use cases
- **Aggressive**: Maximum performance with higher resource usage
- **Maximum**: All optimizations enabled

#### Monitoring & Logging (`ttd_dr_monitoring_logging.py`)

**Purpose**: Comprehensive system observability.

**Key Features**:
- **Structured Logging**: Multi-level logging with context
- **Metrics Collection**: High-performance metrics aggregation
- **Real-time Alerting**: Configurable alert rules and notifications
- **Performance Dashboards**: Text-based monitoring interface
- **Database Storage**: SQLite-based persistent storage

## Installation & Setup

### Prerequisites

1. **Claude Code Environment**: Ensure Claude Code is properly installed and configured
2. **Python Dependencies**: Standard library modules (no external dependencies)
3. **System Resources**: Minimum 2GB RAM, 1GB disk space

### Installation Steps

1. **Clone/Download Files**: Ensure all TTD-DR Python files are in your working directory
2. **Directory Setup**: Create output directories for logs and cache
3. **Configuration**: Customize system configuration as needed

```bash
# Create output directories
mkdir -p ttd_dr_output ttd_dr_logs ttd_dr_cache

# Verify Python version
python --version  # Should be 3.8+
```

### Configuration

The system uses configuration objects for customization:

```python
from ttd_dr_system_integration import SystemConfiguration, ResourceLimits

config = SystemConfiguration(
    planner_config={'target_length': 5000, 'max_sections': 6},
    researcher_config={'max_results_per_query': 5, 'convergence_threshold': 0.85},
    evolution_config={'max_iterations': 5, 'convergence_threshold': 4.0},
    integrator_config={'output_formats': ['markdown', 'html']},
    resource_limits=ResourceLimits(max_memory_mb=2000, max_cpu_percent=80),
    output_directory="./ttd_dr_output"
)
```

## Usage Guide

### Basic Usage

```python
from ttd_dr_system_integration import TTDDRSystemIntegrator, create_default_configuration

# Initialize system
config = create_default_configuration()
system = TTDDRSystemIntegrator(config)

# Execute research
result = system.execute_research_pipeline(
    user_query="最新のAI技術動向について調査してください",
    constraints={
        'target_length': 4000,
        'max_sections': 5,
        'search_iterations': 12
    }
)

# Check results
if result['status'] == 'success':
    print(f"Research completed in {result['total_duration']:.2f}s")
    print(f"Quality score: {result['quality_metrics']['overall_quality']:.2f}")
    
    # Access final report
    final_report = result['final_output']['research_report']
    print(f"Report length: {final_report['word_count']} words")
else:
    print(f"Research failed: {result['error']}")
```

### Advanced Usage with Monitoring

```python
from ttd_dr_monitoring_logging import TTDDRMonitoringSystem
from ttd_dr_performance_optimization import create_agent_optimizer, OptimizationLevel

# Initialize monitoring
monitoring = TTDDRMonitoringSystem()

# Create optimized system
config = create_default_configuration()
config.level = OptimizationLevel.AGGRESSIVE

system = TTDDRSystemIntegrator(config)

# Execute with full monitoring
monitoring.set_context(execution_id="research_001")

try:
    result = system.execute_research_pipeline(
        user_query="深層学習の最新研究動向",
        constraints={'target_length': 6000}
    )
    
    # Log success metrics
    monitoring.log_performance_metrics(
        "full_pipeline", 
        result['total_duration'], 
        1024.0  # memory usage
    )
    
finally:
    # Generate monitoring report
    monitoring.print_dashboard()
    monitoring.shutdown()
```

### Individual Agent Usage

You can also use individual agents independently:

```python
# Research planning only
from research_planner_agent import ResearchPlannerAgent

planner = ResearchPlannerAgent()
plan_result = planner.plan_research(
    "クラウドコンピューティングのセキュリティについて",
    constraints={'target_length': 3000}
)

# Iterative research only
from iterative_researcher_agent import IterativeResearcherAgent

researcher = IterativeResearcherAgent()
research_result = researcher.execute_research_plan(plan_result['plan'])
```

## Performance Optimization

### Optimization Strategies

1. **Caching Configuration**

```python
from ttd_dr_performance_optimization import OptimizationConfig, CacheStrategy

config = OptimizationConfig(
    level=OptimizationLevel.BALANCED,
    cache_strategy=CacheStrategy.ADAPTIVE,
    enable_caching=True,
    resource_limits=ResourceLimits(max_cache_size_mb=500)
)
```

2. **Parallel Processing**

```python
# Enable parallel processing for suitable operations
config.enable_parallel_processing = True
config.resource_limits.max_parallel_workers = 4
```

3. **Memory Optimization**

```python
# Enable memory optimization features
config.enable_memory_optimization = True
config.enable_lazy_loading = True
```

### Performance Monitoring

```python
optimizer = PerformanceOptimizer(config)

# Get performance report
report = optimizer.get_optimization_report()
print(f"Average efficiency: {report['performance_summary']['avg_efficiency_score']:.2f}")
print(f"Cache hit rate: {report['cache_performance']['hit_rate']:.2f}")
```

### Resource Limits

```python
limits = ResourceLimits(
    max_memory_mb=2000.0,     # 2GB memory limit
    max_cpu_percent=80.0,     # 80% CPU limit
    max_parallel_workers=4,   # 4 parallel workers max
    max_execution_time=1800.0 # 30 minute timeout
)
```

## Error Handling

### Error Categories

The system classifies errors into categories for appropriate handling:

- **VALIDATION**: Input validation failures
- **NETWORK**: Connectivity and API issues
- **TIMEOUT**: Operation timeouts
- **MEMORY**: Memory allocation errors
- **PROCESSING**: General processing failures
- **INTEGRATION**: Component integration issues
- **DATA**: Data format or corruption issues
- **CONFIGURATION**: Configuration errors
- **AGENT_FAILURE**: Individual agent failures
- **SYSTEM_FAILURE**: System-wide failures

### Recovery Strategies

```python
from ttd_dr_error_handling import EnhancedErrorHandler, with_error_handling

# Initialize error handler
error_handler = EnhancedErrorHandler()

# Use decorator for automatic error handling
@with_error_handling('research_planner')
def my_research_function(query: str):
    # Your research logic here
    return perform_research(query)

# Manual error handling
try:
    result = risky_operation()
except Exception as e:
    recovery_result = error_handler.handle_error(
        agent_name='my_agent',
        function_name='risky_operation',
        error=e,
        input_data={'query': 'test'}
    )
    
    if recovery_result.success:
        result = recovery_result.fallback_data
    else:
        raise e
```

### Error Statistics

```python
# Get error statistics
stats = error_handler.get_error_statistics()
print(f"Total errors: {stats.total_errors}")
print(f"Recovery rate: {stats.recovery_success_rate:.2f}")
print(f"Common patterns: {stats.common_failure_patterns}")
```

## Monitoring & Logging

### Structured Logging

```python
from ttd_dr_monitoring_logging import TTDDRMonitoringSystem

monitoring = TTDDRMonitoringSystem()

# Set context for logging
monitoring.set_context(
    agent_name="research_planner",
    execution_id="exec_001"
)

# Log various levels
monitoring.logger.info("Processing started")
monitoring.logger.warning("High memory usage detected", memory_mb=800)
monitoring.logger.error("Network timeout", timeout_seconds=30)
```

### Metrics Collection

```python
# Record different metric types
monitoring.metrics.increment("requests.total", tags={"method": "POST"})
monitoring.metrics.gauge("memory.usage_mb", 512.0)
monitoring.metrics.timer("request.duration", 1.5)
monitoring.metrics.histogram("response.size_bytes", 2048)
```

### Alerting

```python
# Add custom alert rule
from ttd_dr_monitoring_logging import AlertRule, AlertSeverity

rule = AlertRule(
    rule_id="custom_memory_alert",
    metric_name="memory.usage_mb",
    condition="gt",
    threshold=1000.0,
    severity=AlertSeverity.HIGH,
    window_minutes=5,
    cooldown_minutes=15
)

monitoring.alerts.add_alert_rule(rule)
```

### Dashboard

```python
# Print monitoring dashboard
monitoring.print_dashboard()

# Get system status programmatically  
status = monitoring.get_system_status()
print(f"Active alerts: {len(status['active_alerts'])}")
```

## API Reference

### System Integration API

#### `TTDDRSystemIntegrator`

Main system orchestrator class.

**Constructor**: `TTDDRSystemIntegrator(config: SystemConfiguration)`

**Methods**:
- `execute_research_pipeline(user_query: str, constraints: Dict) -> Dict[str, Any]`
- `get_system_status() -> Dict[str, Any]`

### Core Agent APIs

#### `ResearchPlannerAgent`

**Methods**:
- `plan_research(user_query: str, constraints: Dict, domain_context: Dict, user_preferences: Dict) -> Dict[str, Any]`

#### `IterativeResearcherAgent`

**Methods**:
- `execute_research_plan(research_plan: ResearchPlan, custom_config: Dict) -> Dict[str, Any]`

#### `SelfEvolutionAgent`

**Methods**:
- `evolve_content(input_data: Dict[str, Any]) -> Dict[str, Any]`

### Performance Optimization API

#### `PerformanceOptimizer`

**Methods**:
- `optimize_function(func: Callable, cache_ttl: int) -> Callable`
- `optimize_parallel_execution(tasks: List[Callable], use_processes: bool) -> List[Any]`
- `get_optimization_report() -> Dict[str, Any]`

### Monitoring API

#### `TTDDRMonitoringSystem`

**Methods**:
- `set_context(**kwargs)`
- `log_agent_start(agent_name: str, execution_id: str)`
- `log_agent_end(agent_name: str, execution_id: str, duration: float, success: bool)`
- `get_system_status() -> Dict[str, Any]`
- `generate_report() -> str`

## Examples

### Complete Research Pipeline Example

```python
#!/usr/bin/env python3
"""
Complete TTD-DR research pipeline example
"""

from ttd_dr_system_integration import TTDDRSystemIntegrator, create_default_configuration
from ttd_dr_monitoring_logging import TTDDRMonitoringSystem
from ttd_dr_performance_optimization import OptimizationLevel

def main():
    # Initialize monitoring
    monitoring = TTDDRMonitoringSystem()
    
    # Create optimized configuration
    config = create_default_configuration()
    config.planner_config['target_length'] = 4000
    config.researcher_config['search_iterations'] = 15
    config.evolution_config['max_iterations'] = 4
    
    # Initialize system
    system = TTDDRSystemIntegrator(config)
    
    # Research query
    query = "最新のトランスフォーマーアーキテクチャと大規模言語モデルの技術動向"
    
    try:
        print("🔍 Starting TTD-DR research pipeline...")
        
        # Execute research
        result = system.execute_research_pipeline(
            user_query=query,
            constraints={
                'target_length': 4000,
                'max_sections': 6,
                'search_iterations': 15
            }
        )
        
        if result['status'] == 'success':
            # Display results
            print("✅ Research completed successfully!")
            print(f"📊 Duration: {result['total_duration']:.2f}s")
            print(f"📈 Quality Score: {result['quality_metrics']['overall_quality']:.2f}/5.0")
            
            # Access components
            final_report = result['final_output']['research_report']
            execution_summary = result['final_output']['execution_summary']
            
            print(f"📝 Report: {final_report['word_count']} words, {final_report['sections']} sections")
            print(f"🔎 Search Results: {execution_summary['total_search_results']}")
            print(f"🔄 Evolution Iterations: {execution_summary['evolution_iterations']}")
            
            # Save report
            with open("research_report.md", "w", encoding="utf-8") as f:
                f.write(final_report['content'])
            print("💾 Report saved to research_report.md")
            
        else:
            print(f"❌ Research failed: {result['error']}")
            
    except Exception as e:
        print(f"💥 System error: {str(e)}")
        monitoring.log_error(str(e))
        
    finally:
        # Show monitoring dashboard
        print("\n📊 System Monitoring Dashboard:")
        monitoring.print_dashboard()
        
        # Cleanup
        monitoring.shutdown()

if __name__ == "__main__":
    main()
```

### Individual Component Examples

#### Research Planning Example

```python
from research_planner_agent import ResearchPlannerAgent

def plan_research_example():
    planner = ResearchPlannerAgent()
    
    result = planner.plan_research(
        user_query="人工知能の倫理的課題について包括的に調査",
        constraints={
            'target_length': 5000,
            'max_sections': 7,
            'search_iterations': 20
        },
        user_preferences={
            'evidence_weight': 0.9,
            'creativity_level': 0.6
        }
    )
    
    if result['status'] == 'success':
        plan = result['plan']
        print(f"Plan ID: {plan['plan_metadata']['plan_id']}")
        print(f"Sections: {plan['structure_plan']['section_count']}")
        print(f"Search Iterations: {plan['search_strategy']['total_iterations']}")
        
        # Display sections
        for section in plan['structure_plan']['sections']:
            print(f"- {section['title']} ({section['target_length']} words)")
```

#### Performance Optimization Example

```python
from ttd_dr_performance_optimization import create_agent_optimizer, OptimizationLevel

def performance_example():
    # Create optimizer for specific agent
    optimizer = create_agent_optimizer('iterative_researcher', OptimizationLevel.AGGRESSIVE)
    
    # Optimize a function
    @optimizer.optimize_function
    def expensive_operation(data_size: int):
        # Simulate expensive computation
        result = sum(i*i for i in range(data_size))
        return {'result': result, 'processed': data_size}
    
    # Test performance
    import time
    
    # First call (cache miss)
    start = time.time()
    result1 = expensive_operation(10000)
    miss_time = time.time() - start
    
    # Second call (cache hit)
    start = time.time()
    result2 = expensive_operation(10000)
    hit_time = time.time() - start
    
    print(f"Cache miss: {miss_time:.3f}s")
    print(f"Cache hit: {hit_time:.3f}s")
    print(f"Speedup: {miss_time/hit_time:.1f}x")
    
    # Get performance report
    report = optimizer.get_optimization_report()
    print(f"Cache hit rate: {report['cache_performance']['hit_rate']:.2f}")
    
    optimizer.shutdown()
```

## Troubleshooting

### Common Issues

#### 1. Memory Issues

**Problem**: System runs out of memory during research
**Solution**: 
- Reduce `target_length` and `max_sections` in constraints
- Enable memory optimization in configuration
- Increase system memory limits

```python
config.resource_limits.max_memory_mb = 1000  # Reduce limit
config.enable_memory_optimization = True
config.evolution_config['max_iterations'] = 3  # Reduce iterations
```

#### 2. Network/API Issues

**Problem**: WebSearch/WebFetch operations fail
**Solution**:
- Check network connectivity
- Verify Claude Code API access
- Enable error recovery with fallback data

```python
config.researcher_config['enable_fallback'] = True
config.researcher_config['retry_attempts'] = 3
```

#### 3. Performance Issues

**Problem**: Research takes too long to complete
**Solution**:
- Enable parallel processing
- Reduce search iterations
- Use aggressive optimization level

```python
config.enable_parallel_processing = True
config.researcher_config['search_iterations'] = 10  # Reduce from default 15
config.optimization_level = OptimizationLevel.AGGRESSIVE
```

#### 4. Quality Issues

**Problem**: Research output quality is low
**Solution**:
- Increase search iterations
- Enable self-evolution
- Raise quality thresholds

```python
config.researcher_config['search_iterations'] = 20
config.evolution_config['max_iterations'] = 6
config.quality_criteria['min_quality_threshold'] = 4.0
```

### Debug Mode

Enable debug logging for troubleshooting:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable debug mode in monitoring
monitoring = TTDDRMonitoringSystem()
monitoring.logger.debug("Debug mode enabled")
```

### Performance Diagnostics

```python
# Get detailed performance metrics
optimizer = PerformanceOptimizer(config)
report = optimizer.get_optimization_report()

print("Performance Diagnostics:")
print(f"Average execution time: {report['performance_summary']['avg_duration_seconds']:.2f}s")
print(f"Memory usage: {report['performance_summary']['avg_memory_mb']:.1f} MB")
print(f"Cache efficiency: {report['cache_performance']['hit_rate']:.2f}")

# Check resource usage
resource_status = report['resource_usage']
print(f"Current memory: {resource_status['current_memory_mb']:.1f} MB")
print(f"Current CPU: {resource_status['current_cpu_percent']:.1f}%")
```

### Log Analysis

```python
# Analyze recent logs for issues
monitoring = TTDDRMonitoringSystem()

# Query error logs
end_time = datetime.now().isoformat()
start_time = (datetime.now() - timedelta(hours=1)).isoformat()

error_logs = monitoring.logger.db_manager.query_logs(
    start_time, end_time,
    level=LogLevel.ERROR,
    limit=10
)

for log in error_logs:
    print(f"[{log['timestamp']}] {log['agent_name']}: {log['message']}")
```

## Contributing

### Development Setup

1. **Environment Setup**: Ensure Python 3.8+ and Claude Code environment
2. **Code Standards**: Follow PEP 8 style guidelines
3. **Testing**: Add tests for new functionality
4. **Documentation**: Update documentation for changes

### Code Structure

- **Core Agents**: Individual agent implementations
- **System Framework**: Integration, optimization, monitoring
- **Utilities**: Helper functions and decorators
- **Tests**: Unit and integration tests
- **Documentation**: Comprehensive guides and API docs

### Adding New Features

1. **Design**: Document the feature design and architecture
2. **Implementation**: Follow existing patterns and conventions
3. **Testing**: Add comprehensive tests
4. **Integration**: Update system integration framework
5. **Documentation**: Add usage examples and API documentation

### Quality Guidelines

- **Error Handling**: All functions should include proper error handling
- **Performance**: Consider performance impact of new features
- **Logging**: Add appropriate logging for debugging and monitoring
- **Configuration**: Make features configurable where appropriate

## License & Support

This system is designed for use with Claude Code and follows Anthropic's terms of service. For support:

1. Check troubleshooting section for common issues
2. Review logs and error messages for specific problems
3. Consult API documentation for usage questions
4. Follow best practices for performance and reliability

---

*Last updated: 2025-08-12*
*Version: 1.0.0 (Phase 1 MVP Complete)*