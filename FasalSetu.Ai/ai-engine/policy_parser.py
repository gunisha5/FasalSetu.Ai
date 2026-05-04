def extract_policy_text(file_path):
    import fitz
    text = ""

    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()

    print("Policy Text Preview:", text[:500])
    return text

def parse_policy_json(text):
    import re
    
    # Regex patterns
    sum_insured_pattern = r"Sum Insured[:=]\s*(?:₹)?(\d+)"
    drought_pattern = r"Drought Coverage:\s*(\d+)%"
    flood_pattern = r"Flood Coverage:\s*(\d+)%"
    max_claim_pattern = r"Maximum Claim:\s*(?:₹)?(\d+)"
    
    # Extractions
    sum_insured_match = re.search(sum_insured_pattern, text)
    drought_match = re.search(drought_pattern, text)
    flood_match = re.search(flood_pattern, text)
    max_claim_match = re.search(max_claim_pattern, text)
    
    sum_insured = int(sum_insured_match.group(1)) if sum_insured_match else 0
    coverage_drought = float(drought_match.group(1)) / 100.0 if drought_match else 0.0
    coverage_flood = float(flood_match.group(1)) / 100.0 if flood_match else 0.0
    max_claim = int(max_claim_match.group(1)) if max_claim_match else 0
    
    # Debug prints
    print(f"[DEBUG] Extracted Sum Insured: {sum_insured}")
    print(f"[DEBUG] Extracted Drought Coverage: {coverage_drought}")
    print(f"[DEBUG] Extracted Flood Coverage: {coverage_flood}")
    print(f"[DEBUG] Extracted Max Claim: {max_claim}")
    
    policy = {
        "sum_insured": sum_insured,
        "coverage": {
            "DROUGHT": coverage_drought,
            "FLOOD": coverage_flood,
            "NORMAL": 0.10  # 10% baseline coverage for demo payouts
        },
        "max_claim": max_claim
    }
    
    return policy

def validate_policy_data(policy):
    """
    Validates the parsed policy data based on business rules.
    
    Rules:
    - sum_insured must exist (raise ValueError if missing/zero)
    - coverage values must be between 0 and 1
    - max_claim <= sum_insured
    
    Defaults:
    - coverage -> 0.7 if missing (0.0)
    - max_claim -> sum_insured if missing (0.0)
    """
    # 1. sum_insured must exist
    if not policy.get("sum_insured") or policy["sum_insured"] <= 0:
        raise ValueError("Invalid Policy: sum_insured is missing or zero.")
    
    sum_insured = policy["sum_insured"]
    
    # 2. Set defaults for missing values
    coverage = policy.get("coverage", {})
    if coverage.get("DROUGHT") == 0.0:
        coverage["DROUGHT"] = 0.7
        print("[INFO] Drought coverage missing. Defaulting to 0.7")
        
    if coverage.get("FLOOD") == 0.0:
        coverage["FLOOD"] = 0.7
        print("[INFO] Flood coverage missing. Defaulting to 0.7")
        
    if not policy.get("max_claim") or policy["max_claim"] == 0:
        policy["max_claim"] = sum_insured
        print(f"[INFO] Max claim missing. Defaulting to sum_insured: {sum_insured}")
        
    # 3. Validate ranges
    for hazard, val in coverage.items():
        if not (0 <= val <= 1):
            raise ValueError(f"Invalid {hazard} coverage: {val}. Must be between 0 and 1.")
            
    # 4. max_claim <= sum_insured
    if policy["max_claim"] > sum_insured:
        print(f"[WARNING] Max claim {policy['max_claim']} exceeds sum insured {sum_insured}. Capping to sum insured.")
        policy["max_claim"] = sum_insured
        
    return policy

def calculate_damage(evaluation_result, policy):
    """
    Returns the raw AI-detected damage probability (0.0 to 1.0).
    """
    status = getattr(evaluation_result, 'status', 'INCONCLUSIVE')
    flood_prob = getattr(evaluation_result, 'flood_probability', 0.0)
    drought_prob = getattr(evaluation_result, 'drought_probability', 0.0)
    
    damage_ratio = max(flood_prob, drought_prob)
    
    print(f"[DEBUG] AI Damage Detection -> Status: {status}, Raw Damage: {damage_ratio:.2%}")
    return damage_ratio

def estimate_claim(damage_percent, prediction, policy):
    sum_insured = float(policy["sum_insured"])
    coverage = float(policy["coverage"].get(prediction, 0))
    damage_fraction = float(damage_percent) / 100

    claim_amount = sum_insured * damage_fraction * coverage

    print("[FINAL DEBUG]", sum_insured, damage_fraction, coverage, claim_amount)

    return round(claim_amount, 2)

def generate_explanation(prediction, damage, policy, claim):
    """
    Generates a human-readable explanation for the claim estimation.
    """
    if prediction == "NORMAL":
        return f"Minimal environmental variance detected ({damage}%). A small payout has been estimated based on baseline policy coverage for minor crop health fluctuations."
    
    coverage_val = policy.get("coverage", {}).get(prediction, 0.0)
    
    return f"""
AI Analysis complete. {prediction} detected with {damage}% estimated crop damage.
Policy coverage applied: {int(coverage_val * 100)}%
Estimated claim based on your policy terms.
""".strip()

if __name__ == "__main__":
    sample_text = """
    Insurance Policy Details:
    Sum Insured: ₹50000
    Drought Coverage: 80%
    Flood Coverage: 90%
    Maximum Claim: ₹50000
    """
    
    parsed_policy = parse_policy_json(sample_text)
    validated_policy = validate_policy_data(parsed_policy)
    
    # Mock evaluation result for testing
    from dataclasses import dataclass
    @dataclass
    class MockEval:
        status: str
        flood_probability: float
        drought_probability: float
    
    mock_eval = MockEval(status="APPROVED_FLOOD", flood_probability=0.95, drought_probability=0.05)
    
    damage_ratio = calculate_damage(mock_eval, validated_policy)
    damage_percent = float(damage_ratio * 100)
    payout = estimate_claim(damage_percent, "FLOOD", validated_policy)
    
    print("\nFinal Validated Policy JSON:")
    import json
    print(json.dumps(validated_policy, indent=4))
    print(f"\nFinal Estimation: INR {payout}")
