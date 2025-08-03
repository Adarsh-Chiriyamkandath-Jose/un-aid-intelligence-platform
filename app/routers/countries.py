from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Country

router = APIRouter()

@router.get("/")
@router.get("")
async def get_countries(db: Session = Depends(get_db)):
    """Get all countries"""
    try:
        countries = db.query(Country).all()
        return [
            {
                "id": country.id,
                "name": country.name,
                "iso_code": country.iso_code,
                "region": country.region,
                "latitude": country.latitude,
                "longitude": country.longitude
            }
            for country in countries
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching countries: {str(e)}")