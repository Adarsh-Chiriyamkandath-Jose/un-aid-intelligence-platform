from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

Base = declarative_base()

# SQLAlchemy Models
class Country(Base):
    __tablename__ = "countries"
    
    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    iso_code = Column(String(3), unique=True, nullable=False)
    region = Column(String, nullable=False)
    sub_region = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    population = Column(Integer)
    gdp_per_capita = Column(Float)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    aid_records = relationship("AidRecord", back_populates="country")
    forecasts = relationship("Forecast", back_populates="country")

class Donor(Base):
    __tablename__ = "donors"
    
    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    donor_type = Column(String, nullable=False)  # bilateral, multilateral, private
    country = Column(String)
    description = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    aid_records = relationship("AidRecord", back_populates="donor")

class Sector(Base):
    __tablename__ = "sectors"
    
    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    parent_sector = Column(String)
    description = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    aid_records = relationship("AidRecord", back_populates="sector")
    forecasts = relationship("Forecast", back_populates="sector")

class AidRecord(Base):
    __tablename__ = "aid_records"
    
    id = Column(String, primary_key=True)
    country_id = Column(String, ForeignKey("countries.id"), nullable=False)
    donor_id = Column(String, ForeignKey("donors.id"), nullable=False)
    sector_id = Column(String, ForeignKey("sectors.id"), nullable=False)
    year = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    project_title = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    country = relationship("Country", back_populates="aid_records")
    donor = relationship("Donor", back_populates="aid_records")
    sector = relationship("Sector", back_populates="aid_records")

class Forecast(Base):
    __tablename__ = "forecasts"
    
    id = Column(String, primary_key=True)
    country_id = Column(String, ForeignKey("countries.id"), nullable=False)
    sector_id = Column(String, ForeignKey("sectors.id"))
    year = Column(Integer, nullable=False)
    predicted_amount = Column(Float, nullable=False)
    confidence_interval = Column(JSON)  # {lower: float, upper: float}
    model = Column(String, nullable=False)  # prophet, xgboost, hybrid
    features = Column(JSON)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    country = relationship("Country", back_populates="forecasts")
    sector = relationship("Sector", back_populates="forecasts")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False)
    role = Column(String, nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    message_metadata = Column(JSON)
    created_at = Column(DateTime, default=func.now())

# Pydantic Schemas
class CountryBase(BaseModel):
    name: str
    iso_code: str
    region: str
    sub_region: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    population: Optional[int] = None
    gdp_per_capita: Optional[float] = None

class CountryCreate(CountryBase):
    pass

class CountryResponse(CountryBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class DonorBase(BaseModel):
    name: str
    donor_type: str
    country: Optional[str] = None
    description: Optional[str] = None

class DonorCreate(DonorBase):
    pass

class DonorResponse(DonorBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SectorBase(BaseModel):
    name: str
    code: str
    parent_sector: Optional[str] = None
    description: Optional[str] = None

class SectorCreate(SectorBase):
    pass

class SectorResponse(SectorBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AidRecordBase(BaseModel):
    country_id: str
    donor_id: str
    sector_id: str
    year: int
    amount: float
    currency: str = "USD"
    project_title: Optional[str] = None
    description: Optional[str] = None

class AidRecordCreate(AidRecordBase):
    pass

class AidRecordResponse(AidRecordBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ForecastBase(BaseModel):
    country_id: str
    sector_id: Optional[str] = None
    year: int
    predicted_amount: float
    confidence_interval: Optional[Dict[str, float]] = None
    model: str
    features: Optional[Dict[str, Any]] = None

class ForecastCreate(ForecastBase):
    pass

class ForecastResponse(ForecastBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    session_id: str
    role: str
    content: str
    message_metadata: Optional[Dict[str, Any]] = None

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard Response Models
class AidStats(BaseModel):
    total_aid: str
    countries_count: int
    active_donors: int
    top_recipients: List[Dict[str, Any]]
    aid_trends: List[Dict[str, Any]]
    sector_distribution: List[Dict[str, Any]]
    top_donors: List[Dict[str, Any]]
    regional_distribution: List[Dict[str, Any]]

class CountryIntelligence(BaseModel):
    country_name: str
    total_aid_received: float
    major_donors: List[Dict[str, Any]]
    key_sectors: List[Dict[str, Any]]
    recent_trends: List[Dict[str, Any]]
    insights: str

class ChatResponse(BaseModel):
    response: str
    session_id: str
    message_metadata: Dict[str, Any]