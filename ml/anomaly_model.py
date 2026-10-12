import os
import sys
import pandas as pd
from sklearn.ensemble import IsolationForest
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
print("        AI ANOMALY DETECTION              ")
print("==========================================")

# Ensure database tables exist
init_database()
engine = get_engine()

# Read data from MySQL
query = """
SELECT
    id,
    timestamp,
    cpu_usage,
    memory_usage,
    disk_usage,
    network_sent_mb,
    network_received_mb,
    running_processes
FROM system_metrics
ORDER BY id ASC
"""

data = pd.read_sql(query, engine)
print("Total records found:", len(data))

base_features = [
    "cpu_usage",
    "memory_usage",
    "disk_usage",
    "network_sent_mb",
    "network_received_mb",
    "running_processes"
]

valid_data = data.dropna(subset=base_features).copy()

if len(valid_data) < 10:
    print("\nNot enough data.")
    print("Collect at least 10 records first by running monitor.py.")
    engine.dispose()
    exit(0)

# ==========================================
# SPIKE DETECTION (Change vs Previous Record)
# ==========================================
# If previous CPU was 70% and current is 80% (jump >= 10%), it is flagged as a sudden spike
valid_data["cpu_change"] = valid_data["cpu_usage"].diff().fillna(0)
valid_data["memory_change"] = valid_data["memory_usage"].diff().fillna(0)

# Threshold for sudden spike (e.g. 10% increase from previous reading)
SPIKE_THRESHOLD = 10.0
sudden_spike_mask = (valid_data["cpu_change"] >= SPIKE_THRESHOLD) | (valid_data["memory_change"] >= SPIKE_THRESHOLD)

# ==========================================
# MACHINE LEARNING (Isolation Forest)
# ==========================================
# Features include both absolute usage and rate of change (delta)
ml_features = base_features + ["cpu_change", "memory_change"]
X = valid_data[ml_features]

model = IsolationForest(
    n_estimators=100,
    contamination=0.05,
    random_state=42
)

model.fit(X)

predictions = model.predict(X)
scores = model.decision_function(X)

# ==========================================
# STORE RESULTS IN MYSQL
# ==========================================
with engine.begin() as connection:
    # Preserve acknowledged/resolved incident history between AI pipeline runs.
    existing_anomalies = {
        row.metric_id: row.id
        for row in connection.execute(text("SELECT id, metric_id FROM anomalies"))
    }

    for index, prediction in enumerate(predictions):
        row = valid_data.iloc[index]
        metric_id = int(row["id"])
        timestamp = row["timestamp"]

        # Marked as Anomaly if Isolation Forest flagged it (-1) OR if there was a sudden spike (>= 10%)
        is_spike = sudden_spike_mask.iloc[index]
        if prediction == -1 or is_spike:
            status = "Anomaly"
        else:
            status = "Normal"

        anomaly_score = float(scores[index])

        if metric_id in existing_anomalies:
            connection.execute(
                text("""
                    UPDATE anomalies
                    SET timestamp = :timestamp, status = :status, anomaly_score = :anomaly_score
                    WHERE id = :id
                """),
                {
                    "id": existing_anomalies[metric_id],
                    "timestamp": timestamp,
                    "status": status,
                    "anomaly_score": anomaly_score,
                }
            )
        else:
            connection.execute(
                text("""
                INSERT INTO anomalies
                (
                    metric_id,
                    timestamp,
                    status,
                    anomaly_score
                )
                VALUES
                (
                    :metric_id,
                    :timestamp,
                    :status,
                    :anomaly_score
                )
            """),
                {
                    "metric_id": metric_id,
                    "timestamp": timestamp,
                    "status": status,
                    "anomaly_score": anomaly_score
                }
            )

# ==========================================
# DISPLAY RESULTS
# ==========================================
anomalies_detected = sum(
    (predictions == -1) | sudden_spike_mask.values
)
normal_detected = len(valid_data) - anomalies_detected

print("\nAnomaly detection completed successfully.")
print(f"Normal records:    {normal_detected}")
print(f"Anomalies detected: {anomalies_detected} (including sudden spikes >= {SPIKE_THRESHOLD}%)")

print("\nRecent 10 records with changes:")
print(
    valid_data[
        [
            "timestamp",
            "cpu_usage",
            "cpu_change",
            "memory_usage",
            "memory_change",
            "disk_usage"
        ]
    ].tail(10).to_string(index=False)
)

print("\nResults stored in MySQL table: anomalies")
engine.dispose()
