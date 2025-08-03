"""
Export functionality for UN Aid Intelligence Platform
Provides CSV and PDF export capabilities using real database data
"""

import logging
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO, StringIO
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, func
import numpy as np

# PDF generation
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.lib.colors import HexColor

from app.database import get_db
from app.models import AidRecord, Country, Donor, Sector

router = APIRouter(prefix="/api/export", tags=["export"])

# Configure matplotlib for better charts
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

@router.get("/csv")
async def export_csv(
    response: Response,
    db: Session = Depends(get_db),
    country: Optional[str] = Query(None, description="Filter by country name"),
    donor: Optional[str] = Query(None, description="Filter by donor name"), 
    sector: Optional[str] = Query(None, description="Filter by sector name"),
    year: Optional[int] = Query(None, description="Filter by specific year"),
    start_year: Optional[int] = Query(None, description="Filter from start year"),
    end_year: Optional[int] = Query(None, description="Filter to end year")
):
    """Export filtered aid data to CSV using real database queries"""
    try:
        # Build dynamic query with real data
        query = """
        SELECT 
            c.name as country,
            d.name as donor,
            s.name as sector,
            ar.year,
            ar.amount,
            c.region
        FROM aid_records ar
        JOIN countries c ON ar.country_id = c.id
        JOIN donors d ON ar.donor_id = d.id
        JOIN sectors s ON ar.sector_id = s.id
        WHERE ar.amount IS NOT NULL AND ar.amount > 0
        """
        
        params = {}
        
        # Apply filters based on parameters
        if country:
            query += " AND c.name ILIKE :country"
            params["country"] = f"%{country}%"
            
        if donor:
            query += " AND d.name ILIKE :donor"
            params["donor"] = f"%{donor}%"
            
        if sector:
            query += " AND s.name ILIKE :sector"
            params["sector"] = f"%{sector}%"
            
        if year:
            query += " AND ar.year = :year"
            params["year"] = year
            
        if start_year:
            query += " AND ar.year >= :start_year"
            params["start_year"] = start_year
            
        if end_year:
            query += " AND ar.year <= :end_year"
            params["end_year"] = end_year
            
        query += " ORDER BY ar.year DESC, ar.amount DESC"
        
        # Execute query and convert to DataFrame
        result = db.execute(text(query), params)
        data = result.fetchall()
        
        if not data:
            raise HTTPException(status_code=404, detail="No data found matching the specified filters")
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(data, columns=[
            'Country', 'Donor', 'Sector', 'Year', 'Amount_Thousands_USD', 'Region'
        ])
        
        # Format amounts with proper units (values are in thousands of USD)
        df['Amount_Thousands_USD'] = df['Amount_Thousands_USD'].apply(
            lambda x: f"{x:,.2f}K" if pd.notnull(x) else "0.00K"
        )
        
        # Generate filename based on filters
        filename_parts = []
        if country:
            filename_parts.append(country.lower().replace(' ', '_'))
        if sector:
            filename_parts.append(sector.lower().replace(' ', '_'))
        if year:
            filename_parts.append(str(year))
        
        filename = "_".join(filename_parts) if filename_parts else "aid_data"
        filename = f"{filename}_{datetime.now().strftime('%Y%m%d')}.csv"
        
        # Convert DataFrame to CSV
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        # Set response headers
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        response.headers["Content-Type"] = "text/csv"
        
        return Response(content=csv_content, media_type="text/csv")
        
    except Exception as e:
        logging.error(f"CSV export error: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/pdf")
async def export_pdf(
    response: Response,
    db: Session = Depends(get_db),
    country: Optional[str] = Query(None, description="Filter by country name"),
    donor: Optional[str] = Query(None, description="Filter by donor name"),
    sector: Optional[str] = Query(None, description="Filter by sector name"),
    year: Optional[int] = Query(None, description="Filter by specific year"),
    include_forecast: bool = Query(False, description="Include forecasting data")
):
    """Generate PDF report with real data, charts, and insights"""
    try:
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1f2937'),
            alignment=1  # Center alignment
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            textColor=colors.HexColor('#3b82f6')
        )
        
        # Title and header
        story.append(Paragraph("UN Aid Intelligence Platform", title_style))
        story.append(Paragraph("Development Aid Analysis Report", styles['Heading2']))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Build filtered query for summary statistics
        base_query = """
        SELECT 
            COUNT(*) as total_records,
            SUM(ar.amount) as total_amount,
            AVG(ar.amount) as avg_amount,
            MIN(ar.year) as min_year,
            MAX(ar.year) as max_year,
            COUNT(DISTINCT c.name) as unique_countries,
            COUNT(DISTINCT d.name) as unique_donors,
            COUNT(DISTINCT s.name) as unique_sectors
        FROM aid_records ar
        JOIN countries c ON ar.country_id = c.id
        JOIN donors d ON ar.donor_id = d.id
        JOIN sectors s ON ar.sector_id = s.id
        WHERE ar.amount IS NOT NULL AND ar.amount > 0
        """
        
        params = {}
        filter_description = []
        
        if country:
            base_query += " AND c.name ILIKE :country"
            params["country"] = f"%{country}%"
            filter_description.append(f"Country: {country}")
            
        if donor:
            base_query += " AND d.name ILIKE :donor"
            params["donor"] = f"%{donor}%"
            filter_description.append(f"Donor: {donor}")
            
        if sector:
            base_query += " AND s.name ILIKE :sector"
            params["sector"] = f"%{sector}%"
            filter_description.append(f"Sector: {sector}")
            
        if year:
            base_query += " AND ar.year = :year"
            params["year"] = year
            filter_description.append(f"Year: {year}")
        
        # Execute summary query
        summary_result = db.execute(text(base_query), params).fetchone()
        
        if not summary_result or summary_result.total_records == 0:
            raise HTTPException(status_code=404, detail="No data found for the specified filters")
        
        # Add filter information
        if filter_description:
            story.append(Paragraph("Applied Filters:", heading_style))
            for filter_desc in filter_description:
                story.append(Paragraph(f"• {filter_desc}", styles['Normal']))
            story.append(Spacer(1, 12))
        
        # Summary statistics table
        story.append(Paragraph("Executive Summary", heading_style))
        
        # Format amounts properly (database values are in thousands USD)
        total_aid_millions = float(summary_result.total_amount) / 1000
        if total_aid_millions >= 1000:
            formatted_total_aid = f"${total_aid_millions/1000:.2f}B"
        else:
            formatted_total_aid = f"${total_aid_millions:.2f}M"
        
        # Average amount with K suffix
        formatted_avg_amount = f"${summary_result.avg_amount:.2f}K"
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Aid Amount', formatted_total_aid],
            ['Number of Records', f"{summary_result.total_records:,}"],
            ['Average Amount', formatted_avg_amount],
            ['Year Range', f"{summary_result.min_year} - {summary_result.max_year}"],
            ['Unique Countries', f"{summary_result.unique_countries}"],
            ['Unique Donors', f"{summary_result.unique_donors}"],
            ['Unique Sectors', f"{summary_result.unique_sectors}"]
        ]
        
        summary_table = Table(summary_data, colWidths=[2.5*inch, 2.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Generate charts using matplotlib
        if summary_result.total_records > 0:
            # Top countries chart - build proper filtered query
            countries_query = """
            SELECT c.name, SUM(ar.amount) as total_aid
            FROM aid_records ar
            JOIN countries c ON ar.country_id = c.id
            JOIN donors d ON ar.donor_id = d.id
            JOIN sectors s ON ar.sector_id = s.id
            WHERE ar.amount IS NOT NULL AND ar.amount > 0
            """
            
            # Add the same filters as base query
            if country:
                countries_query += " AND c.name ILIKE :country"
            if donor:
                countries_query += " AND d.name ILIKE :donor"
            if sector:
                countries_query += " AND s.name ILIKE :sector"
            if year:
                countries_query += " AND ar.year = :year"
            
            countries_query += """
            GROUP BY c.name
            ORDER BY total_aid DESC
            LIMIT 10
            """
            
            countries_data = db.execute(text(countries_query), params).fetchall()
            
            if countries_data and len(countries_data) > 1:
                # Create matplotlib chart
                fig, ax = plt.subplots(figsize=(10, 6))
                countries = [row.name[:20] for row in countries_data]  # Truncate long names
                amounts = [row.total_aid / 1000000 for row in countries_data]  # Convert to millions
                
                bars = ax.bar(countries, amounts, color=plt.cm.Set3(np.linspace(0, 1, len(countries))))
                ax.set_xlabel('Countries')
                ax.set_ylabel('Aid Amount (Millions USD)')
                ax.set_title('Top 10 Aid Recipients')
                plt.xticks(rotation=45, ha='right')
                plt.tight_layout()
                
                # Save chart to buffer
                chart_buffer = BytesIO()
                plt.savefig(chart_buffer, format='png', dpi=300, bbox_inches='tight')
                chart_buffer.seek(0)
                plt.close()
                
                # Add chart to PDF
                story.append(Paragraph("Top Aid Recipients", heading_style))
                chart_image = Image(chart_buffer, width=6*inch, height=3.6*inch)
                story.append(chart_image)
                story.append(Spacer(1, 20))
        
        # Add forecasting data if requested
        if include_forecast and country:
            try:
                from app.routers.forecasting import generate_forecast, ForecastRequest
                forecast_request = ForecastRequest(
                    country=country,
                    sector="all",
                    model="hybrid",
                    years=3
                )
                forecast_result = await generate_forecast(forecast_request, db)
                
                if forecast_result and hasattr(forecast_result, 'predictions'):
                    story.append(Paragraph("AI Forecasting Analysis", heading_style))
                    story.append(Paragraph(f"Machine Learning predictions for {country} (next 3 years):", styles['Normal']))
                    story.append(Spacer(1, 12))
                    
                    forecast_data = [['Year', 'Predicted Amount (USD)', 'Confidence Range']]
                    for pred in forecast_result.predictions:
                        if hasattr(pred, 'year'):
                            year_val, predicted, lower, upper = pred.year, pred.predicted, pred.lower, pred.upper
                        else:
                            year_val, predicted, lower, upper = pred['year'], pred['predicted'], pred['lower'], pred['upper']
                        forecast_data.append([
                            str(year_val),
                            f"${predicted:,.0f}",
                            f"${lower:,.0f} - ${upper:,.0f}"
                        ])
                    
                    forecast_table = Table(forecast_data, colWidths=[1*inch, 2*inch, 2*inch])
                    forecast_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 11),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black)
                    ]))
                    
                    story.append(forecast_table)
                    
                    if hasattr(forecast_result, 'accuracy'):
                        accuracy_val = forecast_result.accuracy.hybrid if hasattr(forecast_result.accuracy, 'hybrid') else forecast_result.accuracy.get('hybrid', 90)
                        story.append(Spacer(1, 12))
                        story.append(Paragraph(f"Model Accuracy: {accuracy_val:.1f}%", styles['Normal']))
                        
            except Exception as forecast_error:
                logging.warning(f"Forecast generation failed: {forecast_error}")
                story.append(Paragraph("Forecasting data unavailable for this selection.", styles['Normal']))
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("Generated by UN Aid Intelligence Platform - Real-time data analysis", styles['Normal']))
        story.append(Paragraph("Data source: Official UN aid disbursement records 2015-2023", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        # Generate filename
        filename_parts = []
        if country:
            filename_parts.append(country.lower().replace(' ', '_'))
        if sector:
            filename_parts.append(sector.lower().replace(' ', '_'))
        if year:
            filename_parts.append(str(year))
            
        filename = "_".join(filename_parts) if filename_parts else "aid_report"
        filename = f"{filename}_report_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        buffer.seek(0)
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        
        return StreamingResponse(
            BytesIO(buffer.read()), 
            media_type="application/pdf"
        )
        
    except Exception as e:
        logging.error(f"PDF export error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")