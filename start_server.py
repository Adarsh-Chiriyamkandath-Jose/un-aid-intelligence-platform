#!/usr/bin/env python3
"""
UN Aid Intelligence Platform FastAPI Server
Corrected version with proper data loading
"""
import os
import uvicorn
from main import app

if __name__ == "__main__":
    # Set environment for development
    os.environ["ENVIRONMENT"] = "development"
    
    print("🚀 Starting UN Aid Intelligence Platform")
    print("📊 FastAPI backend with real UN aid data")
    print("🌐 Server will be available at http://localhost:5000")
    print("📚 API docs at http://localhost:5000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0", 
        port=5000,
        reload=False,  # Disable reload to prevent data reloading
        log_level="info"
    )