import os
import datetime
import json
import urllib.request
import urllib.error
from typing import Optional

# Safe fallback generator for when Gemini is offline or API key is missing
def generate_fallback_letter(
    letter_type: str,
    creditor_name: str,
    total_amount: float,
    delinquency_months: int,
    hardship_reason: Optional[str] = None,
    custom_context: Optional[str] = None
) -> dict:
    reason_clean = (hardship_reason or "general_hardship").replace("_", " ").title()
    context_str = f" due to {reason_clean.lower()}" if hardship_reason else ""
    if custom_context:
        context_str += f" ({custom_context})"
        
    date_str = datetime.date.today().strftime("%B %d, %Y")
    
    if letter_type == "hardship":
        content = f"""Date: {date_str}

From:
[Your Name]
[Your Address]
[Your Email / Phone]

To:
Credit Management Department
{creditor_name}

Subject: Hardship Notice & Request for Payment Assistance

Ref: Account Balance: ${total_amount:,.2f} | Delinquency: {delinquency_months} Month(s)

Dear Credit Manager,

I am writing this letter to formally notify you that I am experiencing a severe financial hardship that prevents me from making my scheduled payments on my account. Currently, my payments are {delinquency_months} month(s) past due.

The primary reason for my financial hardship is: {reason_clean}.
{f"Details of my situation: {custom_context}" if custom_context else "This situation has significantly reduced my monthly income and depleted my emergency savings, making it impossible to cover my basic living expenses and maintain regular credit payments."}

I want to pay my debts and wish to work with you in good faith to resolve this situation. I request that you consider me for any temporary relief programs you offer, such as:
1. A temporary suspension of payments (forbearance) for 3 to 6 months.
2. A temporary interest rate reduction to make my monthly obligations manageable.
3. Waiving any late fees or penalty interest accrued during this time.

Please contact me in writing or by phone to discuss options for restructuring my payments. Thank you for your understanding and cooperation.

Sincerely,

[Your Name]
"""
        strategy = (
            f"Lenders like {creditor_name} are typically cooperative with hardship requests if "
            "contacted before the account is charged off (typically 6 months). Be prepared to submit "
            "financial docs (paystubs or tax returns) if they offer a formal hardship program."
        )
        
    elif letter_type == "settlement":
        proposed_amt = round(total_amount * 0.40, 2)  # 40% settlement offer as fallback
        content = f"""Date: {date_str}

From:
[Your Name]
[Your Address]
[Your Email / Phone]

To:
Settlement/Collections Department
{creditor_name}

Subject: Settlement Offer - Account Resolution Request

Ref: Account Balance: ${total_amount:,.2f} | Delinquency: {delinquency_months} Month(s)

Dear Collections Manager,

I am writing to propose a lump-sum settlement to resolve my outstanding account balance with {creditor_name}. My current outstanding balance is ${total_amount:,.2f}, and the account is currently {delinquency_months} month(s) past due.

Due to my ongoing financial difficulties{context_str}, I am unable to repay the full balance. However, I have recently secured a limited lump sum from a relative specifically to resolve my outstanding obligations.

I would like to offer a lump-sum payment of ${proposed_amt:,.2f} (approximately 40% of the total balance) as a full and final settlement of this debt.

If you accept this offer, I require a written agreement signed by an authorized representative stating that:
1. The payment of ${proposed_amt:,.2f} will be accepted as full and final payment, discharging the entire balance.
2. {creditor_name} or its collector will report the account status to all credit bureaus as "Settled in Full" or "Paid in Full".
3. All collection activities, late fees, and interest accruals will immediately cease.
4. The remaining balance of the debt will be fully forgiven and no third party will attempt to collect it.

Upon receiving your written letter confirming these terms, I will send the payment immediately via cashier's check or bank wire.

Sincerely,

[Your Name]
"""
        strategy = (
            f"An offer of 40% is a solid starting offer for {creditor_name}. If they reject, they will "
            "often counter-offer around 45% to 55%. CRITICAL: Never send any funds until you have a signed "
            "settlement agreement letter in writing stating the account is settled in full."
        )
        
    else: # dispute / verification
        content = f"""Date: {date_str}

From:
[Your Name]
[Your Address]
[Your Email / Phone]

To:
Compliance & Debt Verification Department
{creditor_name}

Subject: Request for Debt Verification & Billing Dispute

Ref: Account Balance: ${total_amount:,.2f} | Delinquency: {delinquency_months} Month(s)

Dear Compliance Officer,

I am writing to formally dispute the validity of the debt associated with {creditor_name} and request verification under the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. Section 1692g.

Please provide me with the following information to verify this obligation:
1. Full statement of account showing all charges, interest accrued, fees, and payments.
2. The original contract or agreement bearing my signature.
3. The name and address of the original creditor, if different.
4. Proof of license and authority to collect debt in my state of residence.
5. Verification of the date of default and date of last payment.

If this debt has been sold to a third-party debt collector, please also provide the purchase agreement showing your legal right to collect this specific balance.

Please note that this is a formal dispute and verification request. I expect you to suspend all collection efforts, including reports to credit reporting agencies, until you have provided the requested validation documents.

Sincerely,

[Your Name]
"""
        strategy = (
            "This letter forces third-party collectors to stop collection attempts until they verify the "
            "debt's accuracy. Check your credit reports to ensure they do not report the account as verified "
            "while a dispute is active, which is a violation of the FCRA."
        )
        
    return {
        "letter_content": content,
        "strategy_notes": strategy
    }

def generate_negotiation_letter(
    letter_type: str,
    creditor_name: str,
    total_amount: float,
    delinquency_months: int,
    hardship_reason: Optional[str] = None,
    custom_context: Optional[str] = None
) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return generate_fallback_letter(letter_type, creditor_name, total_amount, delinquency_months, hardship_reason, custom_context)
        
    try:
        hardship_clean = (hardship_reason or "general financial distress").replace("_", " ")
        context_clean = custom_context or "None"
        
        prompt = f"""
        You are an expert financial advocate and debt negotiation specialist. Write a professional, firm, yet polite letter to the creditor '{creditor_name}' regarding an account with an outstanding balance of ${total_amount:,.2f} that is currently {delinquency_months} months delinquent.
        
        Letter Type: {letter_type.upper()} (Options: 'hardship' for temporary relief, 'settlement' for a lump-sum discount settlement, 'dispute' for validation/verification).
        Hardship Reason: {hardship_clean}
        Additional context provided by borrower: {context_clean}
        
        Requirements:
        1. Formulate a formal letter format with brackets for user details (e.g., [Your Name], [Your Address]).
        2. Incorporate the hardship reason and custom context naturally.
        3. Keep the tone appropriate: cooperative but stressed for hardship; firm, cooperative but constrained for settlement; formal and regulatory for dispute.
        4. In the settlement letter, propose a specific settlement percentage and amount (use approximately 35% to 45% depending on delinquency).
        
        Also, provide a short, highly tailored 2-3 sentence strategic tip for the borrower (named 'strategy_notes') on how to deal with '{creditor_name}' for this type of negotiation.
        
        Return your response ONLY as a JSON object with these two keys:
        - "letter_content": "Full letter text"
        - "strategy_notes": "Expert strategy advice"
        
        Do not output any markdown formatting like ```json ... ```. Output raw JSON only.
        """
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        
        with urllib.request.urlopen(req, timeout=15) as response:
            response_data = json.loads(response.read().decode("utf-8"))
            text_response = response_data['candidates'][0]['content']['parts'][0]['text']
            
            # Clean up the output if wrapped in markdown formatting
            text_response = text_response.strip()
            if text_response.startswith("```json"):
                text_response = text_response[7:]
            if text_response.endswith("```"):
                text_response = text_response[:-3]
            text_response = text_response.strip()
            
            result = json.loads(text_response)
            return {
                "letter_content": result.get("letter_content", ""),
                "strategy_notes": result.get("strategy_notes", "")
            }
    except Exception as e:
        print(f"Error calling Gemini API: {e}. Falling back to rule-based generation.")
        return generate_fallback_letter(letter_type, creditor_name, total_amount, delinquency_months, hardship_reason, custom_context)
