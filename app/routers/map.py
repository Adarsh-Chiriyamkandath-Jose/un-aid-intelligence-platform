from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models import Country, AidRecord, Donor, Sector
from typing import Optional

router = APIRouter()

@router.get("/countries")
async def get_map_countries(
    year: Optional[int] = Query(None, description="Filter by specific year"),
    sector: Optional[str] = Query(None, description="Filter by sector name"),
    donor: Optional[str] = Query(None, description="Filter by donor name"),
    db: Session = Depends(get_db)
):
    """Get countries with aid data for map visualization"""
    try:
        # Base query for countries with aid data
        query = (
            db.query(
                Country.id,
                Country.name,
                Country.iso_code,
                Country.region,
                Country.latitude,
                Country.longitude,
                func.sum(AidRecord.amount).label('total_aid'),
                func.count(AidRecord.id).label('aid_count')
            )
            .join(AidRecord, Country.id == AidRecord.country_id)
        )
        
        # Apply filters
        if year:
            query = query.filter(AidRecord.year == year)
            
        if sector:
            query = query.join(Sector, AidRecord.sector_id == Sector.id).filter(
                Sector.name.ilike(f"%{sector}%")
            )
            
        if donor:
            query = query.join(Donor, AidRecord.donor_id == Donor.id).filter(
                Donor.name.ilike(f"%{donor}%")
            )
        
        # Group by country and order by total aid
        query = query.group_by(
            Country.id, Country.name, Country.iso_code, 
            Country.region, Country.latitude, Country.longitude
        ).order_by(desc('total_aid'))
        
        results = query.all()
        
        # Calculate aid intensity (normalized score 0-10)
        if results:
            max_aid = max(float(r.total_aid) for r in results)
            min_aid = min(float(r.total_aid) for r in results)
            aid_range = max_aid - min_aid if max_aid > min_aid else 1
        
        map_data = []
        for result in results:
            total_aid_float = float(result.total_aid)
            aid_intensity = ((total_aid_float - min_aid) / aid_range) * 10 if results else 0
            
            map_data.append({
                "id": result.id,
                "name": result.name,
                "isoCode": result.iso_code,
                "region": result.region,
                "latitude": str(result.latitude) if result.latitude else "0",
                "longitude": str(result.longitude) if result.longitude else "0",
                "totalAid": total_aid_float,
                "aidIntensity": round(aid_intensity, 1),
                "aidCount": result.aid_count
            })
        
        return map_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching map data: {str(e)}")

@router.get("/country/{country_id}")
async def get_country_details(country_id: str, db: Session = Depends(get_db)):
    """Get detailed aid information for a specific country"""
    try:
        # Get country basic info
        country = db.query(Country).filter(Country.id == country_id).first()
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")
        
        # Get total aid received
        total_aid = db.query(func.sum(AidRecord.amount)).filter(
            AidRecord.country_id == country_id
        ).scalar() or 0
        
        # Get top donors for this country
        top_donors = (
            db.query(
                Donor.name,
                func.sum(AidRecord.amount).label('total_amount')
            )
            .join(AidRecord, Donor.id == AidRecord.donor_id)
            .filter(AidRecord.country_id == country_id)
            .group_by(Donor.id, Donor.name)
            .order_by(desc('total_amount'))
            .limit(5)
            .all()
        )
        
        # Get top sectors for this country
        top_sectors = (
            db.query(
                Sector.name,
                func.sum(AidRecord.amount).label('total_amount')
            )
            .join(AidRecord, Sector.id == AidRecord.sector_id)
            .filter(AidRecord.country_id == country_id)
            .group_by(Sector.id, Sector.name)
            .order_by(desc('total_amount'))
            .limit(5)
            .all()
        )
        
        # Get yearly trends for this country
        yearly_trends = (
            db.query(
                AidRecord.year,
                func.sum(AidRecord.amount).label('total_amount')
            )
            .filter(AidRecord.country_id == country_id)
            .group_by(AidRecord.year)
            .order_by(AidRecord.year)
            .all()
        )
        
        return {
            "country": {
                "id": country.id,
                "name": country.name,
                "iso_code": country.iso_code,
                "region": country.region,
                "latitude": country.latitude,
                "longitude": country.longitude
            },
            "total_aid": f"${float(total_aid) / 1e3:.1f}B",
            "top_donors": [
                {"name": name, "amount": f"${float(amount) / 1e3:.1f}B"}
                for name, amount in top_donors
            ],
            "top_sectors": [
                {"name": name, "amount": f"${float(amount) / 1e3:.1f}B"}
                for name, amount in top_sectors
            ],
            "yearly_trends": [
                {"year": year, "amount": float(amount) / 1e9}
                for year, amount in yearly_trends
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching country details: {str(e)}")