import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    monthly_income = Column(Float, default=0.0)
    monthly_expenses = Column(Float, default=0.0)

    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    negotiations = relationship("NegotiationHistory", back_populates="user", cascade="all, delete-orphan")

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creditor_name = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    interest_rate = Column(Float, default=0.0)
    emi = Column(Float, default=0.0)
    delinquency_months = Column(Integer, default=0)
    status = Column(String, default="active") # active, settled, defaulted

    user = relationship("User", back_populates="loans")
    settlements = relationship("SettlementRecord", back_populates="loan", cascade="all, delete-orphan")
    negotiations = relationship("NegotiationHistory", back_populates="loan", cascade="all, delete-orphan")

class SettlementRecord(Base):
    __tablename__ = "settlement_records"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    min_predicted_amount = Column(Float, nullable=False)
    max_predicted_amount = Column(Float, nullable=False)
    recommended_amount = Column(Float, nullable=False)
    savings_amount = Column(Float, nullable=False)
    probability = Column(Float, nullable=False) # 0.0 to 1.0
    status = Column(String, default="suggested") # suggested, offered, accepted, rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    loan = relationship("Loan", back_populates="settlements")

class NegotiationHistory(Base):
    __tablename__ = "negotiation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    letter_type = Column(String, nullable=False) # hardship, settlement, dispute
    letter_content = Column(Text, nullable=False)
    strategy_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="negotiations")
    loan = relationship("Loan", back_populates="negotiations")
