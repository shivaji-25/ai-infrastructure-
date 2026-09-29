import os
import sys
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sqlalchemy import text

# Ensure proper module import paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
for path in (CURRENT_DIR, PARENT_DIR):
    if path not in sys.path:
        sys.path.append(path)

try:
    from ml.db_connection import get_engine, init_database
except ImportError:
    from db_connection import get_engine, init_database

print("==========================================")
print("     PREDICTIVE INCIDENT MANAGEMENT       ")
print("==========================================")

init_database()
engine = get_engine()

# Retrieve combined historical telemetry and incident data
query = """
SELECT
    m.id,
    m.timestamp,
    m.cpu_usage,
    m.memory_usage,
    m.disk_usage,
    m.network_sent_mb,
    m.network_received_mb,
    m.running_processes,
    i.severity
FROM system_metrics m
JOIN anomalies a
    ON m.id = a.metric_id
JOIN incidents i
    ON a.id = i.anomaly_id
ORDER BY m.id ASC
"""

data = pd.read_sql(query, engine)

if data.empty:
    print("\nNo historical incident data found.")
    print("Please run anomaly_model.py and incident_manager.py first.")
    engine.dispose()
    sys.exit(0)

print("Total historical records available:", len(data))

# Map severities to numerical labels
severity_mapping = {
    "Normal": 0,
    "Low": 1,
    "Medium": 2,
    "High": 3
}

reverse_mapping = {v: k for k, v in severity_mapping.items()}

data["severity_number"] = data["severity"].map(severity_mapping)
data = data.dropna(subset=["severity_number"]).copy()
data["severity_number"] = data["severity_number"].astype(int)

features = [
    "cpu_usage",
    "memory_usage",
    "disk_usage",
    "network_sent_mb",
    "network_received_mb",
    "running_processes"
]

# Fetch the latest monitoring record for inference
latest_query = """
SELECT
    cpu_usage,
    memory_usage,
    disk_usage,
    network_sent_mb,
    network_received_mb,
    running_processes
FROM system_metrics
ORDER BY id DESC
LIMIT 1
"""

latest = pd.read_sql(latest_query, engine)

if latest.empty:
    print("\nNo live telemetry records found in system_metrics.")
    print("Run monitor.py to collect live system metrics.")
    engine.dispose()
    sys.exit(0)

latest_features = latest[features]

# Check if we have multiple classes to train a classifier
unique_classes = data["severity_number"].nunique()

if unique_classes >= 2:
    X = data[features]
    y = data["severity_number"]

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    # Train Random Forest Classifier
    print("\nTraining Random Forest prediction model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Evaluation Accuracy: {round(accuracy * 100, 2)}%")

    # Predict future severity for latest record
    prediction_num = int(model.predict(latest_features)[0])
    predicted_severity = reverse_mapping.get(prediction_num, "Normal")

else:
    # Fallback heuristic if historical records only have one severity class (e.g. all Normal)
    only_class = data["severity"].iloc[0]
    print(f"\nNotice: Historical data contains only 1 severity class ('{only_class}').")
    print("Evaluating live record using baseline telemetry thresholds...")

    latest_cpu = float(latest["cpu_usage"].iloc[0])
    latest_mem = float(latest["memory_usage"].iloc[0])
    latest_disk = float(latest["disk_usage"].iloc[0])
    peak = max(latest_cpu, latest_mem, latest_disk)

    if peak >= 90:
        predicted_severity = "High"
    elif peak >= 75:
        predicted_severity = "Medium"
    elif peak >= 50:
        predicted_severity = "Low"
    else:
        predicted_severity = "Normal"

# Formulate recommendation
if predicted_severity == "Normal":
    recommendation = "System is operating stably. Routine monitoring advised."
elif predicted_severity == "Low":
    recommendation = "Minor utilization noted. Continue observing system resources."
elif predicted_severity == "Medium":
    recommendation = "Elevated system load. Administrator investigation recommended."
else:
    recommendation = "High resource saturation! Immediate administrator action required."

print("\n==========================================")
print("           PREDICTION RESULT              ")
print("==========================================")
print(f"Predicted Severity : {predicted_severity}")
print(f"Recommendation     : {recommendation}")

# Store prediction in MySQL
with engine.begin() as conn:
    conn.execute(
        text("""
            INSERT INTO predictions
            (
                timestamp,
                predicted_severity,
                recommendation
            )
            VALUES (NOW(), :severity, :recommendation)
        """),
        {
            "severity": predicted_severity,
            "recommendation": recommendation
        }
    )

print("\nPrediction stored in MySQL table: predictions")
engine.dispose()