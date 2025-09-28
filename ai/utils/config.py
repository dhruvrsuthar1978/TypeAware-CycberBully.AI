"""
Configuration management for TypeAware AI
"""
import os
import json
from typing import Dict, Any

class Config:
    """Configuration manager"""
    
    DEFAULT_CONFIG = {
        # AI thresholds
        'blocking_threshold': 0.7,
        'high_risk_threshold': 0.8,
        'suggestion_threshold': 0.3,
        
        # Database
        'mongodb_url': os.getenv('MONGODB_URL', 'mongodb://localhost:27017'),
        'database_name': os.getenv('DB_NAME', 'typeaware'),
        
        # API
        'api_host': os.getenv('API_HOST', '0.0.0.0'),
        'api_port': int(os.getenv('API_PORT', 8000)),
        
        # Performance
        'enable_caching': True,
        'cache_size': 1000,
        'enable_stream_processing': True,
        'stream_workers': 4,
        
        # Rate limiting
        'rate_limit_window': 300,
        'rate_limit_max': 50
    }
    
    @classmethod
    def load(cls, config_path: str = None) -> Dict[str, Any]:
        """Load configuration from file or environment"""
        config = cls.DEFAULT_CONFIG.copy()
        
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
        
        return config