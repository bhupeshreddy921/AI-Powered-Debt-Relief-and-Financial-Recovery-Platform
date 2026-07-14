from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from backend.database import engine, get_db
from backend import models, schemas, auth, financial_processing, settlement_prediction, gemini_service

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-Powered Debt Relief & Financial Recovery API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Endpoints
@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_pw,
        monthly_income=0.0,
        monthly_expenses=0.0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# Form-based login for Swagger UI compatibility
@app.post("/api/auth/login-form", response_model=schemas.Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# User Endpoints
@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/api/users/me", response_model=schemas.UserResponse)
def update_user_profile(user_update: schemas.UserUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if user_update.monthly_income is not None:
        current_user.monthly_income = user_update.monthly_income
    if user_update.monthly_expenses is not None:
        current_user.monthly_expenses = user_update.monthly_expenses
    db.commit()
    db.refresh(current_user)
    return current_user

# Loan Management Endpoints
@app.get("/api/loans", response_model=List[schemas.LoanResponse])
def get_loans(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Loan).filter(models.Loan.user_id == current_user.id).all()

@app.post("/api/loans", response_model=schemas.LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(loan: schemas.LoanCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    new_loan = models.Loan(
        user_id=current_user.id,
        creditor_name=loan.creditor_name,
        total_amount=loan.total_amount,
        interest_rate=loan.interest_rate,
        emi=loan.emi,
        delinquency_months=loan.delinquency_months,
        status=loan.status or "active"
    )
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    return new_loan

@app.put("/api/loans/{loan_id}", response_model=schemas.LoanResponse)
def update_loan(loan_id: int, loan_update: schemas.LoanUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id, models.Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
        
    for key, val in loan_update.model_dump(exclude_unset=True).items():
        setattr(loan, key, val)
        
    db.commit()
    db.refresh(loan)
    return loan

@app.delete("/api/loans/{loan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_loan(loan_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id, models.Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    db.delete(loan)
    db.commit()
    return None

# Financial Analysis & Prediction Endpoints
@app.get("/api/finance/analysis", response_model=schemas.FinancialAnalysisResponse)
def get_financial_analysis(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    loans = db.query(models.Loan).filter(models.Loan.user_id == current_user.id).all()
    analysis = financial_processing.analyze_user_finances(current_user, loans)
    return analysis

@app.get("/api/finance/predictions/{loan_id}", response_model=schemas.SettlementPredictionResponse)
def get_loan_prediction(loan_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id, models.Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
        
    prediction = settlement_prediction.predict_settlement(
        loan_id=loan.id,
        creditor_name=loan.creditor_name,
        total_amount=loan.total_amount,
        delinquency_months=loan.delinquency_months
    )
    
    # Check if a suggested settlement record exists, if not, write to DB or update
    record = db.query(models.SettlementRecord).filter(models.SettlementRecord.loan_id == loan_id).first()
    if not record:
        new_record = models.SettlementRecord(
            loan_id=loan_id,
            min_predicted_amount=prediction["min_predicted_amount"],
            max_predicted_amount=prediction["max_predicted_amount"],
            recommended_amount=prediction["recommended_amount"],
            savings_amount=prediction["savings_amount"],
            probability=prediction["probability"],
            status="suggested"
        )
        db.add(new_record)
        db.commit()
        
    return prediction

@app.post("/api/finance/generate-letter", response_model=schemas.LetterGenerationResponse)
def generate_letter(req: schemas.LetterGenerationRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == req.loan_id, models.Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
        
    result = gemini_service.generate_negotiation_letter(
        letter_type=req.letter_type,
        creditor_name=loan.creditor_name,
        total_amount=loan.total_amount,
        delinquency_months=loan.delinquency_months,
        hardship_reason=req.hardship_reason,
        custom_context=req.custom_context
    )
    
    # Save in Negotiation History
    history_entry = models.NegotiationHistory(
        user_id=current_user.id,
        loan_id=loan.id,
        letter_type=req.letter_type,
        letter_content=result["letter_content"],
        strategy_notes=result["strategy_notes"]
    )
    db.add(history_entry)
    db.commit()
    
    return {
        "loan_id": loan.id,
        "letter_type": req.letter_type,
        "letter_content": result["letter_content"],
        "strategy_notes": result["strategy_notes"]
    }

@app.get("/api/finance/negotiation-history", response_model=List[schemas.NegotiationHistoryResponse])
def get_negotiation_history(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.NegotiationHistory).filter(models.NegotiationHistory.user_id == current_user.id).order_by(models.NegotiationHistory.created_at.desc()).all()
