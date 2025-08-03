from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AidRecord

router = APIRouter()

@router.get("/")
async def get_aid_records(db: Session = Depends(get_db)):
    """Get all aid records"""
    try:
        records = db.query(AidRecord).limit(100).all()  # Limit for performance
        return [
            {
                "id": record.id,
                "country_id": record.country_id,
                "donor_id": record.donor_id,
                "sector_id": record.sector_id,
                "amount": record.amount,
                "year": record.year
            }
            for record in records
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching aid records: {str(e)}")