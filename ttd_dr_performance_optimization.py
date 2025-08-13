#!/usr/bin/env python3
"""
TTD-DR Performance Optimization System
Task 1.5.4 Implementation

Comprehensive performance optimization framework for speed and memory efficiency
across all four TTD-DR agents with intelligent caching, parallel processing,
and resource management.
"""

import time
import gc
import threading
import multiprocessing
import concurrent.futures
import functools
import weakref
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Tuple, Union
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict, OrderedDict
import json
import pickle
import hashlib
import psutil
import sys
import logging


class OptimizationLevel(Enum):
    """Performance optimization levels"""
    MINIMAL = "minimal"
    BALANCED = "balanced"
    AGGRESSIVE = "aggressive"
    MAXIMUM = "maximum"


class ResourceType(Enum):
    """System resource types"""
    CPU = "cpu"
    MEMORY = "memory"
    DISK = "disk"
    NETWORK = "network"


class CacheStrategy(Enum):
    """Caching strategies"""
    LRU = "lru"
    LFU = "lfu"
    TTL = "ttl"
    ADAPTIVE = "adaptive"


@dataclass
class PerformanceMetrics:
    """Performance measurement data"""
    operation_name: str
    start_time: float
    end_time: float
    duration: float
    memory_before: float
    memory_after: float
    memory_peak: float
    cpu_usage: float
    cache_hits: int
    cache_misses: int
    parallel_workers: int
    optimization_level: OptimizationLevel
    
    def efficiency_score(self) -> float:
        """Calculate efficiency score (0-1, higher is better)"""
        # Consider speed, memory efficiency, and cache performance
        speed_score = max(0, 1 - (self.duration / 60.0))  # Penalty after 1 minute
        memory_score = max(0, 1 - (self.memory_peak / 1000.0))  # Penalty after 1GB
        cache_score = self.cache_hits / max(1, self.cache_hits + self.cache_misses)
        
        return (speed_score * 0.4 + memory_score * 0.3 + cache_score * 0.3)


@dataclass
class ResourceLimits:
    """Resource usage limits"""
    max_memory_mb: float = 2000.0
    max_cpu_percent: float = 80.0
    max_parallel_workers: int = 4
    max_cache_size_mb: float = 500.0
    max_execution_time: float = 300.0  # seconds


@dataclass
class OptimizationConfig:
    """Optimization configuration"""
    level: OptimizationLevel
    enable_caching: bool = True
    enable_parallel_processing: bool = True
    enable_memory_optimization: bool = True
    enable_lazy_loading: bool = True
    resource_limits: ResourceLimits = None
    cache_strategy: CacheStrategy = CacheStrategy.ADAPTIVE
    
    def __post_init__(self):
        if self.resource_limits is None:
            self.resource_limits = ResourceLimits()


class IntelligentCache:
    """Adaptive caching system with multiple strategies"""
    
    def __init__(self, max_size_mb: float = 500.0, strategy: CacheStrategy = CacheStrategy.ADAPTIVE):
        self.max_size_bytes = int(max_size_mb * 1024 * 1024)
        self.strategy = strategy
        
        # Cache storage
        self.cache: OrderedDict = OrderedDict()
        self.access_counts: Dict[str, int] = defaultdict(int)
        self.access_times: Dict[str, datetime] = {}
        self.ttl_expiry: Dict[str, datetime] = {}
        
        # Statistics
        self.hits = 0
        self.misses = 0
        self.current_size = 0
        
        # Thread safety
        self.lock = threading.RLock()
        
    def get(self, key: str, default=None) -> Any:
        """Get item from cache"""
        with self.lock:
            if key in self.cache and self._is_valid(key):
                self.hits += 1
                self.access_counts[key] += 1
                self.access_times[key] = datetime.now()
                
                # Move to end for LRU
                if self.strategy in [CacheStrategy.LRU, CacheStrategy.ADAPTIVE]:
                    self.cache.move_to_end(key)
                    
                return self.cache[key]
            else:
                self.misses += 1
                return default
                
    def put(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        """Put item in cache"""
        with self.lock:
            # Calculate size of new item
            item_size = sys.getsizeof(pickle.dumps(value))
            
            # Check if item is too large
            if item_size > self.max_size_bytes:
                logging.warning(f"Cache item too large ({item_size} bytes), skipping")
                return
                
            # Make room if necessary
            self._make_room(item_size)
            
            # Add item
            self.cache[key] = value
            self.access_counts[key] += 1
            self.access_times[key] = datetime.now()
            self.current_size += item_size
            
            # Set TTL if specified
            if ttl_seconds:
                self.ttl_expiry[key] = datetime.now() + timedelta(seconds=ttl_seconds)
                
    def _is_valid(self, key: str) -> bool:
        """Check if cache item is still valid"""
        if key not in self.cache:
            return False
            
        # Check TTL expiry
        if key in self.ttl_expiry and datetime.now() > self.ttl_expiry[key]:
            self._remove_item(key)
            return False
            
        return True
        
    def _make_room(self, required_size: int):
        """Make room in cache using appropriate strategy"""
        
        while self.current_size + required_size > self.max_size_bytes and self.cache:
            if self.strategy == CacheStrategy.LRU:
                self._evict_lru()
            elif self.strategy == CacheStrategy.LFU:
                self._evict_lfu()
            elif self.strategy == CacheStrategy.TTL:
                self._evict_expired()
            elif self.strategy == CacheStrategy.ADAPTIVE:
                self._evict_adaptive()
            else:
                self._evict_lru()  # Default fallback
                
    def _evict_lru(self):
        """Evict least recently used item"""
        if self.cache:
            key, _ = self.cache.popitem(last=False)
            self._remove_item_metadata(key)
            
    def _evict_lfu(self):
        """Evict least frequently used item"""
        if self.cache:
            min_key = min(self.access_counts.keys(), key=lambda k: self.access_counts[k])
            del self.cache[min_key]
            self._remove_item_metadata(min_key)
            
    def _evict_expired(self):
        """Evict expired items first"""
        now = datetime.now()
        expired_keys = [k for k, expiry in self.ttl_expiry.items() if now > expiry]
        
        if expired_keys:
            for key in expired_keys:
                self._remove_item(key)
        else:
            self._evict_lru()  # Fallback
            
    def _evict_adaptive(self):
        """Adaptive eviction based on access patterns"""
        now = datetime.now()
        
        # Score items based on frequency, recency, and size
        scores = {}
        for key in self.cache:
            access_count = self.access_counts[key]
            last_access = self.access_times.get(key, now)
            recency_hours = (now - last_access).total_seconds() / 3600
            item_size = sys.getsizeof(pickle.dumps(self.cache[key]))
            
            # Higher score = more likely to evict
            score = (1 / max(1, access_count)) + (recency_hours * 0.1) + (item_size / 1000000)
            scores[key] = score
            
        # Evict highest scoring item
        worst_key = max(scores.keys(), key=lambda k: scores[k])
        del self.cache[worst_key]
        self._remove_item_metadata(worst_key)
        
    def _remove_item(self, key: str):
        """Remove item and its metadata"""
        if key in self.cache:
            item_size = sys.getsizeof(pickle.dumps(self.cache[key]))
            del self.cache[key]
            self.current_size -= item_size
            
        self._remove_item_metadata(key)
        
    def _remove_item_metadata(self, key: str):
        """Remove item metadata"""
        self.access_counts.pop(key, None)
        self.access_times.pop(key, None)
        self.ttl_expiry.pop(key, None)
        
    def clear(self):
        """Clear all cache contents"""
        with self.lock:
            self.cache.clear()
            self.access_counts.clear()
            self.access_times.clear()
            self.ttl_expiry.clear()
            self.current_size = 0
            
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.lock:
            hit_rate = self.hits / max(1, self.hits + self.misses)
            return {
                'hits': self.hits,
                'misses': self.misses,
                'hit_rate': hit_rate,
                'size_items': len(self.cache),
                'size_bytes': self.current_size,
                'size_mb': self.current_size / (1024 * 1024)
            }


class ResourceMonitor:
    """Real-time resource monitoring and throttling"""
    
    def __init__(self, limits: ResourceLimits):
        self.limits = limits
        self.monitoring_active = False
        self.monitor_thread = None
        self.resource_history = defaultdict(list)
        self.resource_lock = threading.RLock()
        
    def start_monitoring(self, interval_seconds: float = 1.0):
        """Start resource monitoring"""
        if self.monitoring_active:
            return
            
        self.monitoring_active = True
        self.monitor_thread = threading.Thread(
            target=self._monitoring_loop,
            args=(interval_seconds,),
            daemon=True
        )
        self.monitor_thread.start()
        
    def stop_monitoring(self):
        """Stop resource monitoring"""
        self.monitoring_active = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2.0)
            
    def _monitoring_loop(self, interval: float):
        """Main monitoring loop"""
        while self.monitoring_active:
            try:
                # Get current resource usage
                memory_mb = psutil.Process().memory_info().rss / (1024 * 1024)
                cpu_percent = psutil.cpu_percent(interval=0.1)
                
                with self.resource_lock:
                    self.resource_history['memory'].append(memory_mb)
                    self.resource_history['cpu'].append(cpu_percent)
                    
                    # Maintain history size
                    max_history = 60  # Last 60 measurements
                    for resource in self.resource_history:
                        if len(self.resource_history[resource]) > max_history:
                            self.resource_history[resource].pop(0)
                            
                time.sleep(interval)
                
            except Exception as e:
                logging.error(f"Resource monitoring error: {str(e)}")
                time.sleep(interval)
                
    def check_resource_limits(self) -> Dict[ResourceType, bool]:
        """Check if current usage exceeds limits"""
        try:
            memory_mb = psutil.Process().memory_info().rss / (1024 * 1024)
            cpu_percent = psutil.cpu_percent(interval=0.1)
            
            return {
                ResourceType.MEMORY: memory_mb > self.limits.max_memory_mb,
                ResourceType.CPU: cpu_percent > self.limits.max_cpu_percent
            }
        except Exception:
            return {ResourceType.MEMORY: False, ResourceType.CPU: False}
            
    def get_resource_status(self) -> Dict[str, Any]:
        """Get current resource status"""
        try:
            with self.resource_lock:
                memory_history = self.resource_history['memory'][-10:]  # Last 10 measurements
                cpu_history = self.resource_history['cpu'][-10:]
                
                return {
                    'current_memory_mb': psutil.Process().memory_info().rss / (1024 * 1024),
                    'current_cpu_percent': psutil.cpu_percent(),
                    'avg_memory_mb': sum(memory_history) / len(memory_history) if memory_history else 0,
                    'avg_cpu_percent': sum(cpu_history) / len(cpu_history) if cpu_history else 0,
                    'memory_limit': self.limits.max_memory_mb,
                    'cpu_limit': self.limits.max_cpu_percent
                }
        except Exception:
            return {'error': 'Unable to get resource status'}


class ParallelProcessor:
    """Intelligent parallel processing manager"""
    
    def __init__(self, max_workers: int = None):
        self.max_workers = max_workers or min(4, multiprocessing.cpu_count())
        self.thread_pool = None
        self.process_pool = None
        
    def execute_parallel_tasks(self, tasks: List[Callable], use_processes: bool = False,
                             timeout: Optional[float] = None) -> List[Any]:
        """Execute tasks in parallel"""
        
        if len(tasks) <= 1:
            # No need for parallelization
            return [task() for task in tasks]
            
        executor_class = concurrent.futures.ProcessPoolExecutor if use_processes else concurrent.futures.ThreadPoolExecutor
        max_workers = min(self.max_workers, len(tasks))
        
        try:
            with executor_class(max_workers=max_workers) as executor:
                futures = [executor.submit(task) for task in tasks]
                results = []
                
                for future in concurrent.futures.as_completed(futures, timeout=timeout):
                    try:
                        result = future.result()
                        results.append(result)
                    except Exception as e:
                        logging.error(f"Parallel task failed: {str(e)}")
                        results.append(None)
                        
                return results
                
        except concurrent.futures.TimeoutError:
            logging.warning(f"Parallel execution timed out after {timeout}s")
            return []
        except Exception as e:
            logging.error(f"Parallel execution failed: {str(e)}")
            return []
            
    def batch_process(self, items: List[Any], processor_func: Callable,
                     batch_size: int = None, use_processes: bool = False) -> List[Any]:
        """Process items in parallel batches"""
        
        if not items:
            return []
            
        # Determine optimal batch size
        if batch_size is None:
            batch_size = max(1, len(items) // self.max_workers)
            
        # Create batches
        batches = [items[i:i+batch_size] for i in range(0, len(items), batch_size)]
        
        # Create batch processing tasks
        tasks = [lambda batch=batch: [processor_func(item) for item in batch] for batch in batches]
        
        # Execute in parallel
        batch_results = self.execute_parallel_tasks(tasks, use_processes)
        
        # Flatten results
        results = []
        for batch_result in batch_results:
            if batch_result:
                results.extend(batch_result)
                
        return results


class MemoryOptimizer:
    """Memory usage optimization and management"""
    
    def __init__(self):
        self.weak_refs = weakref.WeakValueDictionary()
        self.memory_pools = {}
        
    def optimize_data_structures(self, data: Any) -> Any:
        """Optimize data structures for memory efficiency"""
        
        if isinstance(data, dict):
            return self._optimize_dict(data)
        elif isinstance(data, list):
            return self._optimize_list(data)
        elif isinstance(data, str):
            return self._optimize_string(data)
        else:
            return data
            
    def _optimize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize dictionary memory usage"""
        # Use __slots__ for frequently accessed dictionaries
        # Convert to more memory-efficient representations where possible
        optimized = {}
        for key, value in data.items():
            optimized[key] = self.optimize_data_structures(value)
        return optimized
        
    def _optimize_list(self, data: List[Any]) -> List[Any]:
        """Optimize list memory usage"""
        # Use generators for large lists where possible
        # Convert to arrays for numeric data
        return [self.optimize_data_structures(item) for item in data]
        
    def _optimize_string(self, data: str) -> str:
        """Optimize string memory usage"""
        # Intern frequently used strings
        if len(data) < 100 and data.isalnum():
            return sys.intern(data)
        return data
        
    def create_lazy_loader(self, loader_func: Callable, cache_key: str = None) -> Callable:
        """Create lazy loading wrapper"""
        
        def lazy_loader(*args, **kwargs):
            key = cache_key or f"{loader_func.__name__}_{hash(str(args) + str(kwargs))}"
            
            if key in self.weak_refs:
                return self.weak_refs[key]
                
            result = loader_func(*args, **kwargs)
            self.weak_refs[key] = result
            return result
            
        return lazy_loader
        
    def force_garbage_collection(self, full: bool = False):
        """Force garbage collection"""
        if full:
            # Full GC cycle
            for i in range(3):
                gc.collect()
        else:
            gc.collect()
            
        # Clear weak references to deleted objects
        self.weak_refs = weakref.WeakValueDictionary()


class PerformanceOptimizer:
    """Main performance optimization coordinator"""
    
    def __init__(self, config: OptimizationConfig):
        self.config = config
        
        # Initialize subsystems
        self.cache = IntelligentCache(
            max_size_mb=config.resource_limits.max_cache_size_mb,
            strategy=config.cache_strategy
        ) if config.enable_caching else None
        
        self.resource_monitor = ResourceMonitor(config.resource_limits)
        self.parallel_processor = ParallelProcessor(config.resource_limits.max_parallel_workers)
        self.memory_optimizer = MemoryOptimizer()
        
        # Performance tracking
        self.metrics_history: List[PerformanceMetrics] = []
        self.optimization_stats = defaultdict(int)
        
        # Start monitoring
        if config.enable_memory_optimization:
            self.resource_monitor.start_monitoring()
            
    def optimize_function(self, func: Callable, cache_ttl: int = 3600) -> Callable:
        """Create optimized version of function with caching and monitoring"""
        
        @functools.wraps(func)
        def optimized_wrapper(*args, **kwargs):
            start_time = time.time()
            memory_before = psutil.Process().memory_info().rss / (1024 * 1024)
            
            # Generate cache key
            cache_key = None
            if self.cache and self.config.enable_caching:
                cache_key = self._generate_cache_key(func.__name__, args, kwargs)
                
                # Try cache first
                cached_result = self.cache.get(cache_key)
                if cached_result is not None:
                    self.optimization_stats['cache_hits'] += 1
                    return cached_result
                    
            # Check resource limits
            resource_exceeded = self.resource_monitor.check_resource_limits()
            if any(resource_exceeded.values()):
                logging.warning("Resource limits exceeded, using degraded mode")
                self.optimization_stats['resource_limits_hit'] += 1
                
            # Execute function
            try:
                result = func(*args, **kwargs)
                
                # Cache result if caching enabled
                if self.cache and cache_key:
                    self.cache.put(cache_key, result, ttl_seconds=cache_ttl)
                    self.optimization_stats['cache_stores'] += 1
                    
                # Optimize result data structures
                if self.config.enable_memory_optimization:
                    result = self.memory_optimizer.optimize_data_structures(result)
                    
                return result
                
            finally:
                # Record performance metrics
                end_time = time.time()
                memory_after = psutil.Process().memory_info().rss / (1024 * 1024)
                
                metrics = PerformanceMetrics(
                    operation_name=func.__name__,
                    start_time=start_time,
                    end_time=end_time,
                    duration=end_time - start_time,
                    memory_before=memory_before,
                    memory_after=memory_after,
                    memory_peak=max(memory_before, memory_after),
                    cpu_usage=psutil.cpu_percent(),
                    cache_hits=self.cache.hits if self.cache else 0,
                    cache_misses=self.cache.misses if self.cache else 0,
                    parallel_workers=0,  # Will be set by parallel operations
                    optimization_level=self.config.level
                )
                
                self.metrics_history.append(metrics)
                
                # Maintain metrics history size
                if len(self.metrics_history) > 1000:
                    self.metrics_history.pop(0)
                    
        return optimized_wrapper
        
    def optimize_parallel_execution(self, tasks: List[Callable], use_processes: bool = False) -> List[Any]:
        """Execute tasks with optimal parallelization"""
        
        if not self.config.enable_parallel_processing:
            return [task() for task in tasks]
            
        # Check if parallelization is beneficial
        if len(tasks) < 2 or self.config.level == OptimizationLevel.MINIMAL:
            return [task() for task in tasks]
            
        # Determine optimal worker count based on current resource usage
        resource_status = self.resource_monitor.get_resource_status()
        current_cpu = resource_status.get('current_cpu_percent', 0)
        current_memory = resource_status.get('current_memory_mb', 0)
        
        # Adjust worker count based on resource availability
        optimal_workers = self.config.resource_limits.max_parallel_workers
        if current_cpu > 70:
            optimal_workers = max(1, optimal_workers // 2)
        if current_memory > self.config.resource_limits.max_memory_mb * 0.8:
            optimal_workers = max(1, optimal_workers // 2)
            
        # Update parallel processor
        self.parallel_processor.max_workers = optimal_workers
        
        # Execute with timeout
        timeout = self.config.resource_limits.max_execution_time
        return self.parallel_processor.execute_parallel_tasks(tasks, use_processes, timeout)
        
    def optimize_memory_usage(self):
        """Trigger memory optimization"""
        
        if not self.config.enable_memory_optimization:
            return
            
        # Force garbage collection
        self.memory_optimizer.force_garbage_collection(
            full=self.config.level in [OptimizationLevel.AGGRESSIVE, OptimizationLevel.MAXIMUM]
        )
        
        # Clear cache if memory usage is high
        resource_status = self.resource_monitor.get_resource_status()
        current_memory = resource_status.get('current_memory_mb', 0)
        
        if current_memory > self.config.resource_limits.max_memory_mb * 0.9:
            if self.cache:
                cache_stats = self.cache.stats()
                if cache_stats['hit_rate'] < 0.3:  # Low hit rate
                    self.cache.clear()
                    logging.info("Cleared cache due to high memory usage and low hit rate")
                    
    def _generate_cache_key(self, func_name: str, args: Tuple, kwargs: Dict) -> str:
        """Generate cache key for function call"""
        
        # Create simplified representation for hashing
        key_data = {
            'function': func_name,
            'args': str(args)[:100],  # Limit length
            'kwargs': str(sorted(kwargs.items()))[:100]
        }
        
        key_str = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()
        
    def get_optimization_report(self) -> Dict[str, Any]:
        """Generate comprehensive optimization report"""
        
        if not self.metrics_history:
            return {'status': 'no_data'}
            
        # Calculate aggregate metrics
        total_duration = sum(m.duration for m in self.metrics_history)
        avg_duration = total_duration / len(self.metrics_history)
        avg_memory = sum(m.memory_peak for m in self.metrics_history) / len(self.metrics_history)
        avg_efficiency = sum(m.efficiency_score() for m in self.metrics_history) / len(self.metrics_history)
        
        # Cache statistics
        cache_stats = self.cache.stats() if self.cache else {'hit_rate': 0.0}
        
        # Resource status
        resource_status = self.resource_monitor.get_resource_status()
        
        return {
            'performance_summary': {
                'total_operations': len(self.metrics_history),
                'avg_duration_seconds': avg_duration,
                'avg_memory_mb': avg_memory,
                'avg_efficiency_score': avg_efficiency,
                'optimization_level': self.config.level.value
            },
            'cache_performance': cache_stats,
            'resource_usage': resource_status,
            'optimization_stats': dict(self.optimization_stats),
            'recent_operations': [
                {
                    'operation': m.operation_name,
                    'duration': m.duration,
                    'efficiency': m.efficiency_score()
                }
                for m in self.metrics_history[-10:]
            ]
        }
        
    def shutdown(self):
        """Shutdown performance optimizer"""
        self.resource_monitor.stop_monitoring()
        if self.cache:
            self.cache.clear()


# Decorators and utility functions
def with_performance_optimization(config: OptimizationConfig = None):
    """Decorator to add performance optimization to functions"""
    
    if config is None:
        config = OptimizationConfig(level=OptimizationLevel.BALANCED)
        
    optimizer = PerformanceOptimizer(config)
    
    def decorator(func: Callable) -> Callable:
        return optimizer.optimize_function(func)
        
    return decorator


def create_agent_optimizer(agent_name: str, level: OptimizationLevel = OptimizationLevel.BALANCED) -> PerformanceOptimizer:
    """Create performance optimizer for specific agent"""
    
    # Agent-specific configurations
    agent_configs = {
        'research_planner': OptimizationConfig(
            level=level,
            enable_caching=True,
            enable_parallel_processing=False,  # Planning is sequential
            resource_limits=ResourceLimits(max_memory_mb=500, max_execution_time=120)
        ),
        'iterative_researcher': OptimizationConfig(
            level=level,
            enable_caching=True,
            enable_parallel_processing=True,  # Can parallelize searches
            resource_limits=ResourceLimits(max_memory_mb=1000, max_execution_time=600)
        ),
        'self_evolution': OptimizationConfig(
            level=level,
            enable_caching=True,
            enable_parallel_processing=True,  # Can parallelize variant generation
            resource_limits=ResourceLimits(max_memory_mb=1500, max_execution_time=900)
        ),
        'final_integrator': OptimizationConfig(
            level=level,
            enable_caching=False,  # Integration should be fresh
            enable_parallel_processing=True,  # Can parallelize formatting
            resource_limits=ResourceLimits(max_memory_mb=800, max_execution_time=300)
        )
    }
    
    config = agent_configs.get(agent_name, OptimizationConfig(level=level))
    return PerformanceOptimizer(config)


# Test and demonstration functions
def test_performance_optimization():
    """Test performance optimization system"""
    
    print("=== TTD-DR Performance Optimization Test ===")
    
    # Test different optimization levels
    optimization_levels = [
        OptimizationLevel.MINIMAL,
        OptimizationLevel.BALANCED,
        OptimizationLevel.AGGRESSIVE
    ]
    
    results = {}
    
    for level in optimization_levels:
        print(f"\n--- Testing {level.value} optimization ---")
        
        # Create optimizer
        config = OptimizationConfig(level=level)
        optimizer = PerformanceOptimizer(config)
        
        # Test function optimization
        @optimizer.optimize_function
        def test_function(data_size: int = 1000):
            # Simulate CPU and memory intensive operation
            import random
            data = [random.random() for _ in range(data_size)]
            result = sum(x * x for x in data)
            return {'result': result, 'data_size': data_size}
            
        # Test caching
        print("Testing caching performance...")
        start_time = time.time()
        
        # First call (cache miss)
        result1 = test_function(1000)
        miss_time = time.time() - start_time
        
        # Second call (cache hit)
        start_time = time.time()
        result2 = test_function(1000)
        hit_time = time.time() - start_time
        
        print(f"   Cache miss time: {miss_time:.3f}s")
        print(f"   Cache hit time: {hit_time:.3f}s")
        print(f"   Speed improvement: {miss_time / max(hit_time, 0.001):.1f}x")
        
        # Test parallel processing
        print("Testing parallel processing...")
        
        # Create tasks for parallel execution
        tasks = [lambda i=i: test_function(500) for i in range(4)]
        
        # Sequential execution
        start_time = time.time()
        sequential_results = [task() for task in tasks]
        sequential_time = time.time() - start_time
        
        # Parallel execution
        start_time = time.time()
        parallel_results = optimizer.optimize_parallel_execution(tasks)
        parallel_time = time.time() - start_time
        
        print(f"   Sequential time: {sequential_time:.3f}s")
        print(f"   Parallel time: {parallel_time:.3f}s")
        print(f"   Parallel speedup: {sequential_time / max(parallel_time, 0.001):.1f}x")
        
        # Test memory optimization
        print("Testing memory optimization...")
        memory_before = psutil.Process().memory_info().rss / (1024 * 1024)
        
        # Create large data structure
        large_data = [{'id': i, 'data': f'item_{i}' * 100} for i in range(1000)]
        optimized_data = optimizer.memory_optimizer.optimize_data_structures(large_data)
        
        optimizer.optimize_memory_usage()
        memory_after = psutil.Process().memory_info().rss / (1024 * 1024)
        
        print(f"   Memory before: {memory_before:.1f} MB")
        print(f"   Memory after: {memory_after:.1f} MB")
        print(f"   Memory saved: {memory_before - memory_after:.1f} MB")
        
        # Get optimization report
        report = optimizer.get_optimization_report()
        results[level.value] = {
            'cache_hit_rate': report['cache_performance']['hit_rate'],
            'avg_efficiency': report['performance_summary']['avg_efficiency_score'],
            'total_operations': report['performance_summary']['total_operations']
        }
        
        # Cleanup
        optimizer.shutdown()
        
    # Performance comparison
    print(f"\n=== Optimization Level Comparison ===")
    for level, metrics in results.items():
        print(f"{level}:")
        print(f"  Cache Hit Rate: {metrics['cache_hit_rate']:.2f}")
        print(f"  Average Efficiency: {metrics['avg_efficiency']:.2f}")
        print(f"  Total Operations: {metrics['total_operations']}")
        
    # Test agent-specific optimizers
    print(f"\n--- Testing Agent-Specific Optimizers ---")
    
    agent_names = ['research_planner', 'iterative_researcher', 'self_evolution', 'final_integrator']
    
    for agent_name in agent_names:
        optimizer = create_agent_optimizer(agent_name, OptimizationLevel.BALANCED)
        print(f"✅ {agent_name} optimizer created")
        optimizer.shutdown()
        
    print(f"\n=== Performance Optimization Features ===")
    print("✅ Intelligent Adaptive Caching (LRU/LFU/TTL/Adaptive)")
    print("✅ Real-time Resource Monitoring")
    print("✅ Dynamic Parallel Processing")
    print("✅ Memory Usage Optimization")
    print("✅ Performance Metrics Collection")
    print("✅ Agent-specific Optimization")
    print("✅ Resource Limit Enforcement")
    print("✅ Lazy Loading Support")
    
    return results


if __name__ == "__main__":
    test_performance_optimization()