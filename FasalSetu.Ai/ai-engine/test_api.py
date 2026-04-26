import requests

url = "http://127.0.0.1:8000/predict"
data = {
    "latitude": 20.5937,
    "longitude": 78.9629,
    "claim_date": "2023-01-01",
    "district": "Vidarbha",
    "crop": "wheat",
    "lang": "en"
}

try:
    response = requests.post(url, data=data, timeout=5)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Request failed:", e)
