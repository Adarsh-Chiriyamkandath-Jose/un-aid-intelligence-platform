from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Sector

router = APIRouter()

def clean_sector_name(name: str) -> str:
    """Remove technical codes and clean up sector names"""
    import re
    
    # Remove all patterns: I.2.b., VIII.1., III., I.5.a., etc.
    # First pass: Roman numerals + dot + numbers + optional letters + dot + space
    cleaned = re.sub(r'^[IVX]+\.\d+[a-z]*\.?\s*', '', name, flags=re.IGNORECASE)
    
    # Second pass: Just Roman numerals + dot + space (for cases like III.)
    cleaned = re.sub(r'^[IVX]+\.?\s*', '', cleaned, flags=re.IGNORECASE)
    
    # Third pass: Remove any remaining leading letters and dots (like "b. " or "a. ")
    cleaned = re.sub(r'^[a-z]\.?\s*', '', cleaned, flags=re.IGNORECASE)
    
    # Clean up extra spaces
    cleaned = cleaned.strip()
    
    # If we cleaned too much, return original
    if not cleaned or len(cleaned) < 3:
        return name
        
    return cleaned

@router.get("/")
@router.get("")
async def get_sectors(db: Session = Depends(get_db)):
    """Get all sectors with cleaned names"""
    try:
        sectors = db.query(Sector).all()
        cleaned_sectors = []
        
        for sector in sectors:
            cleaned_name = clean_sector_name(sector.name)
            cleaned_sectors.append({
                "id": sector.id,
                "name": sector.name,  # Keep original for API queries
                "displayName": cleaned_name,  # Clean name for display
                "description": sector.description
            })
        
        # Sort by display name and remove duplicates
        seen = set()
        unique_sectors = []
        for sector in sorted(cleaned_sectors, key=lambda x: x["displayName"]):
            if sector["displayName"].lower() not in seen:
                seen.add(sector["displayName"].lower())
                unique_sectors.append(sector)
        
        return unique_sectors
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sectors: {str(e)}")