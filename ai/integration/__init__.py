"""
TypeAware AI Integration Module
Backend integration components for connecting AI system with databases and APIs
"""

from .api_interface import APIInterface, AnalysisRequestModel, AnalysisResponseModel, create_api_app
from .database_connector import DatabaseConnector
from .message_handler import MessageHandler, MessageContext, ProcessingResult

__all__ = [
    'APIInterface',
    'AnalysisRequestModel', 
    'AnalysisResponseModel',
    'create_api_app',
    'DatabaseConnector',
    'MessageHandler',
    'MessageContext',
    'ProcessingResult'
]