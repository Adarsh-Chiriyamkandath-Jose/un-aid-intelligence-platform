from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Donor

router = APIRouter()

@router.get("/")
async def get_donors(db: Session = Depends(get_db)):
    """Get all donors"""
    try:
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
        raise HTTPException(status_code=500, detail=f"Error fetching donors: {str(e)}")