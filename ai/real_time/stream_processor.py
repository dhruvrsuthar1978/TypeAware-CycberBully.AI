"""
stream_processor.py
Real-time stream processing for TypeAware
Handles incoming messages and processes them through the AI pipeline
"""

import asyncio
import time
import threading
from typing import Dict, List, Callable, Optional, Any
from dataclasses import dataclass, field
from collections import deque
from enum import Enum
import logging
import json
from queue import PriorityQueue, Queue, Empty
from concurrent.futures import ThreadPoolExecutor
import uuid

logger = logging.getLogger(__name__)

class MessagePriority(Enum):
    """Message processing priorities"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4

class ProcessingStatus(Enum):
    """Status of message processing"""
    PENDING = "pending"
    PROCESSING = "processing" 
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"

@dataclass
class StreamMessage:
    """Message in the processing stream"""
    id: str
    content: str
    user_id: str
    platform: str
    timestamp: float
    context: Dict[str, Any] = field(default_factory=dict)
    priority: MessagePriority = MessagePriority.NORMAL
    status: ProcessingStatus = ProcessingStatus.PENDING
    processing_start_time: Optional[float] = None
    processing_end_time: Optional[float] = None
    results: Optional[Dict[str, Any]] = None
    retry_count: int = 0

@dataclass
class ProcessingResult:
    """Result of message processing"""
    message_id: str
    is_abusive: bool
    risk_score: float
    suggestions: List[str]
    should_block: bool
    processing_time_ms: float
    components_used: List[str]
    alerts_generated: List[Dict[str, Any]]

class StreamProcessor:
    """
    Real-time stream processor for handling incoming messages
    Manages queues, priorities, and coordinates AI components
    """
    
    def __init__(self, max_queue_size: int = 10000):
        self.max_queue_size = max_queue_size
        self.is_running = False
        self.processing_threads = []
        self.thread_pool = None
        
        # Queues for different priorities
        self.priority_queues = {
            MessagePriority.CRITICAL: PriorityQueue(maxsize=1000),
            MessagePriority.HIGH: PriorityQueue(maxsize=2000),
            MessagePriority.NORMAL: PriorityQueue(maxsize=5000),
            MessagePriority.LOW: PriorityQueue(maxsize=2000)
        }
        
        # Processing statistics
        self.stats = {
            'messages_processed': 0,
            'messages_blocked': 0,
            'average_processing_time': 0.0,
            'queue_sizes': {},
            'errors': 0,
            'throughput_per_minute': 0.0
        }
        
        # Message history for analysis
        self.processed_messages = deque(maxlen=1000)
        self.blocked_messages = deque(maxlen=500)
        
        # Callbacks for different events
        self.callbacks = {
            'on_message_processed': [],
            'on_message_blocked': [],
            'on_high_risk_detected': [],
            'on_processing_error': []
        }
        
        # Rate limiting
        self.rate_limits = {}  # user_id -> (count, window_start)
        self.rate_limit_window = 60  # seconds
        self.rate_limit_max = 50  # messages per window
        
        # AI Components (to be injected)
        self.content_detector = None
        self.sentiment_analyzer = None
        self.pattern_analyzer = None
        self.context_analyzer = None
        self.rephrasing_engine = None
        
        # Processing configuration
        self.config = {
            'blocking_threshold': 0.7,
            'high_risk_threshold': 0.8,
            'enable_preprocessing': True,
            'enable_suggestions': True,
            'max_retry_attempts': 3,
            'processing_timeout': 5.0  # seconds
        }
        
        logger.info("StreamProcessor initialized")

    def set_ai_components(self, content_detector=None, sentiment_analyzer=None,
                         pattern_analyzer=None, context_analyzer=None, 
                         rephrasing_engine=None):
        """Set AI component instances"""
        self.content_detector = content_detector
        self.sentiment_analyzer = sentiment_analyzer
        self.pattern_analyzer = pattern_analyzer
        self.context_analyzer = context_analyzer
        self.rephrasing_engine = rephrasing_engine
        logger.info("AI components set for stream processor")

    def start_processing(self, num_workers: int = 4):
        """Start the stream processing with specified number of worker threads"""
        if self.is_running:
            logger.warning("Stream processor is already running")
            return
        
        self.is_running = True
        self.thread_pool = ThreadPoolExecutor(max_workers=num_workers)
        
        # Start worker threads for each priority level
        for priority in MessagePriority:
            worker_thread = threading.Thread(
                target=self._priority_worker,
                args=(priority,),
                daemon=True,
                name=f"StreamWorker-{priority.name}"
            )
            worker_thread.start()
            self.processing_threads.append(worker_thread)
        
        # Start statistics updater thread
        stats_thread = threading.Thread(
            target=self._update_statistics,
            daemon=True,
            name="StatsUpdater"
        )
        stats_thread.start()
        self.processing_threads.append(stats_thread)
        
        logger.info(f"Stream processor started with {num_workers} workers")

    def stop_processing(self):
        """Stop the stream processing"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Wait for threads to finish current processing
        for thread in self.processing_threads:
            if thread.is_alive():
                thread.join(timeout=5.0)
        
        if self.thread_pool:
            self.thread_pool.shutdown(wait=True)
        
        logger.info("Stream processor stopped")

    def add_message(self, content: str, user_id: str, platform: str, 
                   context: Dict[str, Any] = None) -> str:
        """
        Add a message to the processing queue
        
        Returns:
            Message ID for tracking
        """
        if not self.is_running:
            raise RuntimeError("Stream processor is not running")
        
        # Generate unique message ID
        message_id = str(uuid.uuid4())
        
        # Check rate limiting
        if self._is_rate_limited(user_id):
            logger.warning(f"Rate limit exceeded for user {user_id}")
            return message_id
        
        # Determine priority based on initial analysis
        priority = self._determine_priority(content, user_id, context or {})
        
        # Create stream message
        message = StreamMessage(
            id=message_id,
            content=content,
            user_id=user_id,
            platform=platform,
            timestamp=time.time(),
            context=context or {},
            priority=priority
        )
        
        # Add to appropriate queue
        try:
            # Use negative timestamp for priority queue ordering (most recent first)
            self.priority_queues[priority].put((-message.timestamp, message), timeout=1.0)
            logger.debug(f"Message {message_id} queued with priority {priority.name}")
        except Exception as e:
            logger.error(f"Failed to queue message {message_id}: {e}")
            raise
        
        return message_id

    def _determine_priority(self, content: str, user_id: str, context: Dict[str, Any]) -> MessagePriority:
        """Determine processing priority for a message"""
        # Check for immediate threat indicators
        threat_keywords = ['kill', 'murder', 'hurt', 'harm', 'attack', 'violence', 'weapon']
        if any(keyword in content.lower() for keyword in threat_keywords):
            return MessagePriority.CRITICAL
        
        # Check for high-risk user
        if context.get('user_risk_score', 0) > 0.8:
            return MessagePriority.HIGH
        
        # Check for harassment patterns
        harassment_keywords = ['hate', 'stupid', 'idiot', 'kill yourself']
        if any(keyword in content.lower() for keyword in harassment_keywords):
            return MessagePriority.HIGH
        
        # Check message length and complexity
        if len(content) > 500 or content.count('!') > 5:
            return MessagePriority.HIGH
        
        return MessagePriority.NORMAL

    def _is_rate_limited(self, user_id: str) -> bool:
        """Check if user is rate limited"""
        current_time = time.time()
        
        if user_id not in self.rate_limits:
            self.rate_limits[user_id] = (1, current_time)
            return False
        
        count, window_start = self.rate_limits[user_id]
        
        # Check if we're in a new window
        if current_time - window_start > self.rate_limit_window:
            self.rate_limits[user_id] = (1, current_time)
            return False
        
        # Check if limit exceeded
        if count >= self.rate_limit_max:
            return True
        
        # Increment count
        self.rate_limits[user_id] = (count + 1, window_start)
        return False

    def _priority_worker(self, priority: MessagePriority):
        """Worker thread for processing messages of specific priority"""
        logger.info(f"Started {priority.name} priority worker")
        
        while self.is_running:
            try:
                # Get message from queue with timeout
                try:
                    _, message = self.priority_queues[priority].get(timeout=1.0)
                except Empty:
                    continue
                
                # Process the message
                result = self._process_message(message)
                
                # Handle the result
                self._handle_processing_result(message, result)
                
                # Mark queue task as done
                self.priority_queues[priority].task_done()
                
            except Exception as e:
                logger.error(f"Error in {priority.name} worker: {e}")
                self.stats['errors'] += 1
        
        logger.info(f"Stopped {priority.name} priority worker")

    def _process_message(self, message: StreamMessage) -> ProcessingResult:
        """Process a single message through the AI pipeline"""
        start_time = time.time()
        message.processing_start_time = start_time
        message.status = ProcessingStatus.PROCESSING
        
        components_used = []
        alerts = []
        suggestions = []
        
        try:
            # Step 1: Content Detection
            content_result = None
            if self.content_detector:
                content_result = self.content_detector.detect_abusive_content(
                    message.content, message.context
                )
                components_used.append('content_detector')
            
            # Step 2: Sentiment Analysis
            sentiment_result = None
            if self.sentiment_analyzer:
                sentiment_result = self.sentiment_analyzer.analyze_sentiment(
                    message.content, message.context
                )
                components_used.append('sentiment_analyzer')
            
            # Step 3: Pattern Analysis
            pattern_results = []
            if self.pattern_analyzer:
                pattern_results = self.pattern_analyzer.analyze_message_patterns(
                    message.content, message.context
                )
                components_used.append('pattern_analyzer')
            
            # Step 4: Context Analysis
            context_result = None
            if self.context_analyzer:
                context_result = self.context_analyzer.analyze_context(
                    message.content, message.context
                )
                components_used.append('context_analyzer')
            
            # Step 5: Calculate overall risk score
            risk_score = self._calculate_overall_risk(
                content_result, sentiment_result, pattern_results, context_result
            )
            
            # Step 6: Determine if content should be blocked
            should_block = risk_score >= self.config['blocking_threshold']
            is_abusive = risk_score > 0.3
            
            # Step 7: Generate suggestions if enabled
            if self.config['enable_suggestions'] and self.rephrasing_engine and is_abusive:
                rephrasing_result = self.rephrasing_engine.generate_suggestions(
                    message.content, message.context
                )
                suggestions = [s.suggested_text for s in rephrasing_result.suggestions[:3]]
                components_used.append('rephrasing_engine')
            
            # Step 8: Generate alerts for high-risk content
            if risk_score >= self.config['high_risk_threshold']:
                alerts.append({
                    'type': 'high_risk_content',
                    'risk_score': risk_score,
                    'message_id': message.id,
                    'user_id': message.user_id,
                    'platform': message.platform,
                    'timestamp': message.timestamp
                })
            
            # Calculate processing time
            end_time = time.time()
            processing_time_ms = (end_time - start_time) * 1000
            
            # Update message status
            message.processing_end_time = end_time
            message.status = ProcessingStatus.COMPLETED if not should_block else ProcessingStatus.BLOCKED
            message.results = {
                'content_result': content_result.__dict__ if content_result else None,
                'sentiment_result': sentiment_result.__dict__ if sentiment_result else None,
                'pattern_results': [p.__dict__ if hasattr(p, '__dict__') else p for p in pattern_results],
                'context_result': context_result.__dict__ if context_result else None,
                'risk_score': risk_score,
                'suggestions': suggestions
            }
            
            return ProcessingResult(
                message_id=message.id,
                is_abusive=is_abusive,
                risk_score=risk_score,
                suggestions=suggestions,
                should_block=should_block,
                processing_time_ms=processing_time_ms,
                components_used=components_used,
                alerts_generated=alerts
            )
            
        except Exception as e:
            logger.error(f"Error processing message {message.id}: {e}")
            message.status = ProcessingStatus.FAILED
            message.retry_count += 1
            
            # Retry if under limit
            if message.retry_count < self.config['max_retry_attempts']:
                logger.info(f"Retrying message {message.id} (attempt {message.retry_count})")
                # Re-queue with lower priority
                lower_priority = MessagePriority.LOW if message.priority != MessagePriority.LOW else MessagePriority.LOW
                self.priority_queues[lower_priority].put((-message.timestamp, message))
            
            # Return error result
            processing_time_ms = (time.time() - start_time) * 1000
            return ProcessingResult(
                message_id=message.id,
                is_abusive=False,
                risk_score=0.0,
                suggestions=[],
                should_block=False,
                processing_time_ms=processing_time_ms,
                components_used=components_used,
                alerts_generated=[{
                    'type': 'processing_error',
                    'error': str(e),
                    'message_id': message.id
                }]
            )

    def _calculate_overall_risk(self, content_result, sentiment_result, 
                               pattern_results, context_result) -> float:
        """Calculate overall risk score from component results"""
        risk_factors = []
        
        # Content detection risk
        if content_result:
            risk_factors.append(content_result.risk_score / 100.0)  # Normalize to 0-1
        
        # Sentiment risk
        if sentiment_result:
            # Convert toxicity score to risk
            risk_factors.append(sentiment_result.toxicity_score)
        
        # Pattern analysis risk
        if pattern_results:
            pattern_risk = 0.0
            for pattern in pattern_results:
                # Assume pattern has confidence and severity attributes
                if hasattr(pattern, 'confidence') and hasattr(pattern, 'severity'):
                    pattern_risk = max(pattern_risk, pattern.confidence * (pattern.severity / 4.0))
            risk_factors.append(pattern_risk)
        
        # Context modifiers
        context_modifier = 1.0
        if context_result and context_result.risk_modifiers:
            for modifier_name, modifier_value in context_result.risk_modifiers.items():
                if modifier_name == 'intent_risk':
                    context_modifier *= modifier_value
                elif modifier_name == 'platform_adjustment':
                    context_modifier *= (1.0 + modifier_value)
        
        # Calculate weighted average
        if risk_factors:
            base_risk = sum(risk_factors) / len(risk_factors)
            final_risk = min(1.0, base_risk * context_modifier)
        else:
            final_risk = 0.0
        
        return final_risk

    def _handle_processing_result(self, message: StreamMessage, result: ProcessingResult):
        """Handle the result of message processing"""
        # Update statistics
        self.stats['messages_processed'] += 1
        
        if result.should_block:
            self.stats['messages_blocked'] += 1
            self.blocked_messages.append({
                'message_id': message.id,
                'user_id': message.user_id,
                'content': message.content[:100],  # Store first 100 chars
                'risk_score': result.risk_score,
                'timestamp': message.timestamp
            })
        
        # Store in processed messages history
        self.processed_messages.append({
            'message_id': message.id,
            'user_id': message.user_id,
            'risk_score': result.risk_score,
            'processing_time_ms': result.processing_time_ms,
            'timestamp': message.timestamp,
            'blocked': result.should_block
        })
        
        # Trigger callbacks
        self._trigger_callbacks('on_message_processed', message, result)
        
        if result.should_block:
            self._trigger_callbacks('on_message_blocked', message, result)
        
        if result.risk_score >= self.config['high_risk_threshold']:
            self._trigger_callbacks('on_high_risk_detected', message, result)
        
        # Send alerts
        for alert in result.alerts_generated:
            logger.warning(f"Alert generated: {alert}")

    def _trigger_callbacks(self, event_type: str, message: StreamMessage, result: ProcessingResult):
        """Trigger registered callbacks for an event"""
        callbacks = self.callbacks.get(event_type, [])
        for callback in callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    # Handle async callbacks
                    asyncio.create_task(callback(message, result))
                else:
                    callback(message, result)
            except Exception as e:
                logger.error(f"Error in callback {callback.__name__}: {e}")

    def register_callback(self, event_type: str, callback: Callable):
        """Register a callback for specific events"""
        if event_type not in self.callbacks:
            raise ValueError(f"Unknown event type: {event_type}")
        
        self.callbacks[event_type].append(callback)
        logger.info(f"Registered callback {callback.__name__} for {event_type}")

    def _update_statistics(self):
        """Update processing statistics periodically"""
        last_processed_count = 0
        
        while self.is_running:
            try:
                time.sleep(60)  # Update every minute
                
                # Calculate throughput
                current_processed = self.stats['messages_processed']
                throughput = current_processed - last_processed_count
                self.stats['throughput_per_minute'] = throughput
                last_processed_count = current_processed
                
                # Update queue sizes
                for priority, queue in self.priority_queues.items():
                    self.stats['queue_sizes'][priority.name] = queue.qsize()
                
                # Calculate average processing time
                if self.processed_messages:
                    recent_messages = list(self.processed_messages)[-100:]  # Last 100 messages
                    avg_time = sum(msg['processing_time_ms'] for msg in recent_messages) / len(recent_messages)
                    self.stats['average_processing_time'] = avg_time
                
                logger.debug(f"Stats updated: {self.stats}")
                
            except Exception as e:
                logger.error(f"Error updating statistics: {e}")

    def get_message_status(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a specific message"""
        # Search in processed messages
        for msg_data in self.processed_messages:
            if msg_data['message_id'] == message_id:
                return {
                    'status': 'completed',
                    'processed_time': msg_data['processing_time_ms'],
                    'risk_score': msg_data['risk_score'],
                    'blocked': msg_data['blocked']
                }
        
        # Search in blocked messages
        for msg_data in self.blocked_messages:
            if msg_data['message_id'] == message_id:
                return {
                    'status': 'blocked',
                    'risk_score': msg_data['risk_score']
                }
        
        return None

    def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status"""
        queue_status = {}
        total_queued = 0
        
        for priority, queue in self.priority_queues.items():
            size = queue.qsize()
            queue_status[priority.name] = size
            total_queued += size
        
        return {
            'total_queued': total_queued,
            'by_priority': queue_status,
            'is_processing': self.is_running
        }

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive processing statistics"""
        return {
            **self.stats,
            'queue_status': self.get_queue_status(),
            'processing_threads_active': sum(1 for t in self.processing_threads if t.is_alive()),
            'rate_limited_users': len([u for u, (c, _) in self.rate_limits.items() if c >= self.rate_limit_max]),
            'recent_blocked_messages': len(self.blocked_messages),
            'uptime_seconds': time.time() - (getattr(self, 'start_time', time.time()))
        }

    def clear_statistics(self):
        """Clear processing statistics"""
        self.stats = {
            'messages_processed': 0,
            'messages_blocked': 0,
            'average_processing_time': 0.0,
            'queue_sizes': {},
            'errors': 0,
            'throughput_per_minute': 0.0
        }
        self.processed_messages.clear()
        self.blocked_messages.clear()
        logger.info("Statistics cleared")

    def configure(self, **config_updates):
        """Update configuration parameters"""
        self.config.update(config_updates)
        logger.info(f"Configuration updated: {config_updates}")

    async def process_message_async(self, content: str, user_id: str, platform: str, 
                                  context: Dict[str, Any] = None) -> ProcessingResult:
        """Async version of message processing"""
        message_id = self.add_message(content, user_id, platform, context)
        
        # Wait for processing to complete
        max_wait_time = 30.0  # seconds
        wait_interval = 0.1
        waited_time = 0.0
        
        while waited_time < max_wait_time:
            status = self.get_message_status(message_id)
            if status:
                # Find the full result
                for msg_data in self.processed_messages:
                    if msg_data['message_id'] == message_id:
                        return ProcessingResult(
                            message_id=message_id,
                            is_abusive=msg_data.get('risk_score', 0) > 0.3,
                            risk_score=msg_data['risk_score'],
                            suggestions=[],
                            should_block=msg_data['blocked'],
                            processing_time_ms=msg_data['processing_time_ms'],
                            components_used=[],
                            alerts_generated=[]
                        )
            
            await asyncio.sleep(wait_interval)
            waited_time += wait_interval
        
        raise TimeoutError(f"Message {message_id} processing timed out")