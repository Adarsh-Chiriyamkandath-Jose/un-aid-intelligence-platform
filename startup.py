#!/usr/bin/env python3
"""
UN Aid Intelligence Platform - Complete startup script
Combines FastAPI backend with React frontend
"""
import os
import sys
import asyncio
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles  
from fastapi.responses import FileResponse, HTMLResponse
from pathlib import Path

# Set environment  
os.environ.setdefault("ENVIRONMENT", "development")

# Import the FastAPI app
from main import app

# Configure static file serving for React frontend
static_path = Path("dist/public")

if static_path.exists():
    print("✅ React frontend found - enabling full-stack mode")
    
    # Mount static assets (CSS, JS, images)
    app.mount("/assets", StaticFiles(directory=str(static_path / "assets")), name="assets")
    
    # Serve React app at root
    @app.get("/", response_class=HTMLResponse)
    async def serve_react_root():
        with open(static_path / "index.html") as f:
            return HTMLResponse(content=f.read())
            
    # Catch-all for SPA routing (except API routes)
    @app.get("/{full_path:path}")
    async def serve_spa_routes(full_path: str):
        # Let API routes pass through to FastAPI
        if full_path.startswith(("api/", "docs", "openapi.json", "redoc")):
            # Return 404, FastAPI will handle it
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
            
        # Check if it's a static file
        file_path = static_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
            
        # Default to React app for SPA routing
        with open(static_path / "index.html") as f:
            return HTMLResponse(content=f.read())
            
else:
    print("⚠️  React frontend not built. Running API-only mode.")
    print("💡 Run 'npm run build' to enable the full frontend")

if __name__ == "__main__":
    print("🚀 UN Aid Intelligence Platform")
    print("📊 FastAPI + PostgreSQL + React")
    print("🌐 Available at: http://localhost:5000") 
    print("📚 API docs: http://localhost:5000/docs")
    print("🔄 Starting server...")
    
    uvicorn.run(
        "startup:app",
        host="0.0.0.0",
        port=5000,
        reload=False,
        access_log=True,
        log_level="info"
    )