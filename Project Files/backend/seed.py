from backend.database import SessionLocal, engine
from backend import models, auth

def seed_db():
    # Recreate tables just in case
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if user already exists
        test_email = "test@example.com"
        exists = db.query(models.User).filter(models.User.email == test_email).first()
        if exists:
            print("Database already seeded.")
            return

        print("Seeding database...")
        
        # 1. Create User
        hashed_password = auth.get_password_hash("password123")
        user = models.User(
            email=test_email,
            username="Alex Miller",
            hashed_password=hashed_password,
            monthly_income=4800.0,
            monthly_expenses=2100.0
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # 2. Create Loans
        loan1 = models.Loan(
            user_id=user.id,
            creditor_name="Capital One",
            total_amount=8500.0,
            interest_rate=24.99,
            emi=250.0,
            delinquency_months=4,
            status="active"
        )
        loan2 = models.Loan(
            user_id=user.id,
            creditor_name="Citi Bank",
            total_amount=14200.0,
            interest_rate=21.99,
            emi=380.0,
            delinquency_months=7,
            status="active"
        )
        loan3 = models.Loan(
            user_id=user.id,
            creditor_name="Chase Card Services",
            total_amount=5600.0,
            interest_rate=18.99,
            emi=180.0,
            delinquency_months=1,
            status="active"
        )
        db.add_all([loan1, loan2, loan3])
        db.commit()
        print("Seeding complete! Log in with test@example.com / password123")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
