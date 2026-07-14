# AI-Driven Debt Relief & Financial Recovery Platform

An intelligent, end-to-end web application developed to simplify and automate the debt management and financial recovery process for borrowers. The platform enables users to manage loan details, analyze financial health metrics, forecast settlement target ranges, and generate customized negotiation/hardship documents using Google Gemini AI.

---

## 👥 Team Members & Roles

| Member | Name | Role | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Yogeswararao** | **Database & Backend Developer** | Database schema design, SQLite configuration, SQLAlchemy CRUD operations, JWT authentication tokens, and mock data seeding scripts. |
| **Member 2** | **Lalith Prava** | **AI & Financial Processing Engineer** | Debt stress score algorithms, Debt-To-Income (DTI) ratio analytics, Gemini API letter template schemas, and local fallback generators. |
| **Member 3** | **Chaitanya Prasanna Kumar** | **Frontend & UI/UX Developer** | React SPA assembly, custom Claymorphism CSS design system, responsive dashboards, interactive sliders, and clipboard integrations. |

---

## 📊 Modeled Debt Stress Levels

The application computes a multi-factor **Debt Stress Score** (0-100) based on DTI, monthly cash surplus, and delinquency duration, classifying users into four operational recovery states:

| Stress Level | Score Range | Description | Recommended AI Action |
| :--- | :--- | :--- | :--- |
| 🟢 **Low** | `0 - 19` | Total EMI is under 20% of income, positive monthly surplus, no delinquent accounts. | Maintain current payments; set aside emergency savings. |
| 🟡 **Moderate** | `20 - 44` | EMI is 20%-36% of income, small cash surplus, 1-2 months delinquent. | Monitor balances; run early settlement simulations. |
| 🟠 **High** | `45 - 69` | EMI is 36%-50% of income, negative surplus, 3-5 months delinquent. | Draft temporary payment pause or interest reduction letters. |
| 🔴 **Critical** | `70 - 100` | EMI exceeds 50% of income, severe monthly cash deficit, 6+ months delinquent. | Draft lump-sum settlement negotiation letters immediately. |

---

## 📂 Project Structure

```text
AI-Powered-Debt-Relief-and-Financial-Recovery-Platform/
├── README.md                          <- Project overview and documentation (This file)
├── .gitignore                         <- Rules to ignore local databases, build files, and node packages
├── Document/                          <- Folder for project reports and academic documents
│   └── readme.md
├── Video Demo/                        <- Folder for video demonstrations and screencasts
│   └── readme.md
└── Project Files/                     <- Complete functional codebase
    ├── index.html                     <- Single-page application template wrapper
    ├── vite.config.js                 <- React Vite configuration
    ├── package.json                   <- Node dependencies (React, Lucide-React, Vite)
    ├── start_app.bat                  <- Windows double-clickable launcher script
    ├── src/                           <- React Frontend Source
    │   ├── main.jsx                   <- App mounting logic
    │   ├── App.jsx                    <- Layout router, tabs navigation, and Auth validation
    │   ├── index.css                  <- Custom Claymorphism CSS style system (inner/outer shadows)
    │   └── pages/                     <- View templates
    │       ├── Auth.jsx               <- Login & register pages with quick demo access
    │       ├── Dashboard.jsx          <- Financial metrics overview and recommendation cards
    │       ├── Loans.jsx              <- Account balance manager and status switches
    │       ├── SettlementPredictor.jsx <- Interactive settlement calculators & installment estimators
    │       └── LetterGenerator.jsx    <- Letter composer and copy/download controls
    └── backend/                       <- FastAPI Backend Source
        ├── requirements.txt           <- Python dependencies (FastAPI, SQLite, SQLAlchemy, bcrypt, PyJWT)
        ├── main.py                    <- API routes mapping and database creation triggers
        ├── auth.py                    <- Password encryption & JWT token decryption handlers
        ├── database.py                <- DB engine session factories
        ├── models.py                  <- SQLite Database models (User, Loan, Settlement, History)
        ├── schemas.py                 <- Pydantic validation structures
        ├── financial_processing.py    <- Surplus calculations and DTI stress logic
        ├── settlement_prediction.py   <- Delinquency-based settlement forecast ranges
        ├── gemini_service.py          <- Gemini AI prompt builders and standard fallbacks
        ├── seed.py                    <- Mock data DB population scripts
        └── test_api.py                <- Automation integration test scripts
```

---

## 🛠️ Setup & Run Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/bhupeshreddy921/AI-Powered-Debt-Relief-and-Financial-Recovery-Platform.git
cd AI-Powered-Debt-Relief-and-Financial-Recovery-Platform
```

### 2. Configure Environment variables (Optional)
Create an environment variable (or a `.env` file inside `Project Files/backend`) to enable customized AI letter generation:
```bash
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(If no API key is provided, the application will automatically fall back to its local, rule-based document compiler so it runs completely out-of-the-box).*

### 3. Run the Platform (Windows Launcher)
Double-click the **`start_app.bat`** file located inside the `Project Files` directory. It will automatically:
1. Spin up the FastAPI backend on `http://127.0.0.1:8000`
2. Start the React Vite server on `http://127.0.0.1:5175`
3. Launch your default web browser directly to the application.

### 4. Demo Login Credentials
To immediately explore the dashboard with pre-seeded creditor accounts, click **Login** and enter:
- **Email:** `test@example.com`
- **Password:** `password123`