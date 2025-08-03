# 🌍 UN Aid Intelligence Platform

An AI-powered web application for analyzing, forecasting, and understanding international development aid flows. Built using FastAPI, React, and machine learning, the platform visualizes ODA trends with real UN datasets (2015–2023) and offers interactive dashboards, forecasts, and AI-assisted queries.

---

## 🚀 Live Features

- 📊 **Interactive Dashboards**: Visualize global ODA trends by donor, recipient, sector, and year
- 🌐 **Mapbox World Map**: Explore aid flows geographically with precise mapping
- 📈 **Time Series Forecasting**: Predict 2025–2026 flows using Prophet, XGBoost, and hybrid models
- 💬 **AI Assistant**: Ask natural language questions and get real, model-backed insights
- 🧠 **SHAP Explainability**: Understand the key drivers behind ML predictions
- 📄 **CSV & PDF Export**: Download filtered datasets with clean formatting

---

## 🧠 Tech Stack

### ⚙️ Backend (FastAPI)
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL (via SQLAlchemy ORM)
- **Data Handling**: Pandas, Pydantic, Requests
- **AI/ML**: OpenAI GPT-4o, Prophet, XGBoost
- **Visualization Export**: ReportLab, Matplotlib
- **API Design**: RESTful + auto-generated OpenAPI docs

### 💻 Frontend (React + Vite)
- **Build Tool**: Vite + TypeScript
- **UI Library**: Shadcn/UI (Radix Primitives)
- **Styling**: Tailwind CSS + PostCSS
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Charts**: Plotly.js
- **Maps**: Mapbox GL JS

---

## 🧪 Getting Started Locally

### 1. Clone & install dependencies

```bash
git clone https://github.com/yourusername/un-aid-intelligence-platform.git
cd un-aid-intelligence-platform


Backend (Python)

python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt

Frontend (React)

cd client
npm install
cd ..

Create .env from Template

DATABASE_URL=postgresql://your_username:your_password@localhost/unaid_db
OPENAI_API_KEY=your_openai_key_here
VITE_MAPBOX_TOKEN=your_mapbox_token_here
NODE_ENV=development

Run both frontend + backend
npm run dev
App available at: http://localhost:5000


Machine Learning & Forecasting
Forecasting powered by hybrid models combining Prophet and XGBoost

Accuracy:
Prophet: 86.5%
XGBoost: 89.2%
Hybrid: 91.8%

SHAP explainability shows factor impact:
Historical Trend
Aid Volatility
Development Stage
Economic Cycle
Political Stability

 Export Functionality

/api/export/csv and /api/export/pdf generate downloadable reports

filtering support for:
Country, year, sector, donor
Values shown in Amount_Thousands_USD (e.g., $28016.7K)

No mock data — all exports reflect the live PostgreSQL dataset

👥 Authors

Adarsh Chiriyamkandath Jose
Hanyang University, Dept. of Data Science
✉️ adarsh.c.jose@gmail.com

Lakshmi Sunil Koonath
Hanyang University, Dept. of Data Science
✉️ lakshmikoonath@gmail.com


License & Submission
This project was developed as part of the UNDP Seoul Policy Centre Deep Dive Hackathon 2025.
All datasets used are publicly available or provided by the organizers.
