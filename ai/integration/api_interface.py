"""
api_interface.py
Backend API interface for TypeAware
Provides REST API endpoints for the AI detection system
"""

import json
import time
import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import asdict
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from ..main_engine import TypeAwareEngine, AnalysisRequest, AnalysisMode
from .database_connector import DatabaseConnector
from .message_handler import MessageHandler

logger = logging.getLogger(__name__)

# Pydantic models for API requests/responses
class AnalysisRequestModel(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000, description="Content to analyze")
    user_id: str = Field(..., description="User identifier")
    platform: str = Field(default="web", description="Platform name")
    mode: str = Field(default="real_time", description="Analysis mode: real_time, comprehensive, lightweight")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    include_suggestions: bool = Field(default=True, description="Include rephrasing suggestions")
    include_patterns: bool = Field(default=True, description="Include pattern analysis")

class AnalysisResponseModel(BaseModel):
    request_id: str
    is_abusive: bool
    risk_score: float
    risk_level: str
    confidence: float
    suggestions: List[str]
    educational_message: str
    should_block: bool
    alerts: List[Dict[str, Any]]
    processing_time_ms: float
    components_used: List[str]
    analysis_mode: str

class StreamRequestModel(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    user_id: str
    platform: str = Field(default="web")
    context: Optional[Dict[str, Any]] = None

class StreamStatusModel(BaseModel):
    message_id: str
    status: str
    risk_score: Optional[float] = None
    processing_time_ms: Optional[float] = None
    blocked: Optional[bool] = None

class BatchAnalysisRequestModel(BaseModel):
    requests: List[AnalysisRequestModel] = Field(..., max_items=100, description="Max 100 requests per batch")

class UserReportModel(BaseModel):
    reported_user_id: str
    reporting_user_id: str
    message_content: str
    platform: str
    report_reason: str
    context: Optional[Dict[str, Any]] = None

class APIInterface:
    """
    FastAPI-based interface for the TypeAware AI system
    Provides RESTful endpoints for real-time and batch analysis
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Initialize AI engine
        self.ai_engine = TypeAwareEngine(self.config.get('ai_config', {}))
        
        # Initialize database connector
        db_config = self.config.get('database', {})
        self.db_connector = DatabaseConnector(
            connection_string=db_config.get('mongodb_url', 'mongodb://localhost:27017'),
            database_name=db_config.get('database_name', 'typeaware')
        )
        
        # Initialize message handler
        self.message_handler = MessageHandler(self.ai_engine, self.db_connector)
        
        # Create FastAPI app
        self.app = FastAPI(
            title="TypeAware AI API",
            description="AI-powered cyberbullying detection and prevention system",
            version="1.0.0",
            docs_url="/docs",
            redoc_url="/redoc"
        )
        
        # Add CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=self.config.get('cors_origins', ["http://localhost:3000"]),
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup routes
        self._setup_routes()
        
        # Statistics tracking
        self.api_stats = {
            'total_requests': 0,
            'analysis_requests': 0,
            'stream_requests': 0,
            'batch_requests': 0,
            'errors': 0,
            'blocked_content': 0
        }
        
        logger.info("APIInterface initialized")

    def _setup_routes(self):
        """Setup API routes"""
        
        @self.app.get("/")
        async def root():
            """Root endpoint with API information"""
            return {
                "name": "TypeAware AI API",
                "version": "1.0.0",
                "status": "running",
                "endpoints": {
                    "analyze": "/api/v1/analyze",
                    "stream": "/api/v1/stream",
                    "batch": "/api/v1/batch",
                    "health": "/health",
                    "stats": "/stats"
                }
            }

        @self.app.post("/api/v1/analyze", response_model=AnalysisResponseModel)
        async def analyze_content(request: AnalysisRequestModel):
            """Analyze content for cyberbullying and harmful behavior"""
            try:
                self.api_stats['total_requests'] += 1
                self.api_stats['analysis_requests'] += 1
                
                # Convert API request to internal request
                analysis_mode = AnalysisMode.REAL_TIME
                if request.mode == "comprehensive":
                    analysis_mode = AnalysisMode.COMPREHENSIVE
                elif request.mode == "lightweight":
                    analysis_mode = AnalysisMode.LIGHTWEIGHT
                
                analysis_request = AnalysisRequest(
                    content=request.content,
                    user_id=request.user_id,
                    platform=request.platform,
                    mode=analysis_mode,
                    context=request.context,
                    include_suggestions=request.include_suggestions,
                    include_patterns=request.include_patterns
                )
                
                # Analyze content
                result = self.ai_engine.analyze_content(analysis_request)
                
                # Store result in database
                await self.message_handler.store_analysis_result(result, request.dict())
                
                # Update statistics
                if result.should_block:
                    self.api_stats['blocked_content'] += 1
                
                # Convert to API response model
                return AnalysisResponseModel(
                    request_id=result.request_id,
                    is_abusive=result.is_abusive,
                    risk_score=result.risk_score,
                    risk_level=result.risk_level,
                    confidence=result.confidence,
                    suggestions=result.suggestions or [],
                    educational_message=result.educational_message or "",
                    should_block=result.should_block,
                    alerts=result.alerts or [],
                    processing_time_ms=result.processing_time_ms,
                    components_used=result.components_used or [],
                    analysis_mode=result.analysis_mode.value
                )
                
            except Exception as e:
                logger.error(f"Error in analyze_content: {e}")
                self.api_stats['errors'] += 1
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/stream")
        async def stream_analyze(request: StreamRequestModel):
            """Add content to real-time processing stream"""
            try:
                self.api_stats['total_requests'] += 1
                self.api_stats['stream_requests'] += 1
                
                # Add to stream processor
                message_id = self.ai_engine.analyze_content_stream(
                    content=request.content,
                    user_id=request.user_id,
                    platform=request.platform,
                    context=request.context
                )
                
                return {
                    "message_id": message_id,
                    "status": "queued",
                    "check_status_url": f"/api/v1/stream/status/{message_id}"
                }
                
            except Exception as e:
                logger.error(f"Error in stream_analyze: {e}")
                self.api_stats['errors'] += 1
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/v1/stream/status/{message_id}")
        async def get_stream_status(message_id: str):
            """Get status of stream processing"""
            try:
                status = self.ai_engine.get_stream_result(message_id)
                
                if status is None:
                    raise HTTPException(status_code=404, detail="Message not found")
                
                return StreamStatusModel(
                    message_id=message_id,
                    status=status.get('status', 'unknown'),
                    risk_score=status.get('risk_score'),
                    processing_time_ms=status.get('processed_time'),
                    blocked=status.get('blocked')
                )
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error in get_stream_status: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/batch")
        async def batch_analyze(request: BatchAnalysisRequestModel):
            """Analyze multiple content items in batch"""
            try:
                self.api_stats['total_requests'] += 1
                self.api_stats['batch_requests'] += 1
                
                # Convert API requests to internal requests
                analysis_requests = []
                for req in request.requests:
                    analysis_mode = AnalysisMode.REAL_TIME
                    if req.mode == "comprehensive":
                        analysis_mode = AnalysisMode.COMPREHENSIVE
                    elif req.mode == "lightweight":
                        analysis_mode = AnalysisMode.LIGHTWEIGHT
                    
                    analysis_requests.append(AnalysisRequest(
                        content=req.content,
                        user_id=req.user_id,
                        platform=req.platform,
                        mode=analysis_mode,
                        context=req.context,
                        include_suggestions=req.include_suggestions,
                        include_patterns=req.include_patterns
                    ))
                
                # Analyze batch
                results = self.ai_engine.batch_analyze(analysis_requests)
                
                # Convert results
                response_results = []
                for result in results:
                    if result.should_block:
                        self.api_stats['blocked_content'] += 1
                    
                    response_results.append(AnalysisResponseModel(
                        request_id=result.request_id,
                        is_abusive=result.is_abusive,
                        risk_score=result.risk_score,
                        risk_level=result.risk_level,
                        confidence=result.confidence,
                        suggestions=result.suggestions or [],
                        educational_message=result.educational_message or "",
                        should_block=result.should_block,
                        alerts=result.alerts or [],
                        processing_time_ms=result.processing_time_ms,
                        components_used=result.components_used or [],
                        analysis_mode=result.analysis_mode.value
                    ))
                
                return {
                    "batch_id": f"batch_{int(time.time())}",
                    "total_processed": len(results),
                    "results": response_results
                }
                
            except Exception as e:
                logger.error(f"Error in batch_analyze: {e}")
                self.api_stats['errors'] += 1
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/v1/report")
        async def report_user(report: UserReportModel, background_tasks: BackgroundTasks):
            """Report a user for abusive behavior"""
            try:
                # Store report in database
                report_id = await self.message_handler.store_user_report(
                    reported_user_id=report.reported_user_id,
                    reporting_user_id=report.reporting_user_id,
                    message_content=report.message_content,
                    platform=report.platform,
                    reason=report.report_reason,
                    context=report.context
                )
                
                # Analyze the reported content in background
                background_tasks.add_task(
                    self._analyze_reported_content,
                    report_id,
                    report.message_content,
                    report.reported_user_id,
                    report.platform
                )
                
                return {
                    "report_id": report_id,
                    "status": "received",
                    "message": "Report has been received and will be reviewed"
                }
                
            except Exception as e:
                logger.error(f"Error in report_user: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/v1/user/{user_id}/stats")
        async def get_user_stats(user_id: str):
            """Get user statistics and behavior analysis"""
            try:
                stats = await self.message_handler.get_user_statistics(user_id)
                return stats
                
            except Exception as e:
                logger.error(f"Error in get_user_stats: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/health")
        async def health_check():
            """Health check endpoint"""
            try:
                # Check AI engine health
                engine_health = self.ai_engine.health_check()
                
                # Check database connection
                db_health = await self.db_connector.health_check()
                
                overall_status = "healthy"
                if engine_health['overall'] != 'healthy' or not db_health:
                    overall_status = "degraded"
                
                return {
                    "status": overall_status,
                    "timestamp": time.time(),
                    "components": {
                        "ai_engine": engine_health,
                        "database": "healthy" if db_health else "unhealthy"
                    }
                }
                
            except Exception as e:
                logger.error(f"Error in health_check: {e}")
                return {
                    "status": "unhealthy",
                    "error": str(e),
                    "timestamp": time.time()
                }

        @self.app.get("/stats")
        async def get_statistics():
            """Get API and system statistics"""
            try:
                # Get AI engine stats
                engine_stats = self.ai_engine.get_statistics()
                
                # Get database stats
                db_stats = await self.db_connector.get_statistics()
                
                return {
                    "api_stats": self.api_stats,
                    "engine_stats": engine_stats,
                    "database_stats": db_stats,
                    "timestamp": time.time()
                }
                
            except Exception as e:
                logger.error(f"Error in get_statistics: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/admin/clear-stats")
        async def clear_statistics():
            """Clear all statistics (admin only)"""
            try:
                # Clear API stats
                self.api_stats = {
                    'total_requests': 0,
                    'analysis_requests': 0,
                    'stream_requests': 0,
                    'batch_requests': 0,
                    'errors': 0,
                    'blocked_content': 0
                }
                
                # Clear engine stats
                self.ai_engine.clear_statistics()
                
                return {"message": "Statistics cleared successfully"}
                
            except Exception as e:
                logger.error(f"Error in clear_statistics: {e}")
                raise HTTPException(status_code=500, detail=str(e))

    async def _analyze_reported_content(self, report_id: str, content: str, 
                                       user_id: str, platform: str):
        """Background task to analyze reported content"""
        try:
            analysis_request = AnalysisRequest(
                content=content,
                user_id=user_id,
                platform=platform,
                mode=AnalysisMode.COMPREHENSIVE,
                include_suggestions=True,
                include_patterns=True
            )
            
            result = self.ai_engine.analyze_content(analysis_request)
            
            # Update report with analysis results
            await self.message_handler.update_report_analysis(report_id, result)
            
            # If high risk, create alert
            if result.risk_score >= 0.8:
                await self.message_handler.create_alert(
                    alert_type="high_risk_reported_content",
                    user_id=user_id,
                    data={
                        "report_id": report_id,
                        "risk_score": result.risk_score,
                        "content": content[:200]  # First 200 chars
                    }
                )
                
        except Exception as e:
            logger.error(f"Error analyzing reported content: {e}")

    def run(self, host: str = "0.0.0.0", port: int = 8000, **kwargs):
        """Run the API server"""
        logger.info(f"Starting TypeAware API server on {host}:{port}")
        
        # Additional uvicorn configuration
        config = {
            "host": host,
            "port": port,
            "log_level": "info",
            "access_log": True,
            **kwargs
        }
        
        uvicorn.run(self.app, **config)

    async def startup(self):
        """Startup tasks"""
        try:
            # Connect to database
            await self.db_connector.connect()
            
            # Initialize message handler
            await self.message_handler.initialize()
            
            logger.info("API startup completed successfully")
            
        except Exception as e:
            logger.error(f"Error during startup: {e}")
            raise

    async def shutdown(self):
        """Shutdown tasks"""
        try:
            # Shutdown AI engine
            self.ai_engine.shutdown()
            
            # Close database connection
            await self.db_connector.close()
            
            logger.info("API shutdown completed successfully")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")

def create_api_app(config: Dict[str, Any] = None) -> FastAPI:
    """Create and configure the FastAPI application"""
    api_interface = APIInterface(config)
    return api_interface.app

# For use with ASGI servers like gunicorn
app = create_api_app()

if __name__ == "__main__":
    # Development server
    config = {
        'ai_config': {
            'blocking_threshold': 0.7,
            'high_risk_threshold': 0.8,
            'enable_stream_processing': True
        },
        'database': {
            'mongodb_url': 'mongodb://localhost:27017',
            'database_name': 'typeaware'
        },
        'cors_origins': ["http://localhost:3000", "http://localhost:3001"]
    }
    
    api_interface = APIInterface(config)
    api_interface.run(host="0.0.0.0", port=8000)
    