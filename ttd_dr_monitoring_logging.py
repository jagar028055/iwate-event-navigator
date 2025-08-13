#!/usr/bin/env python3
"""
TTD-DR System Monitoring & Logging Framework
Task 1.5.5 Implementation

Comprehensive monitoring and logging system for the TTD-DR pipeline with
real-time metrics, alerting, structured logging, and performance analytics.
"""

import json
import logging
import time
import threading
import queue
import sqlite3
import os
import psutil
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
import csv
import gzip
from collections import defaultdict, deque
import weakref
import atexit


class LogLevel(Enum):
    """Log levels with priority"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class MetricType(Enum):
    """Types of metrics to monitor"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    TIMER = "timer"


class AlertSeverity(Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class LogEntry:
    """Structured log entry"""
    timestamp: str
    level: LogLevel
    logger_name: str
    message: str
    agent_name: Optional[str]
    execution_id: Optional[str]
    function_name: Optional[str]
    duration_ms: Optional[float]
    memory_mb: Optional[float]
    cpu_percent: Optional[float]
    metadata: Dict[str, Any]
    stack_trace: Optional[str] = None


@dataclass
class MetricEntry:
    """Structured metric entry"""
    timestamp: str
    metric_name: str
    metric_type: MetricType
    value: float
    tags: Dict[str, str]
    agent_name: Optional[str]
    execution_id: Optional[str]


@dataclass
class AlertRule:
    """Alert rule configuration"""
    rule_id: str
    metric_name: str
    condition: str  # "gt", "lt", "eq", "rate_increase", "rate_decrease"
    threshold: float
    severity: AlertSeverity
    window_minutes: int
    cooldown_minutes: int
    enabled: bool = True
    notification_channels: List[str] = None


@dataclass
class Alert:
    """Generated alert"""
    alert_id: str
    rule_id: str
    timestamp: str
    metric_name: str
    current_value: float
    threshold: float
    severity: AlertSeverity
    message: str
    agent_name: Optional[str]
    execution_id: Optional[str]
    resolved: bool = False
    resolved_at: Optional[str] = None


class DatabaseManager:
    """SQLite database manager for metrics and logs"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connection = None
        self.lock = threading.RLock()
        self._initialize_database()
        
    def _initialize_database(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            # Create logs table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    level TEXT NOT NULL,
                    logger_name TEXT NOT NULL,
                    message TEXT NOT NULL,
                    agent_name TEXT,
                    execution_id TEXT,
                    function_name TEXT,
                    duration_ms REAL,
                    memory_mb REAL,
                    cpu_percent REAL,
                    metadata TEXT,
                    stack_trace TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create metrics table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    metric_name TEXT NOT NULL,
                    metric_type TEXT NOT NULL,
                    value REAL NOT NULL,
                    tags TEXT,
                    agent_name TEXT,
                    execution_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create alerts table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_id TEXT UNIQUE NOT NULL,
                    rule_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    metric_name TEXT NOT NULL,
                    current_value REAL NOT NULL,
                    threshold REAL NOT NULL,
                    severity TEXT NOT NULL,
                    message TEXT NOT NULL,
                    agent_name TEXT,
                    execution_id TEXT,
                    resolved BOOLEAN DEFAULT FALSE,
                    resolved_at TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_logs_agent ON logs(agent_name)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)")
            
            conn.commit()
            
    def insert_log(self, log_entry: LogEntry):
        """Insert log entry into database"""
        with self.lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("""
                        INSERT INTO logs (timestamp, level, logger_name, message, agent_name,
                                        execution_id, function_name, duration_ms, memory_mb,
                                        cpu_percent, metadata, stack_trace)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        log_entry.timestamp,
                        log_entry.level.value,
                        log_entry.logger_name,
                        log_entry.message,
                        log_entry.agent_name,
                        log_entry.execution_id,
                        log_entry.function_name,
                        log_entry.duration_ms,
                        log_entry.memory_mb,
                        log_entry.cpu_percent,
                        json.dumps(log_entry.metadata),
                        log_entry.stack_trace
                    ))
                    conn.commit()
            except Exception as e:
                print(f"Failed to insert log entry: {str(e)}")
                
    def insert_metric(self, metric_entry: MetricEntry):
        """Insert metric entry into database"""
        with self.lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("""
                        INSERT INTO metrics (timestamp, metric_name, metric_type, value,
                                           tags, agent_name, execution_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        metric_entry.timestamp,
                        metric_entry.metric_name,
                        metric_entry.metric_type.value,
                        metric_entry.value,
                        json.dumps(metric_entry.tags),
                        metric_entry.agent_name,
                        metric_entry.execution_id
                    ))
                    conn.commit()
            except Exception as e:
                print(f"Failed to insert metric entry: {str(e)}")
                
    def insert_alert(self, alert: Alert):
        """Insert alert into database"""
        with self.lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("""
                        INSERT INTO alerts (alert_id, rule_id, timestamp, metric_name,
                                          current_value, threshold, severity, message,
                                          agent_name, execution_id, resolved, resolved_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        alert.alert_id,
                        alert.rule_id,
                        alert.timestamp,
                        alert.metric_name,
                        alert.current_value,
                        alert.threshold,
                        alert.severity.value,
                        alert.message,
                        alert.agent_name,
                        alert.execution_id,
                        alert.resolved,
                        alert.resolved_at
                    ))
                    conn.commit()
            except Exception as e:
                print(f"Failed to insert alert: {str(e)}")
                
    def query_logs(self, start_time: str, end_time: str, level: LogLevel = None,
                   agent_name: str = None, limit: int = 1000) -> List[Dict[str, Any]]:
        """Query logs from database"""
        with self.lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    query = "SELECT * FROM logs WHERE timestamp BETWEEN ? AND ?"
                    params = [start_time, end_time]
                    
                    if level:
                        query += " AND level = ?"
                        params.append(level.value)
                        
                    if agent_name:
                        query += " AND agent_name = ?"
                        params.append(agent_name)
                        
                    query += " ORDER BY timestamp DESC LIMIT ?"
                    params.append(limit)
                    
                    cursor = conn.execute(query, params)
                    columns = [description[0] for description in cursor.description]
                    
                    return [dict(zip(columns, row)) for row in cursor.fetchall()]
            except Exception as e:
                print(f"Failed to query logs: {str(e)}")
                return []
                
    def query_metrics(self, start_time: str, end_time: str, metric_name: str = None,
                     agent_name: str = None, limit: int = 1000) -> List[Dict[str, Any]]:
        """Query metrics from database"""
        with self.lock:
            try:
                with sqlite3.connect(self.db_path) as conn:
                    query = "SELECT * FROM metrics WHERE timestamp BETWEEN ? AND ?"
                    params = [start_time, end_time]
                    
                    if metric_name:
                        query += " AND metric_name = ?"
                        params.append(metric_name)
                        
                    if agent_name:
                        query += " AND agent_name = ?"
                        params.append(agent_name)
                        
                    query += " ORDER BY timestamp DESC LIMIT ?"
                    params.append(limit)
                    
                    cursor = conn.execute(query, params)
                    columns = [description[0] for description in cursor.description]
                    
                    return [dict(zip(columns, row)) for row in cursor.fetchall()]
            except Exception as e:
                print(f"Failed to query metrics: {str(e)}")
                return []


class StructuredLogger:
    """Advanced structured logging with multiple outputs"""
    
    def __init__(self, name: str, output_dir: str = "./ttd_dr_logs", 
                 enable_database: bool = True, enable_file: bool = True,
                 enable_console: bool = True):
        self.name = name
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize database
        self.db_manager = None
        if enable_database:
            db_path = self.output_dir / "ttd_dr.db"
            self.db_manager = DatabaseManager(str(db_path))
            
        # Initialize file logging
        self.file_handlers = {}
        if enable_file:
            self._setup_file_handlers()
            
        # Initialize console logging
        self.console_handler = None
        if enable_console:
            self._setup_console_handler()
            
        # Logging queue for async processing
        self.log_queue = queue.Queue()
        self.log_thread = threading.Thread(target=self._log_processor, daemon=True)
        self.log_thread.start()
        
        # Context storage for thread-local data
        self.context = threading.local()
        
    def _setup_file_handlers(self):
        """Setup rotating file handlers for different log levels"""
        
        for level in LogLevel:
            log_file = self.output_dir / f"{self.name}_{level.value.lower()}.log"
            
            # Setup Python logger for this level
            logger = logging.getLogger(f"{self.name}_{level.value}")
            logger.setLevel(getattr(logging, level.value))
            
            # Rotating file handler
            handler = logging.handlers.RotatingFileHandler(
                log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8'
            )
            
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
            self.file_handlers[level] = logger
            
    def _setup_console_handler(self):
        """Setup console handler for important messages"""
        
        logger = logging.getLogger(f"{self.name}_console")
        logger.setLevel(logging.INFO)
        
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        self.console_handler = logger
        
    def _log_processor(self):
        """Background thread to process log entries"""
        
        while True:
            try:
                log_entry = self.log_queue.get(timeout=1.0)
                
                # Write to database
                if self.db_manager:
                    self.db_manager.insert_log(log_entry)
                    
                # Write to file
                if log_entry.level in self.file_handlers:
                    logger = self.file_handlers[log_entry.level]
                    logger.log(
                        getattr(logging, log_entry.level.value),
                        f"[{log_entry.agent_name or 'system'}] {log_entry.message}"
                    )
                    
                # Write to console for important messages
                if self.console_handler and log_entry.level.value in ['WARNING', 'ERROR', 'CRITICAL']:
                    self.console_handler.log(
                        getattr(logging, log_entry.level.value),
                        f"[{log_entry.agent_name or 'system'}] {log_entry.message}"
                    )
                    
                self.log_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Log processor error: {str(e)}")
                
    def set_context(self, **kwargs):
        """Set logging context for current thread"""
        for key, value in kwargs.items():
            setattr(self.context, key, value)
            
    def clear_context(self):
        """Clear logging context for current thread"""
        for attr in list(self.context.__dict__.keys()):
            delattr(self.context, attr)
            
    def log(self, level: LogLevel, message: str, **kwargs):
        """Log message with structured data"""
        
        # Get context data
        agent_name = getattr(self.context, 'agent_name', None)
        execution_id = getattr(self.context, 'execution_id', None)
        function_name = getattr(self.context, 'function_name', None)
        
        # Create log entry
        log_entry = LogEntry(
            timestamp=datetime.now().isoformat(),
            level=level,
            logger_name=self.name,
            message=message,
            agent_name=agent_name,
            execution_id=execution_id,
            function_name=function_name,
            duration_ms=kwargs.get('duration_ms'),
            memory_mb=kwargs.get('memory_mb'),
            cpu_percent=kwargs.get('cpu_percent'),
            metadata=kwargs,
            stack_trace=kwargs.get('stack_trace')
        )
        
        # Queue for async processing
        self.log_queue.put(log_entry)
        
    def debug(self, message: str, **kwargs):
        """Log debug message"""
        self.log(LogLevel.DEBUG, message, **kwargs)
        
    def info(self, message: str, **kwargs):
        """Log info message"""
        self.log(LogLevel.INFO, message, **kwargs)
        
    def warning(self, message: str, **kwargs):
        """Log warning message"""
        self.log(LogLevel.WARNING, message, **kwargs)
        
    def error(self, message: str, **kwargs):
        """Log error message"""
        self.log(LogLevel.ERROR, message, **kwargs)
        
    def critical(self, message: str, **kwargs):
        """Log critical message"""
        self.log(LogLevel.CRITICAL, message, **kwargs)


class MetricsCollector:
    """High-performance metrics collection and aggregation"""
    
    def __init__(self, output_dir: str = "./ttd_dr_logs", buffer_size: int = 1000):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize database
        db_path = self.output_dir / "ttd_dr.db"
        self.db_manager = DatabaseManager(str(db_path))
        
        # Metrics buffer
        self.metrics_buffer = deque(maxlen=buffer_size)
        self.buffer_lock = threading.RLock()
        
        # Metrics aggregation
        self.counters: Dict[str, float] = defaultdict(float)
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, List[float]] = defaultdict(list)
        self.timers: Dict[str, List[float]] = defaultdict(list)
        
        # Background processing
        self.processing_active = True
        self.processing_thread = threading.Thread(target=self._metrics_processor, daemon=True)
        self.processing_thread.start()
        
        # System metrics collection
        self.system_metrics_thread = threading.Thread(target=self._system_metrics_collector, daemon=True)
        self.system_metrics_thread.start()
        
    def _metrics_processor(self):
        """Background metrics processing"""
        
        while self.processing_active:
            try:
                # Process buffered metrics
                with self.buffer_lock:
                    if self.metrics_buffer:
                        # Batch process metrics
                        batch = list(self.metrics_buffer)
                        self.metrics_buffer.clear()
                        
                        for metric in batch:
                            self.db_manager.insert_metric(metric)
                            
                time.sleep(5.0)  # Process every 5 seconds
                
            except Exception as e:
                print(f"Metrics processor error: {str(e)}")
                time.sleep(1.0)
                
    def _system_metrics_collector(self):
        """Collect system-level metrics"""
        
        while self.processing_active:
            try:
                # Collect system metrics
                memory_mb = psutil.Process().memory_info().rss / (1024 * 1024)
                cpu_percent = psutil.cpu_percent(interval=1.0)
                disk_usage = psutil.disk_usage('/').percent
                
                timestamp = datetime.now().isoformat()
                
                # Record metrics
                self._record_metric("system.memory_mb", MetricType.GAUGE, memory_mb, timestamp=timestamp)
                self._record_metric("system.cpu_percent", MetricType.GAUGE, cpu_percent, timestamp=timestamp)
                self._record_metric("system.disk_usage_percent", MetricType.GAUGE, disk_usage, timestamp=timestamp)
                
                time.sleep(60.0)  # Collect every minute
                
            except Exception as e:
                print(f"System metrics collector error: {str(e)}")
                time.sleep(60.0)
                
    def _record_metric(self, name: str, metric_type: MetricType, value: float, 
                      tags: Dict[str, str] = None, agent_name: str = None,
                      execution_id: str = None, timestamp: str = None):
        """Record metric entry"""
        
        metric_entry = MetricEntry(
            timestamp=timestamp or datetime.now().isoformat(),
            metric_name=name,
            metric_type=metric_type,
            value=value,
            tags=tags or {},
            agent_name=agent_name,
            execution_id=execution_id
        )
        
        # Add to buffer
        with self.buffer_lock:
            self.metrics_buffer.append(metric_entry)
            
    def increment(self, name: str, value: float = 1.0, tags: Dict[str, str] = None,
                  agent_name: str = None, execution_id: str = None):
        """Increment counter metric"""
        
        self.counters[name] += value
        self._record_metric(name, MetricType.COUNTER, value, tags, agent_name, execution_id)
        
    def gauge(self, name: str, value: float, tags: Dict[str, str] = None,
              agent_name: str = None, execution_id: str = None):
        """Set gauge metric"""
        
        self.gauges[name] = value
        self._record_metric(name, MetricType.GAUGE, value, tags, agent_name, execution_id)
        
    def histogram(self, name: str, value: float, tags: Dict[str, str] = None,
                  agent_name: str = None, execution_id: str = None):
        """Record histogram value"""
        
        self.histograms[name].append(value)
        self._record_metric(name, MetricType.HISTOGRAM, value, tags, agent_name, execution_id)
        
    def timer(self, name: str, value: float, tags: Dict[str, str] = None,
              agent_name: str = None, execution_id: str = None):
        """Record timer value"""
        
        self.timers[name].append(value)
        self._record_metric(name, MetricType.TIMER, value, tags, agent_name, execution_id)
        
    def get_current_values(self) -> Dict[str, Any]:
        """Get current metric values"""
        
        result = {
            'counters': dict(self.counters),
            'gauges': dict(self.gauges),
            'histograms': {},
            'timers': {}
        }
        
        # Calculate histogram statistics
        for name, values in self.histograms.items():
            if values:
                result['histograms'][name] = {
                    'count': len(values),
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'p95': self._percentile(values, 0.95),
                    'p99': self._percentile(values, 0.99)
                }
                
        # Calculate timer statistics
        for name, values in self.timers.items():
            if values:
                result['timers'][name] = {
                    'count': len(values),
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'p95': self._percentile(values, 0.95),
                    'p99': self._percentile(values, 0.99)
                }
                
        return result
        
    def _percentile(self, values: List[float], percentile: float) -> float:
        """Calculate percentile value"""
        if not values:
            return 0.0
            
        sorted_values = sorted(values)
        index = int(len(sorted_values) * percentile)
        return sorted_values[min(index, len(sorted_values) - 1)]
        
    def shutdown(self):
        """Shutdown metrics collector"""
        self.processing_active = False
        if self.processing_thread:
            self.processing_thread.join(timeout=5.0)


class AlertManager:
    """Intelligent alerting system with rules and notifications"""
    
    def __init__(self, output_dir: str = "./ttd_dr_logs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize database
        db_path = self.output_dir / "ttd_dr.db"
        self.db_manager = DatabaseManager(str(db_path))
        
        # Alert rules
        self.alert_rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, Alert] = {}
        
        # Cooldown tracking
        self.rule_cooldowns: Dict[str, datetime] = {}
        
        # Notification channels
        self.notification_channels = {
            'console': self._console_notification,
            'file': self._file_notification,
            'email': self._email_notification  # Placeholder
        }
        
        # Load default rules
        self._load_default_rules()
        
    def _load_default_rules(self):
        """Load default alert rules"""
        
        default_rules = [
            AlertRule(
                rule_id="high_memory_usage",
                metric_name="system.memory_mb",
                condition="gt",
                threshold=1500.0,
                severity=AlertSeverity.HIGH,
                window_minutes=5,
                cooldown_minutes=15,
                notification_channels=["console", "file"]
            ),
            AlertRule(
                rule_id="high_cpu_usage",
                metric_name="system.cpu_percent",
                condition="gt",
                threshold=90.0,
                severity=AlertSeverity.MEDIUM,
                window_minutes=3,
                cooldown_minutes=10,
                notification_channels=["console", "file"]
            ),
            AlertRule(
                rule_id="agent_execution_timeout",
                metric_name="agent.execution_time",
                condition="gt",
                threshold=600.0,  # 10 minutes
                severity=AlertSeverity.HIGH,
                window_minutes=1,
                cooldown_minutes=5,
                notification_channels=["console", "file"]
            ),
            AlertRule(
                rule_id="low_cache_hit_rate",
                metric_name="cache.hit_rate",
                condition="lt",
                threshold=0.3,
                severity=AlertSeverity.MEDIUM,
                window_minutes=10,
                cooldown_minutes=30,
                notification_channels=["console"]
            )
        ]
        
        for rule in default_rules:
            self.alert_rules[rule.rule_id] = rule
            
    def add_alert_rule(self, rule: AlertRule):
        """Add new alert rule"""
        self.alert_rules[rule.rule_id] = rule
        
    def remove_alert_rule(self, rule_id: str):
        """Remove alert rule"""
        self.alert_rules.pop(rule_id, None)
        
    def check_metric(self, metric_name: str, value: float, agent_name: str = None,
                    execution_id: str = None):
        """Check metric against alert rules"""
        
        for rule_id, rule in self.alert_rules.items():
            if rule.metric_name == metric_name and rule.enabled:
                self._evaluate_rule(rule, value, agent_name, execution_id)
                
    def _evaluate_rule(self, rule: AlertRule, value: float, agent_name: str = None,
                      execution_id: str = None):
        """Evaluate alert rule against metric value"""
        
        # Check cooldown
        if rule.rule_id in self.rule_cooldowns:
            cooldown_end = self.rule_cooldowns[rule.rule_id] + timedelta(minutes=rule.cooldown_minutes)
            if datetime.now() < cooldown_end:
                return
                
        # Evaluate condition
        triggered = False
        if rule.condition == "gt" and value > rule.threshold:
            triggered = True
        elif rule.condition == "lt" and value < rule.threshold:
            triggered = True
        elif rule.condition == "eq" and value == rule.threshold:
            triggered = True
            
        if triggered:
            self._trigger_alert(rule, value, agent_name, execution_id)
            
    def _trigger_alert(self, rule: AlertRule, current_value: float, agent_name: str = None,
                      execution_id: str = None):
        """Trigger alert for rule violation"""
        
        alert_id = f"{rule.rule_id}_{int(time.time())}"
        
        alert = Alert(
            alert_id=alert_id,
            rule_id=rule.rule_id,
            timestamp=datetime.now().isoformat(),
            metric_name=rule.metric_name,
            current_value=current_value,
            threshold=rule.threshold,
            severity=rule.severity,
            message=f"Alert: {rule.metric_name} = {current_value} (threshold: {rule.threshold})",
            agent_name=agent_name,
            execution_id=execution_id
        )
        
        # Store alert
        self.active_alerts[alert_id] = alert
        self.db_manager.insert_alert(alert)
        
        # Set cooldown
        self.rule_cooldowns[rule.rule_id] = datetime.now()
        
        # Send notifications
        if rule.notification_channels:
            for channel in rule.notification_channels:
                if channel in self.notification_channels:
                    self.notification_channels[channel](alert)
                    
    def _console_notification(self, alert: Alert):
        """Send alert to console"""
        severity_color = {
            AlertSeverity.LOW: "\033[92m",      # Green
            AlertSeverity.MEDIUM: "\033[93m",   # Yellow
            AlertSeverity.HIGH: "\033[91m",     # Red
            AlertSeverity.CRITICAL: "\033[95m"  # Magenta
        }
        
        color = severity_color.get(alert.severity, "")
        reset = "\033[0m"
        
        print(f"{color}[ALERT {alert.severity.value.upper()}]{reset} {alert.message}")
        
    def _file_notification(self, alert: Alert):
        """Send alert to file"""
        alerts_file = self.output_dir / "alerts.log"
        
        with open(alerts_file, 'a', encoding='utf-8') as f:
            f.write(f"{alert.timestamp} - {alert.severity.value.upper()} - {alert.message}\n")
            
    def _email_notification(self, alert: Alert):
        """Send alert via email (placeholder)"""
        # TODO: Implement email notification
        pass
        
    def resolve_alert(self, alert_id: str):
        """Resolve active alert"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolved = True
            alert.resolved_at = datetime.now().isoformat()
            
            # Update database
            self.db_manager.insert_alert(alert)
            
            # Remove from active alerts
            del self.active_alerts[alert_id]
            
    def get_active_alerts(self) -> List[Alert]:
        """Get list of active alerts"""
        return list(self.active_alerts.values())


class MonitoringDashboard:
    """Simple text-based monitoring dashboard"""
    
    def __init__(self, logger: StructuredLogger, metrics: MetricsCollector,
                 alerts: AlertManager):
        self.logger = logger
        self.metrics = metrics
        self.alerts = alerts
        
    def generate_status_report(self) -> str:
        """Generate comprehensive status report"""
        
        lines = [
            "=" * 60,
            "TTD-DR System Monitoring Report",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "=" * 60
        ]
        
        # System metrics
        try:
            memory_mb = psutil.Process().memory_info().rss / (1024 * 1024)
            cpu_percent = psutil.cpu_percent()
            
            lines.extend([
                "",
                "System Status:",
                f"  Memory Usage: {memory_mb:.1f} MB",
                f"  CPU Usage: {cpu_percent:.1f}%"
            ])
        except Exception as e:
            lines.append(f"  System metrics unavailable: {str(e)}")
            
        # Metrics summary
        current_metrics = self.metrics.get_current_values()
        
        lines.extend([
            "",
            "Metrics Summary:",
            f"  Counters: {len(current_metrics['counters'])}",
            f"  Gauges: {len(current_metrics['gauges'])}",
            f"  Histograms: {len(current_metrics['histograms'])}",
            f"  Timers: {len(current_metrics['timers'])}"
        ])
        
        # Recent timers
        if current_metrics['timers']:
            lines.append("")
            lines.append("Recent Performance (avg ms):")
            for name, stats in list(current_metrics['timers'].items())[:5]:
                lines.append(f"  {name}: {stats['avg']:.1f}ms (count: {stats['count']})")
                
        # Active alerts
        active_alerts = self.alerts.get_active_alerts()
        
        lines.extend([
            "",
            f"Active Alerts: {len(active_alerts)}"
        ])
        
        for alert in active_alerts[:5]:  # Show first 5
            lines.append(f"  [{alert.severity.value.upper()}] {alert.message}")
            
        lines.append("=" * 60)
        
        return "\n".join(lines)
        
    def print_status_report(self):
        """Print status report to console"""
        print(self.generate_status_report())


class TTDDRMonitoringSystem:
    """Main monitoring system coordinator"""
    
    def __init__(self, output_dir: str = "./ttd_dr_logs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize components
        self.logger = StructuredLogger("ttd_dr_system", str(self.output_dir))
        self.metrics = MetricsCollector(str(self.output_dir))
        self.alerts = AlertManager(str(self.output_dir))
        self.dashboard = MonitoringDashboard(self.logger, self.metrics, self.alerts)
        
        # Register shutdown handler
        atexit.register(self.shutdown)
        
        self.logger.info("TTD-DR monitoring system initialized")
        
    def set_context(self, agent_name: str = None, execution_id: str = None,
                   function_name: str = None):
        """Set monitoring context"""
        self.logger.set_context(
            agent_name=agent_name,
            execution_id=execution_id,
            function_name=function_name
        )
        
    def clear_context(self):
        """Clear monitoring context"""
        self.logger.clear_context()
        
    def log_agent_start(self, agent_name: str, execution_id: str):
        """Log agent execution start"""
        self.set_context(agent_name=agent_name, execution_id=execution_id)
        self.logger.info(f"Agent {agent_name} execution started", 
                        execution_id=execution_id)
        self.metrics.increment("agent.starts", tags={"agent": agent_name},
                             agent_name=agent_name, execution_id=execution_id)
        
    def log_agent_end(self, agent_name: str, execution_id: str, duration: float,
                     success: bool = True):
        """Log agent execution end"""
        self.logger.info(f"Agent {agent_name} execution completed", 
                        duration_ms=duration * 1000, success=success,
                        execution_id=execution_id)
        
        self.metrics.timer("agent.execution_time", duration,
                          tags={"agent": agent_name, "success": str(success)},
                          agent_name=agent_name, execution_id=execution_id)
        
        if success:
            self.metrics.increment("agent.successes", tags={"agent": agent_name},
                                 agent_name=agent_name, execution_id=execution_id)
        else:
            self.metrics.increment("agent.failures", tags={"agent": agent_name},
                                 agent_name=agent_name, execution_id=execution_id)
            
        # Check for alerts
        self.alerts.check_metric("agent.execution_time", duration, agent_name, execution_id)
        
    def log_performance_metrics(self, operation: str, duration: float, memory_mb: float,
                              agent_name: str = None, execution_id: str = None):
        """Log performance metrics"""
        self.metrics.timer(f"performance.{operation}_duration", duration,
                          agent_name=agent_name, execution_id=execution_id)
        self.metrics.gauge(f"performance.{operation}_memory", memory_mb,
                          agent_name=agent_name, execution_id=execution_id)
        
    def log_cache_metrics(self, hit_rate: float, size_mb: float, agent_name: str = None,
                         execution_id: str = None):
        """Log cache performance metrics"""
        self.metrics.gauge("cache.hit_rate", hit_rate,
                          agent_name=agent_name, execution_id=execution_id)
        self.metrics.gauge("cache.size_mb", size_mb,
                          agent_name=agent_name, execution_id=execution_id)
        
        # Check for low hit rate alert
        self.alerts.check_metric("cache.hit_rate", hit_rate, agent_name, execution_id)
        
    def log_error(self, error_message: str, agent_name: str = None, execution_id: str = None,
                 stack_trace: str = None):
        """Log error with context"""
        self.logger.error(error_message, stack_trace=stack_trace)
        self.metrics.increment("errors.total", tags={"agent": agent_name or "system"},
                             agent_name=agent_name, execution_id=execution_id)
        
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        return {
            'timestamp': datetime.now().isoformat(),
            'metrics': self.metrics.get_current_values(),
            'active_alerts': [asdict(alert) for alert in self.alerts.get_active_alerts()],
            'system_info': {
                'memory_mb': psutil.Process().memory_info().rss / (1024 * 1024),
                'cpu_percent': psutil.cpu_percent()
            }
        }
        
    def generate_report(self) -> str:
        """Generate monitoring report"""
        return self.dashboard.generate_status_report()
        
    def print_dashboard(self):
        """Print monitoring dashboard"""
        self.dashboard.print_status_report()
        
    def shutdown(self):
        """Shutdown monitoring system"""
        self.logger.info("Shutting down TTD-DR monitoring system")
        self.metrics.shutdown()


# Decorators and utility functions
def with_monitoring(monitoring_system: TTDDRMonitoringSystem):
    """Decorator to add monitoring to agent functions"""
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            agent_name = kwargs.get('agent_name', 'unknown')
            execution_id = kwargs.get('execution_id', f"exec_{int(time.time())}")
            
            # Set context
            monitoring_system.set_context(
                agent_name=agent_name,
                execution_id=execution_id,
                function_name=func.__name__
            )
            
            # Record start
            start_time = time.time()
            memory_start = psutil.Process().memory_info().rss / (1024 * 1024)
            
            monitoring_system.log_agent_start(agent_name, execution_id)
            
            try:
                # Execute function
                result = func(*args, **kwargs)
                
                # Record success
                duration = time.time() - start_time
                memory_end = psutil.Process().memory_info().rss / (1024 * 1024)
                
                monitoring_system.log_agent_end(agent_name, execution_id, duration, success=True)
                monitoring_system.log_performance_metrics(
                    func.__name__, duration, max(memory_start, memory_end),
                    agent_name, execution_id
                )
                
                return result
                
            except Exception as e:
                # Record failure
                duration = time.time() - start_time
                monitoring_system.log_agent_end(agent_name, execution_id, duration, success=False)
                monitoring_system.log_error(str(e), agent_name, execution_id)
                
                raise
                
            finally:
                # Clear context
                monitoring_system.clear_context()
                
        return wrapper
    return decorator


# Test and demonstration functions
def test_monitoring_system():
    """Test the monitoring and logging system"""
    
    print("=== TTD-DR Monitoring & Logging System Test ===")
    
    # Initialize monitoring system
    monitoring = TTDDRMonitoringSystem("./test_ttd_dr_logs")
    
    # Test structured logging
    print("\n--- Testing Structured Logging ---")
    
    monitoring.set_context(agent_name="test_agent", execution_id="test_001")
    
    monitoring.logger.info("System initialization complete")
    monitoring.logger.warning("High memory usage detected", memory_mb=800.0)
    monitoring.logger.error("Network connection failed", error_code=404)
    monitoring.logger.debug("Processing batch 1/10", batch_size=100)
    
    # Test metrics collection
    print("--- Testing Metrics Collection ---")
    
    # Record various metrics
    monitoring.metrics.increment("requests.total", 1.0, tags={"method": "POST"})
    monitoring.metrics.gauge("memory.usage_mb", 512.0, tags={"component": "cache"})
    monitoring.metrics.timer("request.duration", 0.150, tags={"endpoint": "/api/search"})
    monitoring.metrics.histogram("response.size_bytes", 1024.0)
    
    # Record performance metrics
    monitoring.log_performance_metrics("query_processing", 2.5, 256.0, "test_agent", "test_001")
    monitoring.log_cache_metrics(0.85, 128.0, "test_agent", "test_001")
    
    # Test alerting
    print("--- Testing Alert System ---")
    
    # Trigger some alerts
    monitoring.alerts.check_metric("system.memory_mb", 1600.0)  # Should trigger high memory alert
    monitoring.alerts.check_metric("system.cpu_percent", 95.0)  # Should trigger high CPU alert
    monitoring.alerts.check_metric("cache.hit_rate", 0.2)       # Should trigger low cache hit rate alert
    
    # Test agent monitoring
    print("--- Testing Agent Monitoring ---")
    
    @with_monitoring(monitoring)
    def test_agent_function(agent_name: str = "test_agent", execution_id: str = None):
        """Test agent function with monitoring"""
        time.sleep(0.1)  # Simulate work
        return {"status": "success", "processed": 100}
        
    # Test successful execution
    result1 = test_agent_function(agent_name="test_agent", execution_id="test_002")
    print(f"✅ Successful execution: {result1}")
    
    # Test failed execution
    @with_monitoring(monitoring)
    def failing_agent_function(agent_name: str = "failing_agent", execution_id: str = None):
        """Test failing agent function"""
        raise ValueError("Simulated agent failure")
        
    try:
        failing_agent_function(agent_name="failing_agent", execution_id="test_003")
    except ValueError:
        print("✅ Failed execution properly logged")
        
    # Allow some time for async processing
    time.sleep(2.0)
    
    # Generate and print dashboard
    print("\n--- Monitoring Dashboard ---")
    monitoring.print_dashboard()
    
    # Test querying capabilities
    print("\n--- Testing Query Capabilities ---")
    
    end_time = datetime.now().isoformat()
    start_time = (datetime.now() - timedelta(hours=1)).isoformat()
    
    # Query logs
    logs = monitoring.logger.db_manager.query_logs(start_time, end_time, limit=5)
    print(f"Recent logs: {len(logs)}")
    
    # Query metrics  
    metrics = monitoring.metrics.db_manager.query_metrics(start_time, end_time, limit=5)
    print(f"Recent metrics: {len(metrics)}")
    
    # Get system status
    status = monitoring.get_system_status()
    print(f"System status keys: {list(status.keys())}")
    
    # Show active alerts
    active_alerts = monitoring.alerts.get_active_alerts()
    print(f"Active alerts: {len(active_alerts)}")
    for alert in active_alerts:
        print(f"  - {alert.severity.value}: {alert.message}")
        
    print("\n=== Monitoring & Logging Features ===")
    print("✅ Structured Multi-Level Logging")
    print("✅ High-Performance Metrics Collection")
    print("✅ Real-time Alert Management")
    print("✅ SQLite Database Storage")
    print("✅ Performance Monitoring")
    print("✅ Agent Execution Tracking")
    print("✅ System Resource Monitoring")
    print("✅ Text-Based Dashboard")
    print("✅ Decorator-Based Integration")
    print("✅ Context-Aware Logging")
    
    # Cleanup
    monitoring.shutdown()
    
    return monitoring


if __name__ == "__main__":
    test_monitoring_system()