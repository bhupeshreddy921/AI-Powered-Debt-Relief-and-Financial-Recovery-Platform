import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserUpdate(BaseModel):
    monthly_income: Optional[float] = Field(default=None, ge=0.0)
    monthly_expenses: Optional[float] = Field(default=None, ge=0.0)

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    monthly_income: float
    monthly_expenses: float

    class Config:
        from_attributes = True

class LoanCreate(BaseModel):
    creditor_name: str
    total_amount: float = Field(..., gt=0.0)
    interest_rate: float = Field(default=0.0, ge=0.0)
    emi: float = Field(default=0.0, ge=0.0)
    delinquency_months: int = Field(default=0, ge=0)
    status: Optional[str] = "active"

class LoanUpdate(BaseModel):
    creditor_name: Optional[str] = None
    total_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    emi: Optional[float] = None
    delinquency_months: Optional[int] = None
    status: Optional[str] = None

class LoanResponse(BaseModel):
    id: int
    user_id: int
    creditor_name: str
    total_amount: float
    interest_rate: float
    emi: float
    delinquency_months: int
    status: str

    class Config:
        from_attributes = True

class SettlementPredictionResponse(BaseModel):
    loan_id: int
    creditor_name: str
    total_amount: float
    min_predicted_amount: float
    max_predicted_amount: float
    recommended_amount: float
    savings_amount: float
    probability: float
    delinquency_months: int
    lender_cooperativeness: str
    typical_settlement_range: str

class LetterGenerationRequest(BaseModel):
    loan_id: int
    letter_type: str  # hardship, settlement, dispute
    hardship_reason: Optional[str] = None  # job_loss, medical_emergency, general_hardship, etc.
    custom_context: Optional[str] = None

class LetterGenerationResponse(BaseModel):
    loan_id: int
    letter_type: str
    letter_content: str
    strategy_notes: str

class NegotiationHistoryResponse(BaseModel):
    id: int
    loan_id: int
    letter_type: str
    letter_content: str
    strategy_notes: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class FinancialAnalysisResponse(BaseModel):
    monthly_income: float
    monthly_expenses: float
    total_debt: float
    total_monthly_emi: float
    monthly_surplus: float
    debt_to_income_ratio: float
    debt_stress_score: float
    debt_stress_level: str  # low, moderate, high, critical
    active_loans_count: int
