from typing import List
from backend import models

def calculate_stress_score(
    income: float, 
    expenses: float, 
    total_debt: float, 
    total_emi: float, 
    max_delinquency: int
) -> tuple[float, str]:
    score = 0.0
    
    # 1. DTI Component (Max 30 points)
    if income > 0:
        dti = (total_emi / income) * 100
        if dti > 50:
            score += 30
        elif dti > 36:
            score += 20
        elif dti > 20:
            score += 10
        elif dti > 0:
            score += 5
    else:
        score += 30 if total_emi > 0 else 0

    # 2. Delinquency Component (Max 30 points)
    if max_delinquency >= 6:
        score += 30
    elif max_delinquency >= 3:
        score += 20
    elif max_delinquency >= 1:
        score += 10

    # 3. Monthly Surplus Component (Max 20 points)
    surplus = income - expenses - total_emi
    if surplus < 0:
        score += 20
    elif income > 0 and surplus < (income * 0.1): # Surplus is less than 10% of monthly income
        score += 10

    # 4. Debt to Annual Income Component (Max 20 points)
    annual_income = income * 12
    if annual_income > 0:
        debt_to_annual_ratio = total_debt / annual_income
        if debt_to_annual_ratio > 1.5:
            score += 20
        elif debt_to_annual_ratio > 0.75:
            score += 15
        elif debt_to_annual_ratio > 0.3:
            score += 8
    else:
        score += 20 if total_debt > 0 else 0

    # Determine stress level label
    if score >= 70:
        level = "critical"
    elif score >= 45:
        level = "high"
    elif score >= 20:
        level = "moderate"
    else:
        level = "low"

    return float(score), level

def analyze_user_finances(user: models.User, loans: List[models.Loan]) -> dict:
    income = user.monthly_income
    expenses = user.monthly_expenses
    
    active_loans = [loan for loan in loans if loan.status == "active"]
    total_debt = sum(loan.total_amount for loan in active_loans)
    total_emi = sum(loan.emi for loan in active_loans)
    
    max_delinquency = max([loan.delinquency_months for loan in active_loans]) if active_loans else 0
    
    surplus = income - expenses - total_emi
    dti_ratio = (total_emi / income * 100) if income > 0 else (100.0 if total_emi > 0 else 0.0)
    
    stress_score, stress_level = calculate_stress_score(
        income=income,
        expenses=expenses,
        total_debt=total_debt,
        total_emi=total_emi,
        max_delinquency=max_delinquency
    )
    
    return {
        "monthly_income": income,
        "monthly_expenses": expenses,
        "total_debt": total_debt,
        "total_monthly_emi": total_emi,
        "monthly_surplus": surplus,
        "debt_to_income_ratio": dti_ratio,
        "debt_stress_score": stress_score,
        "debt_stress_level": stress_level,
        "active_loans_count": len(active_loans)
    }
