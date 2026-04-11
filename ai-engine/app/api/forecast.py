from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

from ..schemas.forecast_schema import ForecastRequest, ForecastResponse
from ..training.train import train_and_select


router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.post("", response_model=ForecastResponse)
def create_forecast(request: ForecastRequest):
    history = request.quantities
    horizon = request.horizon

    best = train_and_select(history, horizon)

    return ForecastResponse(
        product_id=request.product_id,
        horizon=horizon,
        model_used=best["model_used"],
        forecasts=best["forecasts"],
        metrics=best["metrics"],
    )


@router.post("/enhanced", response_model=Dict)
def create_enhanced_forecast(request: ForecastRequest):
    """
    Generate enhanced forecast with human-readable insights and actionable recommendations
    """
    try:
        history = request.quantities
        horizon = min(request.horizon, 7)  # Limit to 7 days for enhanced features
        
        if len(history) < 7:
            raise HTTPException(status_code=400, detail="Insufficient historical data (minimum 7 days required)")
        
        best = train_and_select(history, horizon)
        forecasts = best["forecasts"]
        metrics = best["metrics"]
        
        # Generate next 7 days dates
        base_date = datetime.now().date()
        forecast_dates = [(base_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
        
        # Calculate inventory alerts and recommendations
        avg_daily_sales = sum(history[-7:]) / 7 if len(history) >= 7 else sum(history) / len(history)
        total_forecasted_sales = sum(forecasts[:7])
        
        # Inventory status classification
        current_stock = avg_daily_sales * 14  # Assume 14 days of current stock
        safety_stock = avg_daily_sales * 7    # 7 days safety stock
        
        inventory_status = "low"
        if current_stock > safety_stock * 2:
            inventory_status = "high"
        elif current_stock > safety_stock * 1.2:
            inventory_status = "medium"
        
        # Generate actionable recommendations
        recommendations = []
        priority_score = 0
        
        if inventory_status == "low":
            recommendations.append({
                "action": "restock",
                "urgency": "high",
                "quantity": int(avg_daily_sales * 21),  # 3 weeks supply
                "reason": "Stock below safety level based on forecasted demand"
            })
            priority_score += 30
        elif inventory_status == "high":
            recommendations.append({
                "action": "discount",
                "urgency": "medium",
                "discount": "15%",
                "reason": "Excess inventory - consider promotional pricing"
            })
            priority_score += 20
        else:
            recommendations.append({
                "action": "hold",
                "urgency": "low",
                "reason": "Inventory levels optimal"
            })
            priority_score += 10
        
        # Check for declining sales trend
        if len(history) >= 14:
            recent_avg = sum(history[-7:]) / 7
            previous_avg = sum(history[-14:-7]) / 7
            if recent_avg < previous_avg * 0.8:
                recommendations.append({
                    "action": "investigate",
                    "urgency": "medium",
                    "reason": "Sales trend declining by 20%+ compared to previous period"
                })
                priority_score += 15
        
        # Format daily forecasts
        daily_forecasts = []
        for i, (date, forecast) in enumerate(zip(forecast_dates, forecasts[:7])):
            daily_forecasts.append({
                "date": date,
                "forecasted_sales": round(forecast, 2),
                "confidence": "high" if metrics.get("mape", 0) < 0.1 else "medium" if metrics.get("mape", 0) < 0.2 else "low",
                "day_of_week": datetime.strptime(date, "%Y-%m-%d").strftime("%A")
            })
        
        return {
            "product_id": request.product_id,
            "analysis_period": {
                "start_date": forecast_dates[0],
                "end_date": forecast_dates[-1],
                "days": 7
            },
            "forecast_summary": {
                "total_forecasted_sales": round(total_forecasted_sales, 2),
                "avg_daily_sales": round(avg_daily_sales, 2),
                "peak_demand_day": max(daily_forecasts, key=lambda x: x["forecasted_sales"])["date"] if daily_forecasts else None,
                "model_accuracy": {
                    "mape": round(metrics.get("mape", 0), 4),
                    "rmse": round(metrics.get("rmse", 0), 2),
                    "model_used": best["model_used"]
                }
            },
            "inventory_status": {
                "current_stock_level": inventory_status,
                "estimated_days_of_stock": round(current_stock / avg_daily_sales, 1) if avg_daily_sales > 0 else 0,
                "safety_stock_days": 7,
                "reorder_point": round(safety_stock, 2)
            },
            "daily_forecasts": daily_forecasts,
            "recommendations": recommendations,
            "priority_score": priority_score,
            "alerts": generate_alerts(inventory_status, avg_daily_sales, current_stock),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")


@router.post("/scenario", response_model=Dict)
def simulate_scenario(request: ForecastRequest, sales_change_percent: float = 0.0):
    """
    Simulate different scenarios based on sales percentage changes
    """
    try:
        history = request.quantities
        horizon = min(request.horizon, 7)
        
        # Adjust historical data based on scenario
        adjusted_history = [qty * (1 + sales_change_percent / 100) for qty in history]
        
        best = train_and_select(adjusted_history, horizon)
        forecasts = best["forecasts"]
        
        # Calculate impact
        original_total = sum(history[-7:]) if len(history) >= 7 else sum(history)
        adjusted_total = sum(adjusted_history[-7:]) if len(adjusted_history) >= 7 else sum(adjusted_history)
        forecast_total = sum(forecasts[:7])
        
        avg_price = 29.99  # Assume average price
        revenue_impact = (adjusted_total - original_total) * avg_price
        forecast_revenue = forecast_total * avg_price
        
        return {
            "scenario": {
                "type": "sales_change",
                "percentage_change": sales_change_percent,
                "description": f"{sales_change_percent:+.1f}% change in sales"
            },
            "impact_analysis": {
                "original_period_sales": round(original_total, 2),
                "adjusted_period_sales": round(adjusted_total, 2),
                "forecasted_sales": round(forecast_total, 2),
                "revenue_impact": round(revenue_impact, 2),
                "forecasted_revenue": round(forecast_revenue, 2)
            },
            "adjusted_forecasts": [round(f, 2) for f in forecasts[:7]],
            "recommendations": generate_scenario_recommendations(sales_change_percent, adjusted_total),
            "risk_assessment": assess_scenario_risk(sales_change_percent, len(history)),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario simulation failed: {str(e)}")


def generate_alerts(inventory_status: str, avg_daily_sales: float, current_stock: float) -> List[Dict]:
    """Generate appropriate alerts based on inventory status"""
    alerts = []
    
    if inventory_status == "low":
        alerts.append({
            "type": "critical",
            "title": "Low Stock Alert",
            "message": f"Stock critically low. Only {current_stock:.0f} units remaining.",
            "action_required": "Immediate restock recommended"
        })
    elif inventory_status == "high":
        alerts.append({
            "type": "warning",
            "title": "Excess Inventory",
            "message": f"High inventory levels detected. Consider promotional activities.",
            "action_required": "Review pricing strategy"
        })
    
    if avg_daily_sales < 1:
        alerts.append({
            "type": "info",
            "title": "Low Sales Velocity",
            "message": "Product selling less than 1 unit per day on average.",
            "action_required": "Consider product placement or marketing"
        })
    
    return alerts


def generate_scenario_recommendations(sales_change: float, adjusted_sales: float) -> List[str]:
    """Generate recommendations based on scenario outcomes"""
    recommendations = []
    
    if sales_change > 20:
        recommendations.append("Increase safety stock by 25% to handle demand surge")
        recommendations.append("Consider expediting supplier orders")
    elif sales_change < -20:
        recommendations.append("Reduce upcoming orders to prevent overstock")
        recommendations.append("Consider promotional pricing to stimulate demand")
    else:
        recommendations.append("Maintain current inventory levels")
        recommendations.append("Monitor sales trends closely")
    
    return recommendations


def assess_scenario_risk(sales_change: float, data_points: int) -> Dict:
    """Assess the risk level of the scenario"""
    risk_level = "low"
    risk_factors = []
    
    if abs(sales_change) > 30:
        risk_level = "high"
        risk_factors.append("Large sales variation may impact forecast accuracy")
    elif abs(sales_change) > 15:
        risk_level = "medium"
        risk_factors.append("Moderate sales variation detected")
    
    if data_points < 30:
        risk_level = "high" if risk_level != "low" else "medium"
        risk_factors.append("Limited historical data for accurate forecasting")
    
    return {
        "level": risk_level,
        "factors": risk_factors,
        "confidence": "high" if data_points > 60 else "medium" if data_points > 30 else "low"
    }


@router.get("/sample-data")
def get_sample_forecast_data():
    """Generate sample forecast data for testing"""
    import random
    
    # Sample historical data (30 days)
    sample_history = [random.randint(5, 25) for _ in range(30)]
    
    # Sample request
    sample_request = ForecastRequest(
        product_id="sample-product-123",
        dates=[(datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30, 0, -1)],
        quantities=sample_history,
        horizon=7
    )
    
    return {
        "sample_request": {
            "product_id": sample_request.product_id,
            "historical_data_points": len(sample_request.quantities),
            "horizon_days": sample_request.horizon,
            "sample_quantities": sample_request.quantities[:10]  # Show first 10 as sample
        },
        "enhanced_forecast_example": {
            "product_id": "sample-product-123",
            "analysis_period": {
                "start_date": (datetime.now().date()).strftime("%Y-%m-%d"),
                "end_date": (datetime.now().date() + timedelta(days=6)).strftime("%Y-%m-%d"),
                "days": 7
            },
            "forecast_summary": {
                "total_forecasted_sales": 147.5,
                "avg_daily_sales": 21.1,
                "peak_demand_day": (datetime.now().date() + timedelta(days=2)).strftime("%Y-%m-%d"),
                "model_accuracy": {
                    "mape": 0.0847,
                    "rmse": 2.34,
                    "model_used": "ARIMA"
                }
            },
            "inventory_status": {
                "current_stock_level": "medium",
                "estimated_days_of_stock": 13.2,
                "safety_stock_days": 7,
                "reorder_point": 147.7
            },
            "daily_forecasts": [
                {
                    "date": (datetime.now().date() + timedelta(days=i)).strftime("%Y-%m-%d"),
                    "forecasted_sales": round(20 + random.randint(-5, 8), 2),
                    "confidence": "high",
                    "day_of_week": (datetime.now().date() + timedelta(days=i)).strftime("%A")
                } for i in range(7)
            ],
            "recommendations": [
                {
                    "action": "hold",
                    "urgency": "low",
                    "reason": "Inventory levels optimal"
                }
            ],
            "priority_score": 10,
            "alerts": [],
            "generated_at": datetime.now().isoformat()
        }
    }

