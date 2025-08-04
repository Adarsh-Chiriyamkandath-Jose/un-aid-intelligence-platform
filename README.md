# UN Aid Intelligence Platform

**Built for UNDP Seoul Hackathon 2025**

An AI-powered analytics platform for international development aid flows, providing comprehensive insights, forecasting capabilities, and conversational intelligence for evidence-based development decision-making.

## Table of Contents
- [Project Overview](#project-overview)
- [Setup Instructions](#setup-instructions)
- [Code Documentation](#code-documentation)
- [API Documentation](#api-documentation)
- [Analysis Methodology](#analysis-methodology)
- [Datasets Choice Justification](#datasets-choice-justification)
- [Key Findings](#key-findings)
- [UNDP Usage Applications](#undp-usage-applications)
- [Technical Decisions](#technical-decisions)
- [Future Possibilities](#future-possibilities)
- [Authors](#-authors)
- [License & Submission](#license--submission)

## Project Overview

The UN Aid Intelligence Platform is a sophisticated web application that analyzes international development aid flows from 2015-2023, processing real UN data containing 478,371 records representing $952.3 million in development assistance across 14 recipient countries and 146 donor organizations.

### Key Features

- **Interactive Geographic Visualization**: Mapbox-powered world map with dynamic aid flow visualization
- **Advanced Forecasting**: Machine learning models (Prophet, XGBoost) with SHAP explainability for 3-year predictions
- **Conversational AI**: OpenAI GPT-4o integration for natural language queries about aid patterns
- **Professional Analytics**: Real-time dashboards with precision financial formatting
- **Comprehensive Reporting**: CSV and PDF export functionality with filtered data
- **Multi-dimensional Analysis**: Country, sector, donor, and temporal analytics

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 12+
- OpenAI API key

### Installation

1. **Clone and Setup Project**
```bash
git clone <repository-url>
cd un-aid-intelligence-platform
```

2. **Backend Setup (FastAPI)**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary pandas python-dotenv openai scikit-learn xgboost prophet pydantic python-multipart requests reportlab alembic matplotlib seaborn
```

3. **Frontend Setup (React)**
```bash
# Install Node.js dependencies
npm install
```

4. **Environment Configuration**
Create `.env` file in project root:
```env
# Database Configuration (Required)
DATABASE_URL=postgresql://username:password@localhost/unaid_db

# AI Services (Required for chat functionality)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend Environment Variables (Required for maps)
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here

# Development Environment
NODE_ENV=development
```

**Required API Keys:**
- **DATABASE_URL**: PostgreSQL connection string for data storage
- **OPENAI_API_KEY**: OpenAI API key for conversational AI features
- **VITE_MAPBOX_ACCESS_TOKEN**: Mapbox access token for interactive world map visualization

**Obtaining API Keys:**
- **Mapbox**: Sign up at [mapbox.com](https://mapbox.com) → Account → Access Tokens
- **OpenAI**: Create account at [platform.openai.com](https://platform.openai.com) → API Keys

5. **Database Setup**
```bash
# Create PostgreSQL database
createdb unaid_db

# Application will auto-create tables and load data on startup
```

6. **Run Application**
```bash
# Start both backend and frontend
npm run dev

# Access application at http://localhost:5000
# API documentation at http://localhost:5000/docs
```

## Code Documentation

### Architecture Overview

```
un-aid-intelligence-platform/
├── app/                    # FastAPI Backend
│   ├── routers/           # API endpoints
│   │   ├── dashboard.py   # Dashboard statistics
│   │   ├── forecasting.py # ML predictions & SHAP
│   │   ├── export.py      # Data export functionality
│   │   ├── chat.py        # AI conversation
│   │   └── map.py         # Geographic data
│   ├── services/          # Business logic
│   └── models.py          # Database models
├── client/                # React Frontend
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Application pages
│       └── hooks/         # Custom React hooks
├── main.py               # FastAPI application entry
└── merged_data.csv       # UN aid dataset (516MB)
```

### Key Components

**Backend (FastAPI)**
- `models.py`: SQLAlchemy database models for countries, donors, sectors, aid records
- `services/database.py`: Data loading and processing utilities
- `routers/forecasting.py`: Machine learning forecasting with Prophet/XGBoost
- `routers/chat.py`: OpenAI integration for conversational AI

**Frontend (React + TypeScript)**
- `pages/dashboard.tsx`: Main analytics dashboard
- `components/ForecastingPanel.tsx`: ML prediction interface with SHAP explanations
- `components/map/`: Interactive Mapbox world map
- `components/export/CompactExportButtons.tsx`: Data export functionality

### Data Processing Pipeline

1. **Data Ingestion**: Automatic CSV parsing and validation on startup
2. **Database Population**: Chunked inserts with foreign key relationships
3. **Real-time Analytics**: Dynamic aggregation queries for dashboard metrics
4. **ML Pipeline**: Feature engineering → Model training → Prediction → SHAP analysis

## API Documentation

### Core Endpoints

**Dashboard Analytics**
- `GET /api/dashboard/stats` - Global aid statistics and trends
- `GET /api/dashboard/trends` - Aid trends over time
- `GET /api/dashboard/overview` - Platform overview metrics

**Reference Data**
- `GET /api/countries/` - Country metadata with geographic coordinates
- `GET /api/sectors/` - Aid sector classifications  
- `GET /api/donors/` - Donor organization information
- `GET /api/aid-records/` - Aid transaction records

**Geographic Visualization**
- `GET /api/map/countries` - Country-level aid data for map visualization
- `GET /api/map/country/{country_id}` - Individual country details
- Query parameters: `year`, `sector`, `donor` for filtering

**Forecasting & AI**
- `POST /api/forecasting/forecast` - Generate 3-year aid predictions
- `POST /api/forecasting/shap-explanations` - SHAP factor analysis
- `POST /api/forecasting/predict` - Alternative prediction endpoint
- `GET /api/forecasting/accuracy` - Model accuracy metrics

**Conversational AI**
- `POST /api/chat/message` - Main conversational AI endpoint
- `POST /api/chat/` - Alternative chat endpoint
- `GET /api/chat/history/{session_id}` - Chat conversation history
- `GET /api/chat/sessions` - Available chat sessions

**Data Export**
- `GET /api/export/csv` - Filtered CSV data export with query parameters
- `GET /api/export/pdf` - Professional PDF reports (implementation in progress)

### Request/Response Examples

**Forecasting Request**
```json
{
  "country": "India",
  "sector": "all",
  "model": "hybrid",
  "years": 3
}
```

**Forecasting Response**
```json
{
  "predictions": [
    {"year": 2024, "predicted": 28956.8, "lower": 25467.5, "upper": 32446.09}
  ],
  "accuracy": {"hybrid": 91.8, "confidence": 91.8},
  "insights": ["Aid flows show strong growth trend (+$1.5B USD/year)"]
}
```

## Analysis Methodology

### Machine Learning Approach

**Forecasting Models**
1. **Prophet**: Time series decomposition with trend, seasonality, and holiday effects
2. **XGBoost**: Gradient boosting with feature engineering (GDP, political stability, disasters)
3. **Hybrid Ensemble**: Weighted combination optimizing for accuracy and interpretability

**Feature Engineering**
- Historical aid trends (5-year moving averages)
- Economic indicators (GDP growth, inflation)
- Development metrics (HDI, governance indices)
- External factors (natural disasters, political events)

**Model Validation**
- Time series cross-validation with expanding windows
- MAPE (Mean Absolute Percentage Error) for accuracy assessment
- Confidence intervals using bootstrap resampling

### SHAP Explainability

**Factor Analysis Categories**
- **Temporal**: Historical trends and momentum patterns (derived from merged ODA + WDI data)
- **Stability**: Aid volatility and predictability measures
- **Structural**: Development stage and economic fundamentals (using WDI indicators)
- **External**: Global economic cycles and political factors
- **Governance**: Political stability and institutional quality (from WDI governance metrics)

**Appropriateness Justification**
- Prophet: Excellent for capturing seasonal patterns in aid cycles
- XGBoost: Handles non-linear relationships between economic/political factors
- SHAP: Provides interpretable explanations crucial for policy decisions
- Ensemble: Combines strengths while maintaining transparency

## Datasets Choice Justification

### Primary Dataset: Merged UN Aid + World Bank WDI Data (2015-2023)

**Source**: Combined dataset merging official UN development assistance records with World Bank World Development Indicators (WDI)
**Volume**: 516MB, 478,371 records, $952.3M total aid
**Coverage**: 14 recipient countries, 146 donor organizations, 53 sectors with economic indicators

**Data Integration Process**
- **UN Aid Component**: Official development assistance flows with country-sector-donor-year breakdown
- **World Bank WDI Component**: Economic indicators including GDP, inflation, development indices
- **Merge Strategy**: Country-year matching with validation of temporal alignment
- **Quality Assurance**: Cross-validation between datasets for consistency verification

**Selection Rationale**
- **Comprehensive Coverage**: Complete aid flow records enhanced with economic context
- **Data Quality**: Dual official sources (UN + World Bank) ensure maximum accuracy
- **Analytical Power**: Combined dataset enables correlation analysis between aid flows and economic outcomes
- **Temporal Depth**: 9-year aligned timespan supports robust trend and causality analysis
- **Multi-dimensional Analysis**: Aid patterns contextualized within economic development trajectories

**Processing Methods**
- Automated data validation and cleaning during ingestion
- Standardized country/sector naming across both datasets
- Currency normalization to USD thousands with inflation adjustment
- Economic indicator interpolation for missing data points
- Foreign key relationship mapping for efficient cross-dataset queries

**WDI Integration Note**: While the WDI indicators are not visualized in the current UI, they are used in our forecasting models and SHAP analysis to provide contextual, interpretable predictions.



## Key Findings

### Development Cooperation Insights

---

**1. Regional Aid Concentration**
- South Asia receives 45.9% of total aid ($437.2M), dominated by India ($210.0M) and Bangladesh ($124.1M)
- Sub-Saharan Africa follows with 22.9% ($218.0M), led by Nigeria ($71.1M) and Ethiopia ($65.0M)
- Southeast Asia represents 22.7% ($216.4M), with Indonesia ($110.3M) and Philippines ($75.9M) as major recipients

**2. Sectoral Priorities**
- Health sectors receive 2.04x more funding than Education ($105.4M vs $51.8M)
- Health represents 11.1% of total allocations, Education accounts for 5.4%
- Infrastructure and financial services show consistent allocation patterns across regions

**3. Donor Behavior Patterns**
- Dataset covers 146 donor organizations across 478,371 aid records
- Regional preferences evident: significant Asia focus in bilateral aid
- Multilateral institutions provide substantial funding through World Bank and Asian Development Bank

**4. Predictive Insights**
- Aid flows demonstrate 91.8% predictability using hybrid ML models
- Historical trend analysis reveals sustained commitment patterns
- Political stability and economic indicators serve as strong predictors of aid continuity

### Significance for Development Cooperation

---

**Evidence-Based Planning**: Quantitative foundation for aid allocation decisions

**Risk Assessment**: Early warning system for aid flow disruptions

**Coordination Enhancement**: Data-driven donor coordination and gap analysis

**Impact Measurement**: Baseline establishment for aid effectiveness evaluation

## UNDP Usage Applications

### Strategic Planning
- **Country Programme Development**: Data-driven evidence for resource allocation
- **Partnership Strategy**: Identification of funding gaps and coordination opportunities
- **Risk Management**: Predictive insights for programme sustainability planning

### Operational Excellence
- **Resource Mobilization**: Donor behavior analysis for targeted engagement
- **Programme Monitoring**: Real-time tracking of sector-specific funding trends
- **Reporting & Accountability**: Automated generation of donor and partner reports

### Policy Support
- **Government Advisory**: Evidence-based recommendations for national development strategies
- **Donor Coordination**: Facilitation of joint programming and harmonization efforts
- **Knowledge Management**: Platform for institutional learning and best practice sharing

## Technical Decisions

### Architecture Choices

---

**Full-Stack Python Approach**
- **Rationale**: FastAPI provides high-performance async capabilities with automatic OpenAPI documentation
- **Migration**: Successfully migrated from Node.js/Express to leverage Python's ML ecosystem
- **Impact**: Unified Python environment simplifies deployment and maintenance while enabling advanced analytics

**React + TypeScript Frontend**
- **Rationale**: Type safety crucial for complex financial data handling
- **Component Library**: Shadcn/UI for consistent, accessible design system
- **State Management**: TanStack Query for efficient server state caching

**PostgreSQL Database**
- **Rationale**: ACID compliance essential for financial data integrity
- **Alternative Considered**: MongoDB rejected due to relational data structure
- **Optimization**: Indexed queries on country-year-sector combinations

### ML Framework Selection

---

**Prophet for Time Series**
- **Rationale**: Handles missing data and outliers common in aid flows
- **Strength**: Interpretable decomposition of trend/seasonal components

**XGBoost for Feature-Rich Prediction**
- **Rationale**: Superior performance with mixed categorical/numerical features
- **Configuration**: 100 estimators, 0.1 learning rate for stability

**SHAP for Explainability**
- **Rationale**: Policy decisions require transparent model reasoning
- **Implementation**: TreeExplainer optimized for gradient boosting models

## Future Possibilities

### Expanded Two-Month Timeline

**Month 1: September 2025 – Core Feature Expansion & SDG Alignment**

**Week 1 – Global Data Expansion:**
- Integrate data for all 190+ recipient countries and 200+ donors
- Ensure accuracy and verification of financial records

**Week 2 – SDG Alignment Engine:**
- AI-based classification of aid projects to SDGs using project titles/descriptions
- Helps track alignment with the 2030 Sustainable Development Goals

**Week 3 – Country & SDG Dashboards:**
- New dashboards to explore aid totals, sector breakdowns, and SDG contributions by country

**Week 4 – Admin Portal:**
- Develop an admin dashboard for dataset approval, system monitoring, and AI log access

**Month 2: October 2025 – Intelligence, Localization & Public Launch**

**Week 1 – Custom Data Upload:**
- Let organizations upload Excel/CSV aid data
- Automatically merge this into platform visuals and forecasts

**Week 2 – Multilingual AI Assistant:**
- Enable GPT-4o chatbot support in Korean, Spanish, French, and Arabic
- Website available in English and Korean language interface

**Week 3 – Forecast Insights:**
- Implement AI predictions for aid flows with SHAP explainability
- Export results as graphs and data tables

**Week 4 – Public Beta & Launch:**
- Deploy on Render cloud platform
- Conduct live user testing with UNDP and policy partners
- Final UI polishing and GitHub source code release

This roadmap transforms the platform from a prototype into a production-ready global aid intelligence system, directly supporting UNDP's mission of evidence-based development cooperation and SDG achievement monitoring.

---

## 👥 Authors

**Adarsh Chiriyamkandath Jose**  
Hanyang University, Dept. of Data Science  
✉️ adarsh.c.jose@gmail.com

**Lakshmi Sunil Koonath**  
Hanyang University, Dept. of Data Science  
✉️ lakshmikoonath@gmail.com

## License & Submission

This project was developed as part of the UNDP Seoul Policy Centre Deep Dive Hackathon 2025.  
All datasets used are publicly available or provided by the organizers.
