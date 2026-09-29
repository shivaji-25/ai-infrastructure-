import os
import sys

# Ensure proper module import paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
for path in (CURRENT_DIR, PARENT_DIR):
    if path not in sys.path:
        sys.path.append(path)

try:
    from ml.db_connection import get_connection
except ImportError:
    from db_connection import get_connection

print("==========================================")
print("          INCIDENT MANAGEMENT             ")
print("==========================================")

connection = get_connection()
if connection is None:
    print("Could not connect to MySQL.")
    sys.exit(1)

cursor = connection.cursor(dictionary=True)

# Query anomalies joined with system metrics
query = """
SELECT
    a.id AS anomaly_id,
    a.timestamp,
    a.status,
    m.cpu_usage,
    m.memory_usage,
    m.disk_usage
FROM anomalies a
JOIN system_metrics m
ON a.metric_id = m.id
ORDER BY a.id ASC
"""

cursor.execute(query)
rows = cursor.fetchall()

if not rows:
    print("No anomaly records found in the database.")
    print("Please run anomaly_model.py first.")
    cursor.close()
    connection.close()
    sys.exit(0)

# Clear previous incidents to keep state synced
delete_cursor = connection.cursor()
delete_cursor.execute("DELETE FROM incidents")
connection.commit()
delete_cursor.close()


def calculate_severity(row):
    """Calculates incident severity based on status and resource usage."""
    if row["status"] == "Normal":
        return "Normal"

    cpu = row["cpu_usage"]
    memory = row["memory_usage"]
    disk = row["disk_usage"]

    highest_usage = max(cpu, memory, disk)

    if highest_usage >= 90:
        return "High"
    elif highest_usage >= 75:
        return "Medium"
    else:
        return "Low"


def get_description(row):
    """Constructs a descriptive diagnostic message of the root cause."""
    if row["status"] == "Normal":
        return "No incident detected"

    problems = []
    if row["cpu_usage"] >= 90:
        problems.append("Critical CPU saturation (>=90%)")
    elif row["cpu_usage"] >= 75:
        problems.append("High CPU usage (>=75%)")

    if row["memory_usage"] >= 90:
        problems.append("Critical memory saturation (>=90%)")
    elif row["memory_usage"] >= 75:
        problems.append("High memory usage (>=75%)")

    if row["disk_usage"] >= 90:
        problems.append("Critical disk space warning (>=90%)")
    elif row["disk_usage"] >= 75:
        problems.append("High disk usage (>=75%)")

    if not problems:
        return "Abnormal system behavior / sudden metric spike"

    return ", ".join(problems)


def get_recommendation(severity):
    """Provides operational guidance based on incident severity."""
    if severity == "Normal":
        return "System operating normally."
    elif severity == "Low":
        return "Continue monitoring system resources."
    elif severity == "Medium":
        return "Administrator investigation recommended."
    elif severity == "High":
        return "Immediate administrator intervention required to prevent service degradation."
    return "Check system health."


insert_cursor = connection.cursor()
sql = """
INSERT INTO incidents
(
    anomaly_id,
    timestamp,
    severity,
    description,
    recommendation
)
VALUES (%s, %s, %s, %s, %s)
"""

for row in rows:
    severity = calculate_severity(row)
    description = get_description(row)
    recommendation = get_recommendation(severity)

    insert_cursor.execute(
        sql,
        (
            row["anomaly_id"],
            row["timestamp"],
            severity,
            description,
            recommendation
        )
    )

connection.commit()
insert_cursor.close()

print("Incident triage completed successfully.")

# Display summary
summary_cursor = connection.cursor(dictionary=True)
summary_cursor.execute("""
SELECT severity, COUNT(*) AS total
FROM incidents
GROUP BY severity
ORDER BY FIELD(severity, 'High', 'Medium', 'Low', 'Normal')
""")
summary = summary_cursor.fetchall()

print("\nIncident Severity Summary:")
for item in summary:
    print(f"  {item['severity']:<10}: {item['total']}")

print("\nResults stored in MySQL table: incidents")

summary_cursor.close()
cursor.close()
connection.close()