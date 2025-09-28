#!/usr/bin/env python3
"""
Quick start server for TypeAware AI API
Run with: python ai/run_server.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.integration.api_interface import APIInterface, app
from ai.utils.config import Config
from ai.utils.logger import setup_logger
import uvicorn

def main():
    """Main entry point"""

    # Setup logging
    logger = setup_logger('typeaware_server')

    # Load configuration
    config = Config.load()

    logger.info("Starting TypeAware AI Server...")
    logger.info(f"MongoDB URL: {config['mongodb_url']}")
    logger.info(f"API Host: {config['api_host']}:{config['api_port']}")

    # Create API interface
    api = APIInterface({
        'ai_config': {
            'blocking_threshold': config['blocking_threshold'],
            'high_risk_threshold': config['high_risk_threshold'],
            'enable_stream_processing': config['enable_stream_processing']
        },
        'database': {
            'mongodb_url': config['mongodb_url'],
            'database_name': config['database_name']
        },
        'cors_origins': ["*"]  # Allow all origins for development
    })

    try:
        if config.get("env", "dev") == "prod":
            # Production mode: multiple workers, no reload
            uvicorn.run(
                "ai.integration.api_interface:app",
                host=config['api_host'],
                port=config['api_port'],
                workers=4,
                reload=False
            )
        else:
            # Development mode: single worker, reload enabled
            api.run(
                host=config['api_host'],
                port=config['api_port'],
                reload=True
            )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
