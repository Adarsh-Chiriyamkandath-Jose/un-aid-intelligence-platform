from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from contextlib import asynccontextmanager

from app.database import engine, get_db, SessionLocal
from app.models import Base
from app.services.data_loader import load_real_aid_data
from app.routers import dashboard, countries, donors, sectors, aid_records, forecasting, chat, map
from sqlalchemy.orm import Session

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
    
    # Start data loading in background (non-blocking)
    print("Starting background data loading...")
    try:
        import asyncio
        from threading import Thread
        
        def load_data_background():
            try:
                db = SessionLocal()
                try:
                    # Create new event loop for this thread
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(load_real_aid_data(db))
                    print("Background data loading completed successfully")
                finally:
                    db.close()
            except Exception as e:
                print(f"Background data loading failed: {e}")
        
        # Start loading in separate thread to avoid blocking startup
        thread = Thread(target=load_data_background, daemon=True)
        thread.start()
        print("Background data loading started")
        
    except Exception as e:
        print(f"Error starting background data loading: {e}")
    
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title="UN Aid Intelligence Platform", 
    description="AI-powered analytics for international development aid flows using real UN data",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(countries.router, prefix="/api/countries", tags=["countries"])
app.include_router(donors.router, prefix="/api/donors", tags=["donors"])
app.include_router(sectors.router, prefix="/api/sectors", tags=["sectors"])
app.include_router(aid_records.router, prefix="/api/aid-records", tags=["aid-records"])
app.include_router(map.router, prefix="/api/map", tags=["map"])
app.include_router(forecasting.router, prefix="/api/forecasting", tags=["forecasting"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

# Import and register export router
from app.routers import export
app.include_router(export.router, tags=["export"])

# Remove duplicate router registrations - already included above

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "platform": "FastAPI"}

# Direct API endpoints for testing
# Removed direct sectors endpoint - using router instead

@app.get("/api/donors")  
async def get_donors_direct(db: Session = Depends(get_db)):
    """Get all donors"""
    try:
        from app.models import Donor
        donors = db.query(Donor).all()
        return [
            {
                "id": donor.id,
                "name": donor.name,
                "donor_type": donor.donor_type,
                "country": donor.country
            }
            for donor in donors
        ]
    except Exception as e:
        return {"error": str(e)}

# Admin endpoint to reload data
@app.post("/api/admin/reload-data")
async def reload_data(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        background_tasks.add_task(load_real_aid_data, db)
        return {"success": True, "message": "Data reload started in background"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start data reload: {str(e)}")

# SHAP test page endpoint
@app.get("/shap-test.html")
async def serve_shap_test():
    return FileResponse("dist/shap-test.html")

# Serve static files (React frontend) - only in production
import pathlib
if not os.getenv("ENVIRONMENT") == "development" and pathlib.Path("dist/static").exists():
    app.mount("/static", StaticFiles(directory="dist/static"), name="static")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        return FileResponse("dist/index.html")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )