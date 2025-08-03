from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from app.database import get_db
from app.models import ChatMessageCreate, ChatResponse, ChatMessageResponse, AidRecord, Country, Donor, Sector
from typing import List, Optional
from pydantic import BaseModel
import openai
import os
import uuid
from datetime import datetime
import re

router = APIRouter()

# Store to simulate chat history (in production, use database)
chat_history = {}

# Alternative request format for frontend compatibility
class ChatRequest(BaseModel):
    message: str
    sessionId: str
    role: Optional[str] = "user"

async def get_data_context_for_query(user_query: str, db: Session) -> str:
    """Get relevant data context based on user's query"""
    
    try:
        query_lower = user_query.lower()
        context_parts = []
        
        # Basic statistics
        total_records = db.query(AidRecord).count()
        context_parts.append(f"Total aid records: {total_records:,}")
        
        # For 2023 maximum recipient queries, always provide top recipients
        if re.search(r'\b(2023|maximum|max|most|highest|top)\b', query_lower) and re.search(r'\b(recipient|receive|country|countries)\b', query_lower):
            top_2023_recipients = db.query(
                Country.name,
                func.sum(AidRecord.amount).label('total_aid'),
                func.count().label('record_count')
            ).join(AidRecord).filter(
                AidRecord.year == 2023,
                AidRecord.amount.isnot(None),
                AidRecord.amount > 0
            ).group_by(Country.name).order_by(func.sum(AidRecord.amount).desc()).limit(5).all()
            
            if top_2023_recipients:
                context_parts.append("\nTop 5 aid recipients in 2023:")
                for recipient in top_2023_recipients:
                    context_parts.append(f"- {recipient.name}: ${recipient.total_aid:,.2f} ({recipient.record_count:,} records)")
                context_parts.append(f"\nMAXIMUM recipient in 2023: {top_2023_recipients[0].name} with ${top_2023_recipients[0].total_aid:,.2f}")
        
        # Check for forecast/prediction queries
        if re.search(r'\b(forecast|predict|2024|2025|2026|future|projection)\b', query_lower):
            specific_countries = re.findall(r'\b(india|china|bangladesh|pakistan|afghanistan|kenya|tanzania|uganda|ethiopia|nigeria|brazil|indonesia|philippines)\b', query_lower)
            
            if specific_countries:
                # Use the actual forecasting API instead of making predictions
                for country_name in specific_countries:
                    # Import the forecasting function
                    from app.routers.forecasting import generate_forecast, ForecastRequest
                    
                    try:
                        forecast_request = ForecastRequest(
                            country=country_name.capitalize(),
                            sector="all",
                            model="hybrid",
                            years=3
                        )
                        forecast_result = await generate_forecast(forecast_request, db)
                        
                        if forecast_result and hasattr(forecast_result, 'predictions') and forecast_result.predictions:
                            context_parts.append(f"\n{country_name.capitalize()} AI Forecasting (using actual ML models):")
                            for pred in forecast_result.predictions[-3:]:  # Last 3 predictions
                                # Handle both dict and object formats
                                if hasattr(pred, 'year'):
                                    year, predicted = pred.year, pred.predicted
                                else:
                                    year, predicted = pred['year'], pred['predicted']
                                context_parts.append(f"- {year}: ${predicted:,.2f}")
                            
                            # Add model performance if available
                            if hasattr(forecast_result, 'accuracy') and forecast_result.accuracy:
                                if hasattr(forecast_result.accuracy, 'hybrid'):
                                    accuracy = forecast_result.accuracy.hybrid
                                else:
                                    accuracy = forecast_result.accuracy.get('hybrid', 90)
                                context_parts.append(f"Model: Hybrid ML with {accuracy:.1f}% accuracy")
                        else:
                            context_parts.append(f"\nNote: No forecast predictions available for {country_name.capitalize()}.")
                    
                    except Exception as forecast_error:
                        # Fallback to historical data if forecasting fails
                        import logging
                        logging.error(f"Forecasting failed for {country_name}: {forecast_error}")
                        context_parts.append(f"\nNote: Forecasting service unavailable for {country_name.capitalize()}. Using historical data only.")
        
        # Handle Quick Query patterns with specific data
        if re.search(r'\b(show.*aid.*trends.*africa|aid.*trends.*africa)\b', query_lower):
            # Get Africa aid trends data
            africa_countries = ['Nigeria', 'Ethiopia', 'Kenya', 'Tanzania', 'Uganda', 'Ghana', 'Senegal', 'Mali', 'Niger', 'Chad']
            africa_data = db.query(
                AidRecord.year,
                func.sum(AidRecord.amount).label('total_aid')
            ).join(Country).filter(
                Country.name.in_(africa_countries),
                AidRecord.year >= 2020
            ).group_by(AidRecord.year).order_by(AidRecord.year.desc()).all()
            
            if africa_data:
                context_parts.append("\nAfrica Aid Trends (2020-2023):")
                for year_data in africa_data:
                    context_parts.append(f"- {year_data.year}: ${year_data.total_aid:,.0f}")
        
        elif re.search(r'\b(compare.*health.*education|health.*vs.*education|health.*education.*funding)\b', query_lower):
            # Get health vs education sector comparison
            health_data = db.query(func.sum(AidRecord.amount)).join(Sector).filter(
                Sector.name.ilike('%health%')
            ).scalar() or 0
            
            education_data = db.query(func.sum(AidRecord.amount)).join(Sector).filter(
                Sector.name.ilike('%education%')
            ).scalar() or 0
            
            context_parts.append(f"\nHealth vs Education Funding Comparison:")
            context_parts.append(f"- Health sector: ${health_data:,.0f}")
            context_parts.append(f"- Education sector: ${education_data:,.0f}")
            context_parts.append(f"- Ratio: {health_data/education_data:.2f}:1 (Health:Education)" if education_data > 0 else "")
        
        elif re.search(r'(top.*donors.*region|donors.*by.*region|donors.*region|regional.*donors)', query_lower):
            # Get actual regional donor analysis using raw SQL query for reliability
            try:
                result = db.execute(text("""
                    SELECT 
                        d.name as donor_name,
                        c.region,
                        SUM(ar.amount) as total_amount,
                        COUNT(*) as record_count
                    FROM aid_records ar
                    JOIN donors d ON ar.donor_id = d.id
                    JOIN countries c ON ar.country_id = c.id
                    WHERE c.region IS NOT NULL
                    GROUP BY d.name, c.region
                    ORDER BY total_amount DESC
                    LIMIT 15
                """)).fetchall()
                
                if result:
                    context_parts.append("\nTop Donors by Region (Real UN Data):")
                    
                    # Group by region and show top donors for each
                    regions_processed = set()
                    for row in result:
                        donor_name, region, total_amount, record_count = row
                        if region not in regions_processed:
                            regions_processed.add(region)
                            context_parts.append(f"\n{region}:")
                            context_parts.append(f"- {donor_name}: ${total_amount:,.0f} ({record_count:,} records)")
                            
                            # Add second top donor for this region
                            for other_row in result:
                                other_donor, other_region, other_amount, other_count = other_row
                                if (other_region == region and other_donor != donor_name):
                                    context_parts.append(f"- {other_donor}: ${other_amount:,.0f} ({other_count:,} records)")
                                    break
                    
                    # Add summary note about the data
                    context_parts.append(f"\nTotal data points analyzed: {len(result)} donor-region combinations")
            except Exception as e:
                # Log the error for debugging
                import logging
                logging.error(f"Regional donor query failed: {e}")
                
                # Fallback to simple overall top donors if regional query fails
                top_donors = db.query(
                    Donor.name,
                    func.sum(AidRecord.amount).label('total_aid'),
                    func.count().label('record_count')
                ).join(AidRecord).group_by(Donor.name).order_by(func.sum(AidRecord.amount).desc()).limit(10).all()
                
                if top_donors:
                    context_parts.append("\nTop 10 Donors by Total Aid:")
                    for i, donor in enumerate(top_donors, 1):
                        context_parts.append(f"{i}. {donor.name}: ${donor.total_aid:,.0f} ({donor.record_count:,} records)")
        
        elif re.search(r'\b(forecast.*aid.*2025|2025.*forecast|forecast.*all.*countries|all.*countries.*forecast)\b', query_lower):
            # Enhanced forecasting for all major recipient countries using real-time ML API
            context_parts.append("\n2025 Aid Forecasts (using real-time ML models):")
            
            # Get top 14 recipient countries from actual data
            top_countries_query = db.query(
                Country.name,
                func.sum(AidRecord.amount).label('total_aid')
            ).join(AidRecord).group_by(Country.name).order_by(func.sum(AidRecord.amount).desc()).limit(14).all()
            
            forecast_countries = [country.name for country in top_countries_query] if top_countries_query else [
                'India', 'Bangladesh', 'Indonesia', 'Philippines', 'Pakistan', 'Kenya', 'Ethiopia', 'Nigeria', 
                'Nepal', 'Myanmar', 'Ghana', 'Uzbekistan', 'Mongolia', 'Sri Lanka'
            ]
            
            # Use real-time forecasting API for all countries
            from app.routers.forecasting import generate_forecast, ForecastRequest
            successful_forecasts = 0
            
            for country_name in forecast_countries[:10]:  # Limit to avoid timeout
                try:
                    forecast_request = ForecastRequest(
                        country=country_name,
                        sector="all",
                        model="hybrid",
                        years=3
                    )
                    forecast_result = await generate_forecast(forecast_request, db)
                    
                    if forecast_result and hasattr(forecast_result, 'predictions') and forecast_result.predictions:
                        # Get 2025 prediction
                        pred_2025 = next((p for p in forecast_result.predictions if (hasattr(p, 'year') and p.year == 2025) or (isinstance(p, dict) and p.get('year') == 2025)), None)
                        if pred_2025:
                            predicted_value = pred_2025.predicted if hasattr(pred_2025, 'predicted') else pred_2025['predicted']
                            context_parts.append(f"- {country_name}: ${predicted_value:,.0f}")
                            successful_forecasts += 1
                except Exception as e:
                    logging.warning(f"Forecast failed for {country_name}: {e}")
                    continue
            
            if successful_forecasts > 0:
                context_parts.append(f"\nGenerated real-time forecasts for {successful_forecasts} countries using hybrid ML models.")
        
        # Check for specific country mentions (like India)
        specific_countries = re.findall(r'\b(india|china|bangladesh|pakistan|afghanistan|kenya|tanzania|uganda|ethiopia|nigeria|brazil|indonesia|philippines)\b', query_lower)
        
        # If query mentions specific years
        if re.search(r'\b(20\d{2}|recent|latest|current)\b', query_lower):
            recent_data = db.query(
                AidRecord.year,
                func.sum(AidRecord.amount).label('total_aid'),
                func.count().label('record_count')
            ).filter(
                AidRecord.year >= 2020
            ).group_by(AidRecord.year).order_by(AidRecord.year.desc()).limit(4).all()
            
            if recent_data:
                context_parts.append("\nRecent aid disbursements by year:")
                for year_data in recent_data:
                    if year_data.total_aid:
                        context_parts.append(f"- {year_data.year}: ${year_data.total_aid:,.0f} ({year_data.record_count:,} records)")
        
        # If specific countries mentioned, get their data
        if specific_countries:
            for country_name in specific_countries:
                country_data = db.query(
                    AidRecord.year,
                    func.sum(AidRecord.amount).label('total_aid'),
                    func.count().label('record_count')
                ).join(Country).filter(
                    Country.name.ilike(f'%{country_name}%'),
                    AidRecord.year >= 2020
                ).group_by(AidRecord.year).order_by(AidRecord.year.desc()).limit(4).all()
                
                if country_data:
                    context_parts.append(f"\n{country_name.capitalize()} aid disbursements by year:")
                    for year_data in country_data:
                        if year_data.total_aid:
                            context_parts.append(f"- {year_data.year}: ${year_data.total_aid:,.0f} ({year_data.record_count:,} records)")
        
        # If query mentions donors
        if re.search(r'\b(donor|give|giving)\b', query_lower):
            top_donors = db.query(
                Donor.name,
                func.sum(AidRecord.amount).label('total_aid')
            ).join(AidRecord).filter(
                AidRecord.amount.isnot(None),
                AidRecord.amount > 0
            ).group_by(Donor.name).order_by(func.sum(AidRecord.amount).desc()).limit(5).all()
            
            if top_donors:
                context_parts.append("\nTop 5 aid donors by total disbursement:")
                for donor in top_donors:
                    context_parts.append(f"- {donor.name}: ${donor.total_aid:,.0f}")
        
        # If query mentions recipients
        if re.search(r'\b(recipient|receive|receiving|countries)\b', query_lower):
            top_recipients = db.query(
                Country.name,
                func.sum(AidRecord.amount).label('total_aid')
            ).join(AidRecord).filter(
                AidRecord.amount.isnot(None),
                AidRecord.amount > 0
            ).group_by(Country.name).order_by(func.sum(AidRecord.amount).desc()).limit(5).all()
            
            if top_recipients:
                context_parts.append("\nTop 5 aid recipients by total disbursement:")
                for recipient in top_recipients:
                    context_parts.append(f"- {recipient.name}: ${recipient.total_aid:,.0f}")
        
        # If query mentions sectors
        if re.search(r'\b(sector|health|education|infrastructure|economic|social)\b', query_lower):
            top_sectors = db.query(
                Sector.name,
                func.sum(AidRecord.amount).label('total_aid')
            ).join(AidRecord).filter(
                AidRecord.amount.isnot(None),
                AidRecord.amount > 0
            ).group_by(Sector.name).order_by(func.sum(AidRecord.amount).desc()).limit(5).all()
            
            if top_sectors:
                context_parts.append("\nTop 5 sectors by total disbursement:")
                for sector in top_sectors:
                    context_parts.append(f"- {sector.name}: ${sector.total_aid:,.0f}")
        
        # Overall summary if no specific context found
        if not context_parts or len(context_parts) == 1:
            summary = db.query(
                func.sum(AidRecord.amount).label('total_disbursed'),
                func.count(func.distinct(Donor.name)).label('unique_donors'),
                func.count(func.distinct(Country.name)).label('unique_recipients'),
                func.min(AidRecord.year).label('min_year'),
                func.max(AidRecord.year).label('max_year')
            ).join(Donor).join(Country).first()
            
            if summary and summary.total_disbursed:
                context_parts.append(f"\nDataset Summary:")
                context_parts.append(f"- Total aid disbursed: ${summary.total_disbursed:,.0f}")
                context_parts.append(f"- Unique donors: {summary.unique_donors}")
                context_parts.append(f"- Unique recipients: {summary.unique_recipients}")
                context_parts.append(f"- Year range: {summary.min_year}-{summary.max_year}")
        
        return "\n".join(context_parts) if context_parts else "No specific data context available"
        
    except Exception as e:
        return f"Error retrieving data context: {str(e)}"

@router.post("/message", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    # Convert frontend format to backend format
    message = ChatMessageCreate(
        session_id=request.sessionId,
        role=request.role,
        content=request.message,
        message_metadata={}
    )
    try:
        # Initialize session history if not exists
        if message.session_id not in chat_history:
            chat_history[message.session_id] = []
        
        # Add user message to history
        user_msg = {
            "id": str(uuid.uuid4()),
            "session_id": message.session_id,
            "role": "user",
            "content": message.content,
            "message_metadata": message.message_metadata or {},
            "created_at": datetime.now()
        }
        chat_history[message.session_id].append(user_msg)
        
        # Check if OpenAI API key is available
        api_key = os.getenv("OPENAI_API_KEY")
        response = None
        
        if not api_key:
            ai_response = "I need an OpenAI API key to provide AI assistance. Please configure the OPENAI_API_KEY environment variable."
        else:
            # Use OpenAI API for chat completion
            client = openai.OpenAI(api_key=api_key)
            
            # Get relevant data context for the user's question
            data_context = await get_data_context_for_query(message.content, db)
            
            # Build conversation history for context with proper typing
            from openai.types.chat import ChatCompletionMessageParam
            
            system_prompt = f"""You are an AI assistant for the UN Aid Intelligence Platform. You have access to real UN aid data from 2015-2023 with 478,371 records covering 146 donors and multiple recipient regions.

IMPORTANT: Base your responses on the actual data provided below, not general knowledge.

Current Data Context:
{data_context}

When answering questions:
1. Use specific numbers, trends, and insights from the actual data
2. Reference real donor names, recipient countries, and sectors from the dataset
3. Provide concrete examples and statistics
4. If asked about trends, mention specific years and values
5. For future predictions (2024+), use ONLY the forecasting data provided above from our ML models
6. Never make your own predictions - always use the AI Forecasting API results provided
7. Always cite that your analysis is based on "UN aid data from 2015-2023" and forecasts from "AI ML models"

Help users analyze this real international development aid data with detailed, data-driven insights."""
            
            messages: List[ChatCompletionMessageParam] = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add recent conversation history (last 10 messages for context)
            recent_msgs = chat_history[message.session_id][-10:]
            for msg in recent_msgs:
                if msg["role"] == "user":
                    messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "assistant":
                    messages.append({"role": "assistant", "content": msg["content"]})
            
            response = client.chat.completions.create(
                model="gpt-4o",  # Latest OpenAI model
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content or "No response available"
        
        # Add AI response to history
        ai_msg = {
            "id": str(uuid.uuid4()),
            "session_id": message.session_id,
            "role": "assistant",
            "content": ai_response,
            "message_metadata": {"model": "gpt-4o", "tokens": response.usage.total_tokens if 'response' in locals() and response.usage else 0},
            "created_at": datetime.now()
        }
        chat_history[message.session_id].append(ai_msg)
        
        return ChatResponse(
            response=ai_response,
            session_id=message.session_id,
            message_metadata=ai_msg["message_metadata"]
        )
        
    except Exception as e:
        error_response = f"I'm experiencing technical difficulties. Error: {str(e)}"
        
        # Add error message to history
        error_msg = {
            "id": str(uuid.uuid4()),
            "session_id": message.session_id,
            "role": "assistant",
            "content": error_response,
            "message_metadata": {"error": True, "error_details": str(e)},
            "created_at": datetime.now()
        }
        
        if message.session_id not in chat_history:
            chat_history[message.session_id] = []
        chat_history[message.session_id].append(error_msg)
        
        return ChatResponse(
            response=error_response,
            session_id=message.session_id,
            message_metadata={"error": True}
        )

@router.get("/history/{session_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(session_id: str):
    """Get chat history for a specific session"""
    if session_id not in chat_history:
        return []
    
    return [
        ChatMessageResponse(
            id=msg["id"],
            session_id=msg["session_id"],
            role=msg["role"],
            content=msg["content"],
            message_metadata=msg["message_metadata"],
            created_at=msg["created_at"]
        )
        for msg in chat_history[session_id]
    ]

@router.delete("/history/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for a specific session"""
    if session_id in chat_history:
        del chat_history[session_id]
    return {"message": f"Chat history cleared for session {session_id}"}

@router.get("/sessions")
async def list_chat_sessions():
    """List all active chat sessions"""
    return {"sessions": list(chat_history.keys()), "count": len(chat_history)}