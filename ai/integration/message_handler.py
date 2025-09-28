"""
message_handler.py
Message handling system for TypeAware
Coordinates between frontend messages, AI processing, and database storage
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

from ..main_engine import TypeAwareEngine, AnalysisRequest, AnalysisMode
from .database_connector import DatabaseConnector

logger = logging.getLogger(__name__)

@dataclass
class MessageContext:
    """Extended message context for processing"""
    user_id: str
    platform: str
    timestamp: float
    conversation_id: Optional[str] = None
    target_user_id: Optional[str] = None
    message_type: str = "post"  # post, comment, reply, dm
    parent_message_id: Optional[str] = None
    user_session_id: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None

@dataclass
class ProcessingResult:
    """Result of message processing"""
    message_id: str
    should_block: bool
    risk_score: float
    suggestions: List[str]
    alerts: List[Dict[str, Any]]
    processing_time_ms: float
    user_action_required: bool = False
    admin_review_required: bool = False

class MessageHandler:
    """
    Handles message processing workflow including:
    - Message validation and preprocessing
    - AI analysis coordination
    - Database operations
    - Alert generation
    - User behavior tracking
    """
    
    def __init__(self, ai_engine: TypeAwareEngine, db_connector: DatabaseConnector):
        self.ai_engine = ai_engine
        self.db_connector = db_connector
        
        # Message processing callbacks
        self.callbacks = {
            'on_message_blocked': [],
            'on_high_risk_detected': [],
            'on_user_escalation': [],
            'on_repeat_offender': []
        }
        
        # Processing configuration
        self.config = {
            'max_message_length': 10000,
            'rate_limit_window': 300,  # 5 minutes
            'rate_limit_max_messages': 50,
            'escalation_threshold': 3,  # strikes before escalation
            'auto_block_threshold': 0.85,
            'admin_review_threshold': 0.9
        }
        
        # In-memory caches for performance
        self.user_rate_limits = {}  # user_id -> (count, window_start)
        self.user_escalation_tracking = {}  # user_id -> escalation_data
        
        logger.info("MessageHandler initialized")

    async def initialize(self):
        """Initialize message handler"""
        try:
            # Load user escalation data from database
            await self._load_user_escalation_data()
            logger.info("MessageHandler initialization completed")
            
        except Exception as e:
            logger.error(f"Error initializing MessageHandler: {e}")
            raise

    async def process_message(self, content: str, context: MessageContext,
                            mode: AnalysisMode = AnalysisMode.REAL_TIME) -> ProcessingResult:
        """
        Process a single message through the complete workflow
        
        Args:
            content: Message content to analyze
            context: Message context information
            mode: Analysis mode to use
            
        Returns:
            ProcessingResult with processing outcome
        """
        start_time = time.time()
        message_id = f"{context.user_id}_{int(start_time * 1000)}"
        
        try:
            # Step 1: Validate message
            validation_result = await self._validate_message(content, context)
            if not validation_result['valid']:
                return ProcessingResult(
                    message_id=message_id,
                    should_block=True,
                    risk_score=0.0,
                    suggestions=[],
                    alerts=[{'type': 'validation_failed', 'reason': validation_result['reason']}],
                    processing_time_ms=(time.time() - start_time) * 1000,
                    user_action_required=False
                )
            
            # Step 2: Check rate limiting
            if await self._is_rate_limited(context.user_id):
                return ProcessingResult(
                    message_id=message_id,
                    should_block=True,
                    risk_score=0.0,
                    suggestions=[],
                    alerts=[{'type': 'rate_limited', 'user_id': context.user_id}],
                    processing_time_ms=(time.time() - start_time) * 1000,
                    user_action_required=False
                )
            
            # Step 3: Get user history and context
            user_context = await self._build_user_context(context)
            
            # Step 4: AI Analysis
            analysis_request = AnalysisRequest(
                content=content,
                user_id=context.user_id,
                platform=context.platform,
                mode=mode,
                context=user_context,
                include_suggestions=True,
                include_patterns=True
            )
            
            analysis_result = self.ai_engine.analyze_content(analysis_request)
            
            # Step 5: Post-process results
            processing_result = await self._post_process_analysis(
                analysis_result, context, start_time
            )
            
            # Step 6: Store results and update user data
            await self._store_processing_result(processing_result, analysis_result, context)
            
            # Step 7: Handle escalations and alerts
            await self._handle_escalations(processing_result, context)
            
            # Step 8: Trigger callbacks
            await self._trigger_callbacks(processing_result, context)
            
            return processing_result
            
        except Exception as e:
            logger.error(f"Error processing message {message_id}: {e}")
            return ProcessingResult(
                message_id=message_id,
                should_block=False,
                risk_score=0.0,
                suggestions=[],
                alerts=[{'type': 'processing_error', 'error': str(e)}],
                processing_time_ms=(time.time() - start_time) * 1000,
                user_action_required=False
            )

    async def handle_user_report(self, reported_content: str, reporter_context: MessageContext,
                               reported_user_id: str, reason: str) -> str:
        """
        Handle a user report for abusive content
        
        Returns:
            Report ID for tracking
        """
        try:
            # Store the report
            report_id = await self.db_connector.store_user_report(
                reported_user_id=reported_user_id,
                reporting_user_id=reporter_context.user_id,
                message_content=reported_content,
                platform=reporter_context.platform,
                reason=reason,
                context={
                    'conversation_id': reporter_context.conversation_id,
                    'message_type': reporter_context.message_type,
                    'timestamp': reporter_context.timestamp
                }
            )
            
            # Analyze the reported content
            analysis_context = MessageContext(
                user_id=reported_user_id,
                platform=reporter_context.platform,
                timestamp=reporter_context.timestamp,
                conversation_id=reporter_context.conversation_id
            )
            
            # Use comprehensive analysis for reports
            processing_result = await self.process_message(
                reported_content,
                analysis_context,
                AnalysisMode.COMPREHENSIVE
            )
            
            # Update report with analysis
            await self.db_connector.update_report_analysis(report_id, {
                'risk_score': processing_result.risk_score,
                'risk_level': 'HIGH' if processing_result.risk_score >= 0.7 else 'MEDIUM',
                'is_abusive': processing_result.should_block,
                'confidence': 0.8  # Default confidence for reports
            })
            
            # If high risk, escalate immediately
            if processing_result.risk_score >= 0.8:
                await self._escalate_user_report(report_id, reported_user_id, processing_result)
            
            return report_id
            
        except Exception as e:
            logger.error(f"Error handling user report: {e}")
            raise

    async def get_user_dashboard_data(self, user_id: str) -> Dict[str, Any]:
        """Get user dashboard data including statistics and recent activity"""
        try:
            # Get user statistics
            user_stats = await self.db_connector.get_user_statistics(user_id)
            
            # Get recent analysis results for this user
            recent_results = await self._get_recent_user_activity(user_id, days=30)
            
            # Get user escalation status
            escalation_data = self.user_escalation_tracking.get(user_id, {})
            
            # Calculate user insights
            insights = await self._generate_user_insights(user_id, user_stats, recent_results)
            
            return {
                'user_id': user_id,
                'statistics': user_stats,
                'recent_activity': recent_results,
                'escalation_status': {
                    'current_level': escalation_data.get('level', 0),
                    'strikes': escalation_data.get('strikes', 0),
                    'last_incident': escalation_data.get('last_incident'),
                    'next_review': escalation_data.get('next_review')
                },
                'insights': insights,
                'recommendations': self._generate_user_recommendations(user_stats, insights)
            }
            
        except Exception as e:
            logger.error(f"Error getting user dashboard data: {e}")
            return {}

    async def get_admin_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive admin dashboard data"""
        try:
            # Get system statistics
            system_stats = await self.db_connector.get_system_statistics()
            
            # Get recent flagged content
            flagged_content = await self.db_connector.get_flagged_content(limit=50)
            
            # Get high risk users
            high_risk_users = await self.db_connector.get_high_risk_users(limit=20)
            
            # Get platform statistics
            platform_stats = await self.db_connector.get_platform_statistics(days=30)
            
            # Get active alerts
            active_alerts = await self.db_connector.get_active_alerts(limit=100)
            
            # Get AI engine statistics
            ai_stats = self.ai_engine.get_statistics()
            
            return {
                'system_overview': system_stats,
                'flagged_content': flagged_content,
                'high_risk_users': high_risk_users,
                'platform_statistics': platform_stats,
                'active_alerts': active_alerts,
                'ai_performance': ai_stats,
                'trends': await self._calculate_trends()
            }
            
        except Exception as e:
            logger.error(f"Error getting admin dashboard data: {e}")
            return {}

    async def _validate_message(self, content: str, context: MessageContext) -> Dict[str, Any]:
        """Validate message before processing"""
        if not content or len(content.strip()) == 0:
            return {'valid': False, 'reason': 'Empty message'}
        
        if len(content) > self.config['max_message_length']:
            return {'valid': False, 'reason': 'Message too long'}
        
        # Additional validation checks can be added here
        return {'valid': True}

    async def _is_rate_limited(self, user_id: str) -> bool:
        """Check if user is rate limited"""
        current_time = time.time()
        
        if user_id not in self.user_rate_limits:
            self.user_rate_limits[user_id] = (1, current_time)
            return False
        
        count, window_start = self.user_rate_limits[user_id]
        
        # Check if we're in a new window
        if current_time - window_start > self.config['rate_limit_window']:
            self.user_rate_limits[user_id] = (1, current_time)
            return False
        
        # Check if limit exceeded
        if count >= self.config['rate_limit_max_messages']:
            return True
        
        # Increment count
        self.user_rate_limits[user_id] = (count + 1, window_start)
        return False

    async def _build_user_context(self, context: MessageContext) -> Dict[str, Any]:
        """Build comprehensive user context for AI analysis"""
        try:
            # Get user statistics
            user_stats = await self.db_connector.get_user_statistics(context.user_id)
            
            # Get escalation data
            escalation_data = self.user_escalation_tracking.get(context.user_id, {})
            
            # Build context dictionary
            user_context = {
                'user_id': context.user_id,
                'platform': context.platform,
                'timestamp': context.timestamp,
                'conversation_id': context.conversation_id,
                'target_user_id': context.target_user_id,
                'message_type': context.message_type,
                'user_history': {
                    'total_messages': user_stats.get('total_messages', 0),
                    'abusive_messages': user_stats.get('abusive_messages', 0),
                    'average_risk_score': user_stats.get('average_risk_score', 0.0),
                    'repeat_offender': escalation_data.get('level', 0) > 2,
                    'escalation_level': escalation_data.get('level', 0)
                },
                'platform_norms': self._get_platform_norms(context.platform),
                'conversation_context': await self._get_conversation_context(context.conversation_id) if context.conversation_id else None
            }
            
            return user_context
            
        except Exception as e:
            logger.error(f"Error building user context: {e}")
            return {'user_id': context.user_id, 'platform': context.platform}

    async def _post_process_analysis(self, analysis_result, context: MessageContext, 
                                   start_time: float) -> ProcessingResult:
        """Post-process AI analysis results"""
        processing_time_ms = (time.time() - start_time) * 1000
        
        # Determine if admin review is required
        admin_review_required = (
            analysis_result.risk_score >= self.config['admin_review_threshold'] or
            any(alert.get('type') == 'threat_detected' for alert in analysis_result.alerts or [])
        )
        
        # Determine if user action is required (educational intervention)
        user_action_required = (
            analysis_result.is_abusive and 
            analysis_result.risk_score >= 0.5 and 
            len(analysis_result.suggestions or []) > 0
        )
        
        # Override blocking decision based on user escalation level
        escalation_data = self.user_escalation_tracking.get(context.user_id, {})
        should_block = analysis_result.should_block
        
        if escalation_data.get('level', 0) >= 3:  # High escalation users get stricter blocking
            should_block = should_block or analysis_result.risk_score >= 0.6
        
        return ProcessingResult(
            message_id=analysis_result.request_id,
            should_block=should_block,
            risk_score=analysis_result.risk_score,
            suggestions=analysis_result.suggestions or [],
            alerts=analysis_result.alerts or [],
            processing_time_ms=processing_time_ms,
            user_action_required=user_action_required,
            admin_review_required=admin_review_required
        )

    async def _store_processing_result(self, processing_result: ProcessingResult,
                                     analysis_result, context: MessageContext):
        """Store processing results in database"""
        try:
            # Prepare analysis result data for storage
            result_data = {
                'request_id': processing_result.message_id,
                'is_abusive': processing_result.should_block,
                'risk_score': processing_result.risk_score,
                'risk_level': analysis_result.risk_level,
                'confidence': analysis_result.confidence,
                'should_block': processing_result.should_block,
                'suggestions': processing_result.suggestions,
                'educational_message': analysis_result.educational_message or "",
                'alerts': processing_result.alerts,
                'processing_time_ms': processing_result.processing_time_ms,
                'components_used': analysis_result.components_used or [],
                'analysis_mode': analysis_result.analysis_mode.value
            }
            
            # Prepare request data
            request_data = {
                'user_id': context.user_id,
                'platform': context.platform,
                'content': "redacted",  # Don't store actual content for privacy
                'context': {
                    'conversation_id': context.conversation_id,
                    'message_type': context.message_type,
                    'target_user_id': context.target_user_id
                }
            }
            
            # Store in database
            await self.db_connector.store_analysis_result(result_data, request_data)
            
        except Exception as e:
            logger.error(f"Error storing processing result: {e}")

    async def _handle_escalations(self, processing_result: ProcessingResult, 
                                context: MessageContext):
        """Handle user escalations based on processing results"""
        try:
            user_id = context.user_id
            
            # Check if this is a violation
            if processing_result.should_block:
                # Update escalation tracking
                if user_id not in self.user_escalation_tracking:
                    self.user_escalation_tracking[user_id] = {
                        'level': 0,
                        'strikes': 0,
                        'last_incident': None,
                        'incidents': []
                    }
                
                escalation_data = self.user_escalation_tracking[user_id]
                escalation_data['strikes'] += 1
                escalation_data['last_incident'] = datetime.utcnow()
                escalation_data['incidents'].append({
                    'timestamp': datetime.utcnow(),
                    'risk_score': processing_result.risk_score,
                    'platform': context.platform
                })
                
                # Determine escalation level
                strikes = escalation_data['strikes']
                if strikes >= 5:
                    escalation_data['level'] = 3  # Critical
                elif strikes >= 3:
                    escalation_data['level'] = 2  # High
                elif strikes >= 1:
                    escalation_data['level'] = 1  # Medium
                
                # Create escalation alert
                if escalation_data['level'] >= 2:
                    await self.db_connector.create_alert(
                        alert_type='user_escalation',
                        user_id=user_id,
                        data={
                            'escalation_level': escalation_data['level'],
                            'total_strikes': strikes,
                            'recent_incident': {
                                'risk_score': processing_result.risk_score,
                                'platform': context.platform,
                                'timestamp': escalation_data['last_incident'].isoformat()
                            }
                        },
                        severity='high' if escalation_data['level'] >= 3 else 'medium'
                    )
                
                # Save escalation data to database
                await self._save_user_escalation_data(user_id, escalation_data)
                
        except Exception as e:
            logger.error(f"Error handling escalations: {e}")

    async def _trigger_callbacks(self, processing_result: ProcessingResult, 
                               context: MessageContext):
        """Trigger registered callbacks based on processing results"""
        try:
            # Message blocked callback
            if processing_result.should_block:
                for callback in self.callbacks['on_message_blocked']:
                    try:
                        if asyncio.iscoroutinefunction(callback):
                            await callback(processing_result, context)
                        else:
                            callback(processing_result, context)
                    except Exception as e:
                        logger.error(f"Error in message_blocked callback: {e}")
            
            # High risk detected callback
            if processing_result.risk_score >= 0.8:
                for callback in self.callbacks['on_high_risk_detected']:
                    try:
                        if asyncio.iscoroutinefunction(callback):
                            await callback(processing_result, context)
                        else:
                            callback(processing_result, context)
                    except Exception as e:
                        logger.error(f"Error in high_risk_detected callback: {e}")
            
            # User escalation callback
            escalation_data = self.user_escalation_tracking.get(context.user_id)
            if escalation_data and escalation_data.get('level', 0) >= 2:
                for callback in self.callbacks['on_user_escalation']:
                    try:
                        if asyncio.iscoroutinefunction(callback):
                            await callback(processing_result, context, escalation_data)
                        else:
                            callback(processing_result, context, escalation_data)
                    except Exception as e:
                        logger.error(f"Error in user_escalation callback: {e}")
                        
        except Exception as e:
            logger.error(f"Error triggering callbacks: {e}")

    async def _get_conversation_context(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get context about the conversation"""
        # This would query recent messages in the conversation
        # For now, return basic structure
        return {
            'conversation_id': conversation_id,
            'participant_count': 2,  # Placeholder
            'recent_activity': True
        }

    def _get_platform_norms(self, platform: str) -> Dict[str, Any]:
        """Get platform-specific norms and tolerances"""
        platform_norms = {
            'twitter': {'tolerance_level': 0.6, 'typical_tone': 'casual'},
            'facebook': {'tolerance_level': 0.5, 'typical_tone': 'personal'},
            'instagram': {'tolerance_level': 0.4, 'typical_tone': 'positive'},
            'discord': {'tolerance_level': 0.7, 'typical_tone': 'informal'},
            'reddit': {'tolerance_level': 0.6, 'typical_tone': 'discussion'},
            'default': {'tolerance_level': 0.5, 'typical_tone': 'neutral'}
        }
        
        return platform_norms.get(platform, platform_norms['default'])

    async def _load_user_escalation_data(self):
        """Load user escalation data from database"""
        try:
            # This would load escalation data from database
            # For now, initialize empty tracking
            self.user_escalation_tracking = {}
            logger.info("User escalation data loaded")
            
        except Exception as e:
            logger.error(f"Error loading user escalation data: {e}")

    async def _save_user_escalation_data(self, user_id: str, escalation_data: Dict[str, Any]):
        """Save user escalation data to database"""
        try:
            # Update user behavior collection with escalation data
            await self.db_connector.db['user_behavior'].update_one(
                {'user_id': user_id},
                {
                    '$set': {
                        'escalation_data': escalation_data,
                        'last_updated': datetime.utcnow()
                    }
                },
                upsert=True
            )
            
        except Exception as e:
            logger.error(f"Error saving user escalation data: {e}")

    async def _get_recent_user_activity(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get recent user activity for dashboard"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            cursor = self.db_connector.collections['analysis_results'].find({
                'user_id': user_id,
                'timestamp': {'$gte': cutoff_date}
            }).sort('timestamp', -1).limit(50)
            
            results = []
            async for doc in cursor:
                results.append({
                    'timestamp': doc['timestamp'],
                    'platform': doc['platform'],
                    'risk_score': doc['risk_score'],
                    'risk_level': doc['risk_level'],
                    'was_blocked': doc['should_block'],
                    'had_suggestions': len(doc.get('suggestions', [])) > 0
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting recent user activity: {e}")
            return []

    async def _generate_user_insights(self, user_id: str, user_stats: Dict[str, Any], 
                                    recent_activity: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate insights about user behavior"""
        try:
            insights = {}
            
            # Calculate trends
            if recent_activity:
                recent_risk_scores = [activity['risk_score'] for activity in recent_activity]
                insights['average_recent_risk'] = sum(recent_risk_scores) / len(recent_risk_scores)
                insights['trend'] = 'improving' if insights['average_recent_risk'] < user_stats.get('average_risk_score', 0) else 'concerning'
            else:
                insights['average_recent_risk'] = 0.0
                insights['trend'] = 'stable'
            
            # Platform analysis
            platform_activity = {}
            for activity in recent_activity:
                platform = activity['platform']
                if platform not in platform_activity:
                    platform_activity[platform] = {'count': 0, 'total_risk': 0}
                platform_activity[platform]['count'] += 1
                platform_activity[platform]['total_risk'] += activity['risk_score']
            
            for platform, data in platform_activity.items():
                data['average_risk'] = data['total_risk'] / data['count']
            
            insights['platform_behavior'] = platform_activity
            
            # Behavioral patterns
            blocked_count = sum(1 for activity in recent_activity if activity['was_blocked'])
            insights['recent_blocked_rate'] = blocked_count / len(recent_activity) if recent_activity else 0
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating user insights: {e}")
            return {}

    def _generate_user_recommendations(self, user_stats: Dict[str, Any], 
                                     insights: Dict[str, Any]) -> List[str]:
        """Generate recommendations for user improvement"""
        recommendations = []
        
        avg_risk = user_stats.get('average_risk_score', 0.0)
        trend = insights.get('trend', 'stable')
        
        if avg_risk > 0.7:
            recommendations.append("Consider taking a break before posting when feeling emotional")
        
        if avg_risk > 0.5:
            recommendations.append("Review your messages before sending to ensure they're respectful")
        
        if trend == 'concerning':
            recommendations.append("Your recent messages have been more negative - try focusing on constructive communication")
        elif trend == 'improving':
            recommendations.append("Great improvement in your communication style - keep it up!")
        
        blocked_rate = insights.get('recent_blocked_rate', 0)
        if blocked_rate > 0.3:
            recommendations.append("Many of your recent messages were blocked - consider our communication guidelines")
        
        return recommendations

    async def _calculate_trends(self) -> Dict[str, Any]:
        """Calculate system trends for admin dashboard"""
        try:
            now = datetime.utcnow()
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            # Weekly trends
            week_stats = await self._get_period_stats(week_ago, now)
            prev_week_stats = await self._get_period_stats(week_ago - timedelta(days=7), week_ago)
            
            # Calculate trend percentages
            trends = {}
            for key in ['total_messages', 'abusive_messages', 'blocked_messages']:
                current = week_stats.get(key, 0)
                previous = prev_week_stats.get(key, 1)  # Avoid division by zero
                change = ((current - previous) / previous) * 100 if previous > 0 else 0
                trends[f'{key}_trend'] = round(change, 2)
            
            return trends
            
        except Exception as e:
            logger.error(f"Error calculating trends: {e}")
            return {}

    async def _get_period_stats(self, start_date: datetime, end_date: datetime) -> Dict[str, int]:
        """Get statistics for a specific time period"""
        try:
            pipeline = [
                {'$match': {'timestamp': {'$gte': start_date, '$lt': end_date}}},
                {
                    '$group': {
                        '_id': None,
                        'total_messages': {'$sum': 1},
                        'abusive_messages': {'$sum': {'$cond': ['$is_abusive', 1, 0]}},
                        'blocked_messages': {'$sum': {'$cond': ['$should_block', 1, 0]}}
                    }
                }
            ]
            
            cursor = self.db_connector.collections['analysis_results'].aggregate(pipeline)
            result = await cursor.to_list(length=1)
            
            if result:
                return result[0]
            else:
                return {'total_messages': 0, 'abusive_messages': 0, 'blocked_messages': 0}
                
        except Exception as e:
            logger.error(f"Error getting period stats: {e}")
            return {'total_messages': 0, 'abusive_messages': 0, 'blocked_messages': 0}

    async def _escalate_user_report(self, report_id: str, reported_user_id: str, 
                                  processing_result: ProcessingResult):
        """Escalate a high-risk user report"""
        try:
            await self.db_connector.create_alert(
                alert_type='escalated_user_report',
                user_id=reported_user_id,
                data={
                    'report_id': report_id,
                    'risk_score': processing_result.risk_score,
                    'auto_escalated': True,
                    'reason': 'High risk content detected in user report'
                },
                severity='high'
            )
            
            logger.info(f"Escalated user report {report_id} for user {reported_user_id}")
            
        except Exception as e:
            logger.error(f"Error escalating user report: {e}")

    def register_callback(self, event_type: str, callback: Callable):
        """Register a callback for specific events"""
        if event_type in self.callbacks:
            self.callbacks[event_type].append(callback)
            logger.info(f"Registered callback for {event_type}")
        else:
            raise ValueError(f"Unknown event type: {event_type}")

    def configure(self, **config_updates):
        """Update configuration parameters"""
        self.config.update(config_updates)
        logger.info(f"MessageHandler configuration updated: {config_updates}")

# Example usage
async def example_usage():
    """Example of how to use MessageHandler"""
    from ..main_engine import TypeAwareEngine
    
    # Initialize components
    ai_engine = TypeAwareEngine()
    db_connector = DatabaseConnector(
        connection_string="mongodb://localhost:27017",
        database_name="typeaware"
    )
    
    # Connect to database
    await db_connector.connect()
    
    # Initialize message handler
    message_handler = MessageHandler(ai_engine, db_connector)
    await message_handler.initialize()
    
    # Process a message
    context = MessageContext(
        user_id="user123",
        platform="twitter",
        timestamp=time.time()
    )
    
    result = await message_handler.process_message(
        "This is a test message",
        context
    )
    
    print(f"Message processed: blocked={result.should_block}, risk={result.risk_score}")
    
    # Clean up
    await db_connector.close()

if __name__ == "__main__":
    asyncio.run(example_usage())