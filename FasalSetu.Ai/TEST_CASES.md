# FasalSetu.Ai — 5 Detailed Demo Test Cases

Use these specific scenarios to demonstrate the AI's intelligence across different environmental conditions.

## 1. 🌊 Scenario: High Flood Detection
*   **District**: Lakhimpur | **Village**: Panigaon (Assam)
*   **Crop**: Rice (Paddy)
*   **Farm Size**: 5.5 Acres
*   **Location**: `27.23, 94.10` | **Date**: July 15, 2024
*   **--- EXPECTED RESULTS ---**
*   **Result**: FLOOD
*   **Damage**: ~77.00%
*   **Confidence**: ~85%
*   **Est. Payout**: ~₹23,100 (assuming ₹50k Sum Insured)

## 2. 🏜️ Scenario: Severe Drought Detection
*   **District**: Beed | **Village**: Pali (Maharashtra)
*   **Crop**: Cotton
*   **Farm Size**: 4.0 Acres
*   **Location**: `18.99, 75.76` | **Date**: May 10, 2024
*   **--- EXPECTED RESULTS ---**
*   **Result**: DROUGHT
*   **Damage**: ~81.00%
*   **Confidence**: ~88%
*   **Est. Payout**: ~₹32,400 (assuming ₹50k Sum Insured)

## 3. 🌧️ Scenario: Moderate Flood Detection
*   **District**: Barpeta | **Village**: Sarthebari (Assam)
*   **Crop**: Rice
*   **Farm Size**: 3.0 Acres
*   **Location**: `26.32, 91.00` | **Date**: August 05, 2024
*   **--- EXPECTED RESULTS ---**
*   **Result**: FLOOD
*   **Damage**: ~58.00%
*   **Confidence**: ~65%
*   **Est. Payout**: ~₹17,400

## 4. ⚠️ Scenario: Manual Review / Warning
*   **District**: Akola | **Village**: Balapur (Maharashtra)
*   **Crop**: Soybean
*   **Farm Size**: 6.0 Acres
*   **Location**: `20.70, 77.00` | **Date**: June 01, 2024
*   **--- EXPECTED RESULTS ---**
*   **Result**: DROUGHT
*   **Damage**: ~45.00%
*   **Confidence**: < 50% (**Will trigger a Yellow Warning alert**)
*   **Est. Payout**: ~₹18,000

## 5. ✅ Scenario: Normal Crop Health (The "47%" Case)
*   **District**: Ambala | **Village**: Naraingarh (Haryana)
*   **Crop**: Wheat
*   **Farm Size**: 5.0 Acres
*   **Location**: `30.37, 76.77` | **Date**: October 20, 2024
*   **--- EXPECTED RESULTS ---**
*   **Result**: NORMAL
*   **Damage**: ~3.50% (Baseline simulation)
*   **Confidence**: ~47% (As requested)
*   **Est. Payout**: ~₹172 (10% coverage applied)

---

### 🚀 Tips for a Great Demo:
1. **Upload a Policy**: Always use the "Standard_Crop_Policy_Template" to show PDF parsing.
2. **Dashboard Workflow**: File Case #4, then log in as an Agent to "Review" it and add a remark.
3. **PDF Reports**: Download the report for Case #1 to show the professional audit trail.
