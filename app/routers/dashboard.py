from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models import AidRecord, Country, Donor, Sector, AidStats
from typing import List, Dict, Any

router = APIRouter()

@router.get("/stats", response_model=AidStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get comprehensive dashboard statistics for the UN Aid Intelligence Platform"""
    try:
        # Total aid amount - amounts are in thousands USD, format properly
        total_aid_result = db.query(func.sum(AidRecord.amount)).scalar() or 0
        total_aid_millions = total_aid_result / 1000  # Convert thousands to millions
        if total_aid_millions >= 1000:
            total_aid = f"${total_aid_millions/1000:.2f}B"
        else:
            total_aid = f"${total_aid_millions:.2f}M"
        
        # Countries count
        countries_count = db.query(Country).count()
        
        # Active donors count  
        active_donors = db.query(Donor).count()
        
        # Top recipients
        top_recipients_query = (
            db.query(
                Country.name,
                Country.region,
                func.sum(AidRecord.amount).label('total_amount')
            )
            .join(AidRecord, Country.id == AidRecord.country_id)
            .group_by(Country.id, Country.name, Country.region)
            .order_by(desc('total_amount'))
            .limit(10)
        )
        
        top_recipients = []
        for name, region, amount in top_recipients_query:
            amount_float = float(amount)
            amount_millions = amount_float / 1000  # Convert thousands to millions
            if amount_millions >= 1000:
                formatted_amount = f"${amount_millions/1000:.2f}B"
            else:
                formatted_amount = f"${amount_millions:.2f}M"
            top_recipients.append({
                "name": name,
                "region": region,
                "amount": formatted_amount
            })
        
        # Aid trends by year
        aid_trends_query = (
            db.query(
                AidRecord.year,
                func.sum(AidRecord.amount).label('total_amount')
            )
            .group_by(AidRecord.year)
            .order_by(AidRecord.year)
        )
        
        aid_trends = []
        for year, amount in aid_trends_query:
            aid_trends.append({
                "year": year,
                "amount": float(amount)  # Keep in thousands
            })
        
        # Sector distribution
        sector_dist_query = (
            db.query(
                Sector.name,
                func.sum(AidRecord.amount).label('total_amount')
            )
            .join(AidRecord, Sector.id == AidRecord.sector_id)
            .group_by(Sector.id, Sector.name)
            .order_by(desc('total_amount'))
        )
        
        total_for_percentage = sum(float(amount) for _, amount in sector_dist_query)
        
        sector_distribution = []
        for name, amount in sector_dist_query:
            amount_float = float(amount)
            percentage = (amount_float / total_for_percentage * 100) if total_for_percentage > 0 else 0
            sector_distribution.append({
                "sector": name,
                "amount": amount_float,  # Keep in thousands
                "percentage": percentage
            })
        
        # Top donors analysis
        top_donors_query = (
            db.query(
                Donor.name,
                Donor.donor_type,
                func.sum(AidRecord.amount).label('total_amount')
            )
            .join(AidRecord, Donor.id == AidRecord.donor_id)
            .group_by(Donor.id, Donor.name, Donor.donor_type)
            .order_by(desc('total_amount'))
            .limit(8)
        )
        
        top_donors = []
        for name, donor_type, amount in top_donors_query:
            amount_float = float(amount)
            amount_millions = amount_float / 1000  # Convert thousands to millions
            if amount_millions >= 1000:
                formatted_amount = f"${amount_millions/1000:.2f}B"
            else:
                formatted_amount = f"${amount_millions:.2f}M"
            top_donors.append({
                "name": name,
                "type": donor_type,
                "amount": formatted_amount
            })
        
        # Regional aid distribution
        regional_dist_query = (
            db.query(
                Country.region,
                func.sum(AidRecord.amount).label('total_amount'),
                func.count(func.distinct(Country.id)).label('country_count')
            )
            .join(AidRecord, Country.id == AidRecord.country_id)
            .group_by(Country.region)
            .order_by(desc('total_amount'))
        )
        
        regional_distribution = []
        total_regional_aid = sum(float(amount) for _, amount, _ in regional_dist_query)
        
        for region, amount, country_count in regional_dist_query:
            amount_float = float(amount)
            percentage = (amount_float / total_regional_aid * 100) if total_regional_aid > 0 else 0
            regional_distribution.append({
                "region": region,
                "amount": f"${amount_float/1000:.2f}M",
                "percentage": percentage,
                "countries": country_count
            })

        return AidStats(
            total_aid=total_aid,
            countries_count=countries_count,
            active_donors=active_donors,
            top_recipients=top_recipients,
            aid_trends=aid_trends,
            sector_distribution=sector_distribution,
            top_donors=top_donors,
            regional_distribution=regional_distribution
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")

@router.get("/trends")
async def get_aid_trends(db: Session = Depends(get_db)):
    """Get aid flow trends over time with detailed breakdown"""
    try:
        # Aid trends by year and region
        trends_query = (
            db.query(
                AidRecord.year,
                Country.region,
                func.sum(AidRecord.amount).label('total_amount')
            )
            .join(Country, AidRecord.country_id == Country.id)
            .group_by(AidRecord.year, Country.region)
            .order_by(AidRecord.year, Country.region)
        )
        
        trends_data = {}
        for year, region, amount in trends_query:
            if year not in trends_data:
                trends_data[year] = {}
            trends_data[year][region] = float(amount)
        
        return {"trends_by_region": trends_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trends: {str(e)}")

@router.get("/overview")
async def get_platform_overview(db: Session = Depends(get_db)):
    """Get platform overview with key metrics"""
    try:
        # Basic counts
        total_records = db.query(AidRecord).count()
        year_range = db.query(
            func.min(AidRecord.year).label('min_year'),
            func.max(AidRecord.year).label('max_year')
        ).first()
        
        # Latest data point
        latest_record = (
            db.query(AidRecord)
            .order_by(desc(AidRecord.year), desc(AidRecord.amount))
            .first()
        )
        
        return {
            "platform_name": "UN Aid Intelligence Platform",
            "data_source": "Real UN Aid Data (OECD-DAC)",
            "total_records": total_records,
            "time_period": f"{year_range.min_year}-{year_range.max_year}",
            "latest_update": latest_record.created_at if latest_record else None,
            "data_authenticity": "Official UN/OECD development aid records",
            "features": [
                "AI-powered conversational assistance",
                "Interactive world mapping",
                "Forecasting capabilities", 
                "Real-time analytics dashboard"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overview: {str(e)}")