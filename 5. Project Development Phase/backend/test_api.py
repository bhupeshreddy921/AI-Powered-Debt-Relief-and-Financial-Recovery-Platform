import json
import urllib.request
import urllib.parse
import urllib.error
import time

BASE_URL = "http://localhost:8000/api"

def make_request(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    encoded_data = None
    if data:
        encoded_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8")
        try:
            parsed_err = json.loads(error_msg)
            return e.code, parsed_err
        except Exception:
            return e.code, error_msg

def run_tests():
    print("Starting API verification tests...")
    
    # 1. Register User
    print("\n1. Testing User Registration...")
    reg_data = {
        "email": f"test_api_{int(time.time())}@example.com",
        "username": "API Test User",
        "password": "apipassword123"
    }
    status, res = make_request(f"{BASE_URL}/auth/register", "POST", reg_data)
    if status != 210 and status != 201:
        print(f"[FAIL] Registration failed: Status {status}, Response: {res}")
        return False
    print(f"[OK] User registered: {res['email']}")
    
    # 2. Login
    print("\n2. Testing User Login...")
    login_data = {
        "email": reg_data["email"],
        "password": reg_data["password"]
    }
    status, token_res = make_request(f"{BASE_URL}/auth/login", "POST", login_data)
    if status != 200:
        print(f"[FAIL] Login failed: Status {status}, Response: {token_res}")
        return False
    token = token_res["access_token"]
    print("[OK] Login successful. Received JWT token.")
    
    # 3. Retrieve Profile
    print("\n3. Testing Get User Profile...")
    status, profile_res = make_request(f"{BASE_URL}/users/me", "GET", token=token)
    if status != 200:
        print(f"[FAIL] Profile retrieval failed: Status {status}")
        return False
    print(f"[OK] Profile verified. Username: {profile_res['username']}")
    
    # 4. Update Profile (Income/Expenses)
    print("\n4. Testing Update Profile...")
    update_data = {"monthly_income": 5000.0, "monthly_expenses": 2000.0}
    status, update_res = make_request(f"{BASE_URL}/users/me", "PUT", update_data, token=token)
    if status != 200 or update_res["monthly_income"] != 5000.0:
        print(f"[FAIL] Profile update failed: Status {status}, Response: {update_res}")
        return False
    print(f"[OK] Budget updated: Income={update_res['monthly_income']}, Expenses={update_res['monthly_expenses']}")
    
    # 5. Add Loan
    print("\n5. Testing Add Loan...")
    loan_data = {
        "creditor_name": "Test Credit Inc",
        "total_amount": 10000.0,
        "interest_rate": 18.5,
        "emi": 300.0,
        "delinquency_months": 5,
        "status": "active"
    }
    status, loan_res = make_request(f"{BASE_URL}/loans", "POST", loan_data, token=token)
    if status != 210 and status != 201:
        print(f"[FAIL] Adding loan failed: Status {status}")
        return False
    loan_id = loan_res["id"]
    print(f"[OK] Loan added successfully. Loan ID: {loan_id}, Creditor: {loan_res['creditor_name']}")
    
    # 6. Financial Analysis
    print("\n6. Testing Financial Health Analysis...")
    status, analysis_res = make_request(f"{BASE_URL}/finance/analysis", "GET", token=token)
    if status != 200:
        print(f"[FAIL] Financial analysis failed: Status {status}")
        return False
    print(f"[OK] Financial analysis complete. DTI: {analysis_res['debt_to_income_ratio']}%, Stress Score: {analysis_res['debt_stress_score']} ({analysis_res['debt_stress_level']})")
    
    # 7. Settlement Prediction
    print("\n7. Testing Settlement Prediction...")
    status, pred_res = make_request(f"{BASE_URL}/finance/predictions/{loan_id}", "GET", token=token)
    if status != 200:
        print(f"[FAIL] Prediction failed: Status {status}")
        return False
    print(f"[OK] Prediction complete. Rec settlement: ${pred_res['recommended_amount']}, Likelihood: {pred_res['probability']*100}%")
    
    # 8. Letter Generation
    print("\n8. Testing Negotiation Letter Generation...")
    letter_data = {
        "loan_id": loan_id,
        "letter_type": "settlement",
        "hardship_reason": "job_loss",
        "custom_context": "Laid off in corporate restructuring."
    }
    status, letter_res = make_request(f"{BASE_URL}/finance/generate-letter", "POST", letter_data, token=token)
    if status != 200:
        print(f"[FAIL] Letter generation failed: Status {status}")
        return False
    print("[OK] Negotiation letter generated successfully. Text preview (first 100 chars):")
    print(f"   \"{letter_res['letter_content'][:100]}...\"")
    
    print("\n[SUCCESS] All integration tests passed successfully!")
    return True

if __name__ == "__main__":
    import sys
    try:
        success = run_tests()
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Test runner encountered error: {e}")
        sys.exit(1)
