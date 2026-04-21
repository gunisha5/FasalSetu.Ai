"""
train_model.py — Phase 5: Machine Learning Classifier

Trains a Random Forest Classifier on the extracted CSV dataset.
Saves the trained model as a pickle file to be used by the FastAPI engine.
"""

import pandas as pd
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import config
import numpy as np

def train_and_save_model():
    print(f"Loading training data from {config.TRAINING_CSV}...")
    if not config.TRAINING_CSV.exists():
        print("Error: Training data not found. Please run build_dataset.py first.")
        return

    df = pd.read_csv(config.TRAINING_CSV)
    
    # Feature Engineering
    features = [
        'delta_ndvi', 'delta_ndwi', 'delta_sar', 
        'is_historical_flood', 'is_historical_drought',
        'rainfall_mm', 'weather_flood_risk', 'weather_drought_risk'
    ]
    target = 'label'
    
    X = df[features]
    y = df[target]
    
    # Split the dataset
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=config.TEST_SIZE, random_state=config.RANDOM_STATE, stratify=y
    )
    
    # Define Parameter Grid for Optimization
    param_dist = {
        'n_estimators': [50, 100, 200, 300],
        'max_depth': [None, 10, 20, 30],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4],
        'bootstrap': [True, False]
    }

    print("Optimizing Random Forest via RandomizedSearchCV...")
    rf = RandomForestClassifier(random_state=config.RANDOM_STATE)
    search = RandomizedSearchCV(
        estimator=rf, 
        param_distributions=param_dist, 
        n_iter=20, 
        cv=3, 
        verbose=1, 
        n_jobs=-1, 
        random_state=config.RANDOM_STATE
    )
    
    search.fit(X_train, y_train)
    model = search.best_estimator_
    
    print(f"\nBest Parameters Found: {search.best_params_}")
    
    # Evaluation
    print("\n--- Model Evaluation ---")
    predictions = model.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, predictions):.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, predictions))
    print("\nClassification Report:")
    print(classification_report(y_test, predictions))
    
    # Feature Importance
    importances = model.feature_importances_
    print("\n--- Feature Importance ---")
    for name, imp in zip(features, importances):
        print(f"{name:25}: {imp:.4f}")
    
    # Save the Model
    os.makedirs(config.MODEL_PATH.parent, exist_ok=True)
    with open(config.MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"\nSuccess! Optimized model saved to {config.MODEL_PATH}")
    print("The API will now automatically load and use this model.")

if __name__ == "__main__":
    train_and_save_model()
