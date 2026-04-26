from policy_parser import parse_policy_json, validate_policy_data
import json

test_text = """
Sum Insured: ₹100000
"""

print("Testing with missing coverage and max_claim:")
parsed = parse_policy_json(test_text)
validated = validate_policy_data(parsed)
print(json.dumps(validated, indent=4))
