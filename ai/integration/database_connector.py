"""
database_connector.py
MongoDB database connector for TypeAware
Handles all database operations for the AI system
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from bson import ObjectId
import json

logger = logging.getLogger(__name__)

class DatabaseConnector:
    """
    MongoDB connector for TypeAware AI system
    Handles storage and retrieval of analysis results, user data, and system metrics
    """
    
    def __init__(self, connection_string: str, database_name: str):
        self.connection_string = connection_string
        self.database_name = database_name
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.is_connected = False
        
        # Collection references
        self.collections = {}
        
        # Collection names
        self.collection_names = {
            'analysis_results': 'analysis_results',
            'user_reports': 'user_reports',
            'user_statistics': 'user_statistics',
            'blocked_messages': 'blocked_messages',
            'alerts': 'alerts',
            'system_stats': 'system_stats',
            'user_behavior': 'user_behavior',
            'flagged_content': 'flagged_content'
        }
        
        logger.info(f"DatabaseConnector initialized for database: {database_name}")

    async def connect(self) -> bool:
        """Establish connection to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(self.connection_string)
            self.db = self.client[self.database_name]
            
            # Test connection
            await self.client.admin.command('ping')
            
            # Initialize collections
            await self._initialize_collections()
            
            # Create indexes
            await self._create_indexes()
            
            self.is_connected = True
            logger.info("Successfully connected to MongoDB")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self.is_connected = False
            return False

    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("MongoDB connection closed")

    async def _initialize_collections(self):
        """Initialize collection references"""
        for key, name in self.collection_names.items():
            self.collections[key] = self.db[name]

    async def _create_indexes(self):
        """Create database indexes for performance"""
        try:
            # Analysis results indexes
            await self.collections['analysis_results'].create_index([
                ("user_id", 1), ("timestamp", -1)
            ])
            await self.collections['analysis_results'].create_index([
                ("platform", 1), ("timestamp", -1)
            ])
            await self.collections['analysis_results'].create_index([
                ("risk_score", -1), ("timestamp", -1)
            ])
            
            # User reports indexes
            await self.collections['user_reports'].create_index([
                ("reported_user_id", 1), ("timestamp", -1)
            ])
            await self.collections['user_reports'].create_index([
                ("reporting_user_id", 1), ("timestamp", -1)
            ])
            
            # User statistics indexes
            await self.collections['user_statistics'].create_index("user_id", unique=True)
            
            # Blocked messages indexes
            await self.collections['blocked_messages'].create_index([
                ("user_id", 1), ("timestamp", -1)
            ])
            
            # Alerts indexes
            await self.collections['alerts'].create_index([
                ("user_id", 1), ("timestamp", -1)
            ])
            await self.collections['alerts'].create_index([
                ("alert_type", 1), ("timestamp", -1)
            ])
            
            # User behavior indexes
            await self.collections['user_behavior'].create_index("user_id", unique=True)
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

    async def store_analysis_result(self, result: Dict[str, Any], 
                                   request_data: Dict[str, Any]) -> str:
        """Store analysis result in database"""
        try:
            document = {
                'request_id': result['request_id'],
                'user_id': request_data['user_id'],
                'platform': request_data['platform'],
                'content_hash': self._hash_content(request_data['content']),
                'content_length': len(request_data['content']),
                'is_abusive': result['is_abusive'],
                'risk_score': result['risk_score'],
                'risk_level': result['risk_level'],
                'confidence': result['confidence'],
                'should_block': result['should_block'],
                'suggestions': result['suggestions'],
                'educational_message': result['educational_message'],
                'alerts': result['alerts'],
                'processing_time_ms': result['processing_time_ms'],
                'components_used': result['components_used'],
                'analysis_mode': result['analysis_mode'],
                'timestamp': datetime.utcnow(),
                'context': request_data.get('context', {})
            }
            
            # Store detailed analysis results if comprehensive mode
            if result['analysis_mode'] == 'comprehensive':
                document.update({
                    'content_analysis': result.get('content_analysis'),
                    'sentiment_analysis': result.get('sentiment_analysis'),
                    'pattern_analysis': result.get('pattern_analysis'),
                    'context_analysis': result.get('context_analysis'),
                    'obfuscation_analysis': result.get('obfuscation_analysis')
                })
            
            insert_result = await self.collections['analysis_results'].insert_one(document)
            
            # Update user statistics
            await self._update_user_statistics(request_data['user_id'], result)
            
            # Store blocked message if needed
            if result['should_block']:
                await self._store_blocked_message(request_data, result)
            
            # Store alerts if any
            for alert in result['alerts']:
                await self._store_alert(alert)
            
            return str(insert_result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error storing analysis result: {e}")
            raise

    async def store_user_report(self, reported_user_id: str, reporting_user_id: str,
                               message_content: str, platform: str, reason: str,
                               context: Dict[str, Any] = None) -> str:
        """Store user report in database"""
        try:
            document = {
                'reported_user_id': reported_user_id,
                'reporting_user_id': reporting_user_id,
                'message_content': message_content,
                'content_hash': self._hash_content(message_content),
                'platform': platform,
                'reason': reason,
                'context': context or {},
                'status': 'pending',
                'timestamp': datetime.utcnow(),
                'analysis_result': None,
                'admin_action': None
            }
            
            insert_result = await self.collections['user_reports'].insert_one(document)
            
            # Update user behavior data
            await self._update_user_behavior(reported_user_id, 'report_received')
            await self._update_user_behavior(reporting_user_id, 'report_made')
            
            return str(insert_result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error storing user report: {e}")
            raise

    async def update_report_analysis(self, report_id: str, analysis_result: Dict[str, Any]):
        """Update report with analysis results"""
        try:
            await self.collections['user_reports'].update_one(
                {'_id': ObjectId(report_id)},
                {
                    '$set': {
                        'analysis_result': {
                            'risk_score': analysis_result['risk_score'],
                            'risk_level': analysis_result['risk_level'],
                            'is_abusive': analysis_result['is_abusive'],
                            'confidence': analysis_result['confidence'],
                            'categories': analysis_result.get('categories', []),
                            'analyzed_at': datetime.utcnow()
                        },
                        'status': 'analyzed'
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"Error updating report analysis: {e}")
            raise

    async def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user statistics"""
        try:
            # Get user stats document
            user_stats = await self.collections['user_statistics'].find_one({'user_id': user_id})
            
            if not user_stats:
                return {
                    'user_id': user_id,
                    'total_messages': 0,
                    'abusive_messages': 0,
                    'blocked_messages': 0,
                    'reports_against': 0,
                    'reports_made': 0,
                    'average_risk_score': 0.0,
                    'first_seen': None,
                    'last_seen': None,
                    'platforms': [],
                    'risk_level': 'LOW'
                }
            
            # Calculate additional metrics
            now = datetime.utcnow()
            thirty_days_ago = now - timedelta(days=30)
            
            # Recent activity
            recent_analyses = await self.collections['analysis_results'].count_documents({
                'user_id': user_id,
                'timestamp': {'$gte': thirty_days_ago}
            })
            
            recent_blocked = await self.collections['blocked_messages'].count_documents({
                'user_id': user_id,
                'timestamp': {'$gte': thirty_days_ago}
            })
            
            # Reports against user
            reports_against = await self.collections['user_reports'].count_documents({
                'reported_user_id': user_id
            })
            
            # Recent reports
            recent_reports = await self.collections['user_reports'].count_documents({
                'reported_user_id': user_id,
                'timestamp': {'$gte': thirty_days_ago}
            })
            
            return {
                'user_id': user_id,
                'total_messages': user_stats.get('total_messages', 0),
                'abusive_messages': user_stats.get('abusive_messages', 0),
                'blocked_messages': user_stats.get('blocked_messages', 0),
                'reports_against': reports_against,
                'reports_made': user_stats.get('reports_made', 0),
                'average_risk_score': user_stats.get('average_risk_score', 0.0),
                'highest_risk_score': user_stats.get('highest_risk_score', 0.0),
                'first_seen': user_stats.get('first_seen'),
                'last_seen': user_stats.get('last_seen'),
                'platforms': user_stats.get('platforms', []),
                'risk_level': self._calculate_user_risk_level(user_stats),
                'recent_activity': {
                    'messages_30_days': recent_analyses,
                    'blocked_30_days': recent_blocked,
                    'reports_30_days': recent_reports
                },
                'behavior_trends': user_stats.get('behavior_trends', {}),
                'escalation_score': user_stats.get('escalation_score', 0.0)
            }
            
        except Exception as e:
            logger.error(f"Error getting user statistics: {e}")
            return {}

    async def get_flagged_content(self, limit: int = 50, platform: str = None,
                                 risk_level: str = None) -> List[Dict[str, Any]]:
        """Get recently flagged content for admin dashboard"""
        try:
            query = {'is_abusive': True}
            
            if platform:
                query['platform'] = platform
            if risk_level:
                query['risk_level'] = risk_level
            
            cursor = self.collections['analysis_results'].find(query) \
                .sort('timestamp', -1) \
                .limit(limit)
            
            results = []
            async for doc in cursor:
                results.append({
                    'id': str(doc['_id']),
                    'user_id': doc['user_id'],
                    'platform': doc['platform'],
                    'risk_score': doc['risk_score'],
                    'risk_level': doc['risk_level'],
                    'content_length': doc['content_length'],
                    'should_block': doc['should_block'],
                    'timestamp': doc['timestamp'],
                    'alerts': doc.get('alerts', [])
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting flagged content: {e}")
            return []

    async def get_high_risk_users(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get users with highest risk scores"""
        try:
            cursor = self.collections['user_statistics'].find({}) \
                .sort('average_risk_score', -1) \
                .limit(limit)
            
            results = []
            async for doc in cursor:
                # Get recent reports count
                reports_count = await self.collections['user_reports'].count_documents({
                    'reported_user_id': doc['user_id']
                })
                
                results.append({
                    'user_id': doc['user_id'],
                    'average_risk_score': doc.get('average_risk_score', 0.0),
                    'total_messages': doc.get('total_messages', 0),
                    'blocked_messages': doc.get('blocked_messages', 0),
                    'reports_against': reports_count,
                    'last_seen': doc.get('last_seen'),
                    'escalation_score': doc.get('escalation_score', 0.0),
                    'platforms': doc.get('platforms', [])
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting high risk users: {e}")
            return []

    async def get_platform_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get platform-wise statistics"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Aggregate by platform
            pipeline = [
                {'$match': {'timestamp': {'$gte': cutoff_date}}},
                {
                    '$group': {
                        '_id': '$platform',
                        'total_messages': {'$sum': 1},
                        'abusive_messages': {'$sum': {'$cond': ['$is_abusive', 1, 0]}},
                        'blocked_messages': {'$sum': {'$cond': ['$should_block', 1, 0]}},
                        'avg_risk_score': {'$avg': '$risk_score'},
                        'high_risk_messages': {'$sum': {'$cond': [{'$gte': ['$risk_score', 0.8]}, 1, 0]}}
                    }
                },
                {'$sort': {'total_messages': -1}}
            ]
            
            results = {}
            async for doc in self.collections['analysis_results'].aggregate(pipeline):
                platform = doc['_id'] or 'unknown'
                results[platform] = {
                    'total_messages': doc['total_messages'],
                    'abusive_messages': doc['abusive_messages'],
                    'blocked_messages': doc['blocked_messages'],
                    'average_risk_score': round(doc['avg_risk_score'], 3),
                    'high_risk_messages': doc['high_risk_messages'],
                    'abuse_rate': round(doc['abusive_messages'] / doc['total_messages'] * 100, 2) if doc['total_messages'] > 0 else 0
                }
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting platform statistics: {e}")
            return {}

    async def create_alert(self, alert_type: str, user_id: str, data: Dict[str, Any],
                          severity: str = "medium") -> str:
        """Create an alert"""
        try:
            document = {
                'alert_type': alert_type,
                'user_id': user_id,
                'severity': severity,
                'data': data,
                'status': 'active',
                'created_at': datetime.utcnow(),
                'acknowledged_at': None,
                'acknowledged_by': None
            }
            
            insert_result = await self.collections['alerts'].insert_one(document)
            return str(insert_result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error creating alert: {e}")
            raise

    async def get_active_alerts(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get active alerts"""
        try:
            cursor = self.collections['alerts'].find({'status': 'active'}) \
                .sort('created_at', -1) \
                .limit(limit)
            
            results = []
            async for doc in cursor:
                results.append({
                    'id': str(doc['_id']),
                    'alert_type': doc['alert_type'],
                    'user_id': doc['user_id'],
                    'severity': doc['severity'],
                    'data': doc['data'],
                    'created_at': doc['created_at']
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting active alerts: {e}")
            return []

    async def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge an alert"""
        try:
            result = await self.collections['alerts'].update_one(
                {'_id': ObjectId(alert_id)},
                {
                    '$set': {
                        'status': 'acknowledged',
                        'acknowledged_at': datetime.utcnow(),
                        'acknowledged_by': acknowledged_by
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error acknowledging alert: {e}")
            return False

    async def get_system_statistics(self) -> Dict[str, Any]:
        """Get system-wide statistics"""
        try:
            # Get date ranges
            now = datetime.utcnow()
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            # Messages analyzed today
            today_messages = await self.collections['analysis_results'].count_documents({
                'timestamp': {'$gte': today}
            })
            
            # Messages analyzed this week
            week_messages = await self.collections['analysis_results'].count_documents({
                'timestamp': {'$gte': week_ago}
            })
            
            # Messages analyzed this month
            month_messages = await self.collections['analysis_results'].count_documents({
                'timestamp': {'$gte': month_ago}
            })
            
            # Abusive content stats
            month_abusive = await self.collections['analysis_results'].count_documents({
                'timestamp': {'$gte': month_ago},
                'is_abusive': True
            })
            
            # Blocked content stats
            month_blocked = await self.collections['blocked_messages'].count_documents({
                'timestamp': {'$gte': month_ago}
            })
            
            # Active alerts
            active_alerts = await self.collections['alerts'].count_documents({
                'status': 'active'
            })
            
            # Total users
            total_users = await self.collections['user_statistics'].count_documents({})
            
            # High risk users (average risk score > 0.7)
            high_risk_users = await self.collections['user_statistics'].count_documents({
                'average_risk_score': {'$gt': 0.7}
            })
            
            return {
                'messages_analyzed': {
                    'today': today_messages,
                    'week': week_messages,
                    'month': month_messages
                },
                'abuse_detection': {
                    'abusive_content_month': month_abusive,
                    'blocked_content_month': month_blocked,
                    'detection_rate': round(month_abusive / month_messages * 100, 2) if month_messages > 0 else 0
                },
                'user_metrics': {
                    'total_users': total_users,
                    'high_risk_users': high_risk_users,
                    'risk_percentage': round(high_risk_users / total_users * 100, 2) if total_users > 0 else 0
                },
                'alerts': {
                    'active_alerts': active_alerts
                },
                'timestamp': now
            }
            
        except Exception as e:
            logger.error(f"Error getting system statistics: {e}")
            return {}

    async def health_check(self) -> bool:
        """Check database health"""
        try:
            if not self.is_connected:
                return False
            
            # Ping database
            await self.client.admin.command('ping')
            return True
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

    async def get_statistics(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            if not self.is_connected:
                return {'status': 'disconnected'}
            
            # Get database stats
            db_stats = await self.db.command('dbStats')
            
            # Get collection counts
            collection_stats = {}
            for name, collection in self.collections.items():
                count = await collection.count_documents({})
                collection_stats[name] = count
            
            return {
                'status': 'connected',
                'database_size_mb': round(db_stats['dataSize'] / (1024 * 1024), 2),
                'storage_size_mb': round(db_stats['storageSize'] / (1024 * 1024), 2),
                'collections': collection_stats,
                'indexes': db_stats['indexes']
            }
            
        except Exception as e:
            logger.error(f"Error getting database statistics: {e}")
            return {'status': 'error', 'error': str(e)}

    def _hash_content(self, content: str) -> str:
        """Generate hash for content (for deduplication)"""
        import hashlib
        return hashlib.md5(content.encode()).hexdigest()

    async def _update_user_statistics(self, user_id: str, analysis_result: Dict[str, Any]):
        """Update user statistics based on analysis result"""
        try:
            now = datetime.utcnow()
            
            # Calculate update operations
            update_ops = {
                '$inc': {'total_messages': 1},
                '$set': {'last_seen': now},
                '$setOnInsert': {'user_id': user_id, 'first_seen': now},
                '$addToSet': {'platforms': analysis_result.get('platform', 'unknown')}
            }
            
            if analysis_result['is_abusive']:
                update_ops['$inc']['abusive_messages'] = 1
            
            if analysis_result['should_block']:
                update_ops['$inc']['blocked_messages'] = 1
            
            # Update average risk score
            existing_stats = await self.collections['user_statistics'].find_one({'user_id': user_id})
            if existing_stats:
                current_total = existing_stats.get('total_messages', 0)
                current_avg = existing_stats.get('average_risk_score', 0.0)
                new_avg = ((current_avg * current_total) + analysis_result['risk_score']) / (current_total + 1)
                update_ops['$set']['average_risk_score'] = round(new_avg, 3)
                
                # Update highest risk score
                highest_risk = existing_stats.get('highest_risk_score', 0.0)
                if analysis_result['risk_score'] > highest_risk:
                    update_ops['$set']['highest_risk_score'] = analysis_result['risk_score']
            else:
                update_ops['$set']['average_risk_score'] = analysis_result['risk_score']
                update_ops['$set']['highest_risk_score'] = analysis_result['risk_score']
            
            await self.collections['user_statistics'].update_one(
                {'user_id': user_id},
                update_ops,
                upsert=True
            )
            
        except Exception as e:
            logger.error(f"Error updating user statistics: {e}")

    async def _update_user_behavior(self, user_id: str, behavior_type: str):
        """Update user behavior tracking"""
        try:
            await self.collections['user_behavior'].update_one(
                {'user_id': user_id},
                {
                    '$inc': {f'behavior_counts.{behavior_type}': 1},
                    '$set': {'last_updated': datetime.utcnow()},
                    '$setOnInsert': {'user_id': user_id, 'created_at': datetime.utcnow()}
                },
                upsert=True
            )
            
        except Exception as e:
            logger.error(f"Error updating user behavior: {e}")

    async def _store_blocked_message(self, request_data: Dict[str, Any], 
                                   analysis_result: Dict[str, Any]):
        """Store blocked message details"""
        try:
            document = {
                'user_id': request_data['user_id'],
                'platform': request_data['platform'],
                'content_hash': self._hash_content(request_data['content']),
                'content_length': len(request_data['content']),
                'risk_score': analysis_result['risk_score'],
                'risk_level': analysis_result['risk_level'],
                'categories': analysis_result.get('categories', []),
                'timestamp': datetime.utcnow(),
                'context': request_data.get('context', {})
            }
            
            await self.collections['blocked_messages'].insert_one(document)
            
        except Exception as e:
            logger.error(f"Error storing blocked message: {e}")

    async def _store_alert(self, alert_data: Dict[str, Any]):
        """Store alert in database"""
        try:
            document = {
                'alert_type': alert_data.get('type', 'unknown'),
                'user_id': alert_data.get('user_id'),
                'platform': alert_data.get('platform'),
                'severity': self._determine_alert_severity(alert_data),
                'data': alert_data,
                'status': 'active',
                'created_at': datetime.utcnow()
            }
            
            await self.collections['alerts'].insert_one(document)
            
        except Exception as e:
            logger.error(f"Error storing alert: {e}")

    def _determine_alert_severity(self, alert_data: Dict[str, Any]) -> str:
        """Determine alert severity based on alert data"""
        alert_type = alert_data.get('type', '')
        risk_score = alert_data.get('risk_score', 0.0)
        
        if alert_type in ['threat_detected', 'extreme_toxicity'] or risk_score >= 0.9:
            return 'critical'
        elif alert_type in ['high_risk_content', 'behavioral_pattern'] or risk_score >= 0.7:
            return 'high'
        elif risk_score >= 0.5:
            return 'medium'
        else:
            return 'low'

    def _calculate_user_risk_level(self, user_stats: Dict[str, Any]) -> str:
        """Calculate user risk level based on statistics"""
        avg_risk = user_stats.get('average_risk_score', 0.0)
        total_messages = user_stats.get('total_messages', 0)
        blocked_messages = user_stats.get('blocked_messages', 0)
        
        block_rate = blocked_messages / total_messages if total_messages > 0 else 0
        
        if avg_risk >= 0.8 or block_rate >= 0.5:
            return 'CRITICAL'
        elif avg_risk >= 0.6 or block_rate >= 0.3:
            return 'HIGH'
        elif avg_risk >= 0.4 or block_rate >= 0.1:
            return 'MEDIUM'
        elif avg_risk > 0.1:
            return 'LOW'
        else:
            return 'MINIMAL'

    async def cleanup_old_data(self, retention_days: int = 90):
        """Clean up old data beyond retention period"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            # Clean up old analysis results (keep summary stats)
            old_results = await self.collections['analysis_results'].delete_many({
                'timestamp': {'$lt': cutoff_date},
                'risk_level': {'$in': ['LOW', 'MINIMAL']}  # Only delete low-risk old data
            })
            
            # Clean up old acknowledged alerts
            old_alerts = await self.collections['alerts'].delete_many({
                'created_at': {'$lt': cutoff_date},
                'status': 'acknowledged'
            })
            
            logger.info(f"Cleanup completed: {old_results.deleted_count} analysis results, "
                       f"{old_alerts.deleted_count} alerts removed")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

# Usage example
async def main():
    """Example usage of DatabaseConnector"""
    db = DatabaseConnector(
        connection_string="mongodb://localhost:27017",
        database_name="typeaware"
    )
    
    # Connect to database
    connected = await db.connect()
    if connected:
        print("Connected to database successfully")
        
        # Get system statistics
        stats = await db.get_system_statistics()
        print(f"System stats: {stats}")
        
        # Close connection
        await db.close()
    else:
        print("Failed to connect to database")

if __name__ == "__main__":
    asyncio.run(main())