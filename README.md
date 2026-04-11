# 🚀 Retail Intelligence Engine

A microservices-based retail analytics system that provides sales forecasting, inventory insights, and decision support using machine learning.

## 📌 Overview

This project is designed to help retail businesses make data-driven decisions by analyzing sales data, predicting future demand, and generating actionable recommendations.

The system separates core API logic and ML processing into independent services for better scalability and maintainability.

## 🏗️ Architecture

- **Frontend**: Next.js dashboard for analytics and visualization  
- **Backend**: Node.js + Express REST API  
- **AI Engine**: Python (FastAPI) for forecasting and recommendations  
- **Database**: PostgreSQL  
- **Cache**: Redis  
- **Deployment**: Docker + Docker Compose + Nginx  

> The ML service is isolated as a separate microservice to allow independent scaling and model updates without affecting backend performance.

## ⚙️ Features

- Sales forecasting using time-series models (ARIMA, Moving Average, Linear Regression)  
- Inventory analysis with stock-level insights  
- Recommendation system (restock, discount, investigate)  
- Scenario simulation for revenue impact  
- REST APIs for data retrieval and predictions  
- Interactive dashboard for visualization  

## 🧪 Tech Stack

- **Backend**: Node.js, Express  
- **Frontend**: Next.js, React  
- **AI/ML**: Python, FastAPI, Pandas, NumPy, statsmodels  
- **Database**: PostgreSQL  
- **Caching**: Redis  
- **DevOps**: Docker, Nginx  

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Engine    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Python)      │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - REST API      │    │ - ML Models     │
│ - Analytics     │    │ - Auth          │    │ - Forecasting   │
│ - Inventory     │    │ - Validation    │    │ - Scenarios     │
│ - Recommendations│ │ - Recommendations │ │ - Export API     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │                 │
                    │ - PostgreSQL    │
                    │ - Redis Cache   │
                    │ - File Storage  │
                    └─────────────────┘
```
## 🚀 Getting Started
### 1. Clone the repository
git clone <your-repo-url>
cd retail-intelligence-engine
### 2. Setup environment variables
cp .env.example .env
### 3. Run using Docker
docker compose up --build
### 4. Access services
- Frontend: http://localhost:3000  
- Backend API: http://localhost:4000  
- AI Engine: http://localhost:8000  
## 📊 Example Output
- Forecast future sales for products  
- Identify low-stock or overstock situations  
- Generate recommendations based on trends  
- Simulate revenue impact for different scenarios  
## 📄 Documentation
- API details: `API_DOCUMENTATION.md`  
- Deployment guide: `DEPLOYMENT.md`  
## 🎯 Key Learnings
- Designed a microservices architecture separating ML and backend logic  
- Integrated ML models into a production-style API workflow  
- Used Redis caching to improve performance  
- Containerized services using Docker for easier deployment  
## 📌 Note
This project focuses on system design and ML integration rather than optimizing model accuracy.


