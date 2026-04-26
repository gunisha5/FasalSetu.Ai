import pickle
import os
import sys

# Add parent directory to sys.path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def run_debug_test():
    model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), config.MODEL_PATH)
    
    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found at {model_path}")
        return

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    def run_case(name, vector):
        print(f"\n>>> TEST CASE: {name}")
        print(f"Input Vector: {vector}")
        probs = model.predict_proba(vector)[0]
        pred = model.predict(vector)[0]
        print(f"Result: {pred}")
        print(f"Probabilities: {dict(zip(model.classes_, probs))}")

    # 1. Flood Case (High damage indicators)
    # [delta_ndvi, delta_ndwi, delta_sar, is_flood, is_drought, rain, w_f, w_d]
    run_case("FLOOD (High Damage)", [[-0.45, 0.35, -15.0, 1, 0, 300.0, 1, 0]])

    # 2. Healthy Case (Minimal change)
    run_case("HEALTHY (Low Damage)", [[0.02, -0.01, -0.5, 0, 0, 15.0, 0, 0]])

if __name__ == "__main__":
    run_debug_test()
