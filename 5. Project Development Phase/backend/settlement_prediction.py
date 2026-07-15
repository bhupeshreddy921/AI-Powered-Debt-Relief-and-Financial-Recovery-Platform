import re

# Simple database of lender profiles and settlement characteristics
LENDER_PROFILES = {
    "chase": {"cooperativeness": "Medium", "base_rate": 0.45, "range_str": "40% - 50%"},
    "citi": {"cooperativeness": "Medium", "base_rate": 0.45, "range_str": "40% - 50%"},
    "wells fargo": {"cooperativeness": "Medium", "base_rate": 0.42, "range_str": "35% - 50%"},
    "bank of america": {"cooperativeness": "Medium", "base_rate": 0.45, "range_str": "40% - 50%"},
    "discover": {"cooperativeness": "Low", "base_rate": 0.55, "range_str": "50% - 60%"},
    "capital one": {"cooperativeness": "Low", "base_rate": 0.55, "range_str": "50% - 60%"},
    "american express": {"cooperativeness": "Low", "base_rate": 0.60, "range_str": "55% - 70%"},
    "portfolio recovery": {"cooperativeness": "High", "base_rate": 0.35, "range_str": "30% - 40%"},
    "midland funding": {"cooperativeness": "High", "base_rate": 0.35, "range_str": "30% - 40%"},
    "cavalry spv": {"cooperativeness": "High", "base_rate": 0.38, "range_str": "30% - 45%"},
}

def get_lender_profile(creditor_name: str) -> dict:
    name_clean = creditor_name.lower().strip()
    
    # Try substring matches
    for key, val in LENDER_PROFILES.items():
        if key in name_clean:
            return val
            
    # Default fallback for unknown lenders
    return {"cooperativeness": "Medium", "base_rate": 0.48, "range_str": "45% - 55%"}

def predict_settlement(
    loan_id: int,
    creditor_name: str,
    total_amount: float,
    delinquency_months: int
) -> dict:
    profile = get_lender_profile(creditor_name)
    base_rate = profile["base_rate"]
    cooperativeness = profile["cooperativeness"]
    
    # 1. Probability of Settlement (largely driven by delinquency)
    # Lenders rarely settle immediately (0 months). As time goes on, probability of settling increases.
    if delinquency_months == 0:
        probability = 0.15 # Very low chance before any delinquency
    elif delinquency_months < 3:
        probability = 0.35 # Mild chance, usually they push for full payments
    elif delinquency_months < 6:
        probability = 0.65 # Approaching charge-off, willing to discuss options
    elif delinquency_months < 12:
        probability = 0.85 # Charged off, high willingness to settle
    else:
        probability = 0.90 # Long-term collections, extremely high willingness
        
    # Adjust probability based on cooperativeness rating
    if cooperativeness == "High":
        probability = min(0.95, probability + 0.10)
    elif cooperativeness == "Low":
        probability = max(0.05, probability - 0.15)
        
    # 2. Settlement Rate adjustment based on delinquency duration
    # Longer delinquency = deeper discounts (lower settlement rates)
    discount_factor = 1.0
    if delinquency_months >= 12:
        discount_factor = 0.80 # 20% extra discount off base rate
    elif delinquency_months >= 6:
        discount_factor = 0.90 # 10% extra discount off base rate
    elif delinquency_months < 3:
        discount_factor = 1.15 # Higher settlement rate required early on
        
    final_rate = base_rate * discount_factor
    # Cap final rate between 20% and 85%
    final_rate = max(0.20, min(0.85, final_rate))
    
    # Range calculations
    min_rate = max(0.15, final_rate - 0.08)
    max_rate = min(0.90, final_rate + 0.08)
    
    min_amt = total_amount * min_rate
    max_amt = total_amount * max_rate
    rec_amt = total_amount * final_rate
    savings_amt = total_amount - rec_amt
    
    # Format range string
    range_str = f"{int(min_rate*100)}% - {int(max_rate*100)}%"
    
    return {
        "loan_id": loan_id,
        "creditor_name": creditor_name,
        "total_amount": total_amount,
        "min_predicted_amount": round(min_amt, 2),
        "max_predicted_amount": round(max_amt, 2),
        "recommended_amount": round(rec_amt, 2),
        "savings_amount": round(savings_amt, 2),
        "probability": round(probability, 2),
        "delinquency_months": delinquency_months,
        "lender_cooperativeness": cooperativeness,
        "typical_settlement_range": range_str
    }
