import os
import sys
import subprocess
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector

# Ensure root directory and ml are in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from ml.db_connection import get_connection, init_database

app = FastAPI(title="AI Infrastructure Monitoring API", version="1.0.0")

# Enable CORS for React frontend (Vite defaults to 5173, React defaults to 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Ensure database tables exist on server launch."""
    init_database()


@app.get("/api/health")
def health_check():
    conn = get_connection()
    if conn is None:
        return {"status": "degraded", "database": "disconnected"}
    conn.close()
    return {"status": "ok", "database": "connected", "timestamp": datetime.now().isoformat()}


@app.get("/api/metrics/latest")
def get_latest_metrics():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, timestamp, cpu_usage, memory_usage, disk_usage,
               network_sent_mb, network_received_mb, running_processes
        FROM system_metrics
        ORDER BY id DESC
        LIMIT 1
    """)
    record = cursor.fetchone()
    cursor.close()
    conn.close()
    if not record:
        return {}
    if isinstance(record.get("timestamp"), datetime):
        record["timestamp"] = record["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
    return record


@app.get("/api/metrics/history")
def get_metrics_history(limit: int = Query(default=30, ge=5, le=200)):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, timestamp, cpu_usage, memory_usage, disk_usage,
               network_sent_mb, network_received_mb, running_processes
        FROM (
            SELECT * FROM system_metrics
            ORDER BY id DESC
            LIMIT %s
        ) sub
        ORDER BY id ASC
    """, (limit,))
    records = cursor.fetchall()
    cursor.close()
    conn.close()

    for r in records:
        if isinstance(r.get("timestamp"), datetime):
            r["timestamp"] = r["timestamp"].strftime("%H:%M:%S")
    return records


@app.get("/api/anomalies")
def get_anomalies(limit: int = Query(default=20, ge=1, le=100)):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.id, a.metric_id, a.timestamp, a.status, a.anomaly_score,
               m.cpu_usage, m.memory_usage, m.disk_usage
        FROM anomalies a
        JOIN system_metrics m ON a.metric_id = m.id
        ORDER BY a.id DESC
        LIMIT %s
    """, (limit,))
    records = cursor.fetchall()
    cursor.close()
    conn.close()

    for r in records:
        if isinstance(r.get("timestamp"), datetime):
            r["timestamp"] = r["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
    return records


@app.get("/api/incidents")
def get_incidents(limit: int = Query(default=20, ge=1, le=100)):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, anomaly_id, timestamp, severity, description, recommendation,
               workflow_status, acknowledged_by, acknowledged_at, resolved_by, resolved_at
        FROM incidents
        ORDER BY id DESC
        LIMIT %s
    """, (limit,))
    records = cursor.fetchall()
    cursor.close()
    conn.close()

    for r in records:
        if isinstance(r.get("timestamp"), datetime):
            r["timestamp"] = r["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
    return records


@app.get("/api/predictions/latest")
def get_latest_prediction():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, timestamp, predicted_severity, recommendation,
               risk_window_minutes, confidence_score
        FROM predictions
        ORDER BY id DESC
        LIMIT 1
    """)
    record = cursor.fetchone()
    cursor.close()
    conn.close()

    if not record:
        return {
            "predicted_severity": "Normal",
            "recommendation": "No predictions computed yet. Run AI pipeline.",
            "risk_window_minutes": None,
            "confidence_score": None,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    if isinstance(record.get("timestamp"), datetime):
        record["timestamp"] = record["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
    return record


@app.patch("/api/incidents/{incident_id}/status")
def update_incident_status(
    incident_id: int,
    workflow_status: str = Query(...),
    actor: Optional[str] = Query(default="Dashboard user", max_length=100),
):
    """Acknowledge or resolve an incident from the dashboard."""
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    if workflow_status not in {"Open", "Acknowledged", "Resolved"}:
        conn.close()
        raise HTTPException(status_code=422, detail="workflow_status must be Open, Acknowledged, or Resolved")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM incidents WHERE id = %s", (incident_id,))
    if cursor.fetchone() is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    if workflow_status == "Acknowledged":
        cursor.execute(
            """
            UPDATE incidents
            SET workflow_status = %s, acknowledged_by = %s, acknowledged_at = NOW(),
                resolved_by = NULL, resolved_at = NULL
            WHERE id = %s
            """,
            (workflow_status, actor, incident_id),
        )
    elif workflow_status == "Resolved":
        cursor.execute(
            """
            UPDATE incidents
            SET workflow_status = %s, resolved_by = %s, resolved_at = NOW()
            WHERE id = %s
            """,
            (workflow_status, actor, incident_id),
        )
    else:
        cursor.execute(
            """
            UPDATE incidents
            SET workflow_status = 'Open', acknowledged_by = NULL, acknowledged_at = NULL,
                resolved_by = NULL, resolved_at = NULL
            WHERE id = %s
            """,
            (incident_id,),
        )

    conn.commit()
    cursor.execute(
        """
        SELECT id, workflow_status, acknowledged_by, acknowledged_at, resolved_by, resolved_at
        FROM incidents WHERE id = %s
        """,
        (incident_id,),
    )
    incident = cursor.fetchone()
    cursor.close()
    conn.close()
    for key in ("acknowledged_at", "resolved_at"):
        if isinstance(incident.get(key), datetime):
            incident[key] = incident[key].strftime("%Y-%m-%d %H:%M:%S")
    return incident


@app.get("/api/stats")
def get_dashboard_stats():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS total_metrics FROM system_metrics")
    total_metrics = cursor.fetchone()["total_metrics"]

    cursor.execute("SELECT COUNT(*) AS total_anomalies FROM anomalies WHERE status = 'Anomaly'")
    total_anomalies = cursor.fetchone()["total_anomalies"]

    cursor.execute("""
        SELECT severity, COUNT(*) AS count
        FROM incidents
        GROUP BY severity
    """)
    incident_counts = {row["severity"]: row["count"] for row in cursor.fetchall()}

    cursor.execute("SELECT COUNT(*) AS count FROM incidents WHERE workflow_status = 'Open'")
    open_incidents = cursor.fetchone()["count"]

    cursor.close()
    conn.close()

    return {
        "total_metrics": total_metrics,
        "total_anomalies": total_anomalies,
        "incidents_by_severity": incident_counts,
        "open_incidents": open_incidents,
    }


@app.post("/api/trigger/pipeline")
def trigger_ai_pipeline():
    """Runs anomaly detection, incident triage, and prediction sequentially."""
    results = {}
    try:
        r1 = subprocess.run([sys.executable, os.path.join(BASE_DIR, "ml", "anomaly_model.py")], capture_output=True, text=True, check=True)
        results["anomaly_model"] = "Success"
        r2 = subprocess.run([sys.executable, os.path.join(BASE_DIR, "ml", "incident_manager.py")], capture_output=True, text=True, check=True)
        results["incident_manager"] = "Success"
        r3 = subprocess.run([sys.executable, os.path.join(BASE_DIR, "ml", "incident_predictor.py")], capture_output=True, text=True, check=True)
        results["incident_predictor"] = "Success"
        return {"status": "success", "message": "AI Pipeline executed successfully", "details": results}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "message": str(e), "stderr": e.stderr}


@app.post("/api/simulate-spike")
def simulate_metric_spike():
    """Inserts a synthetic high-utilization metric spike for testing anomaly detection."""
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor()
    sql = """
    INSERT INTO system_metrics
    (timestamp, cpu_usage, memory_usage, disk_usage, network_sent_mb, network_received_mb, running_processes)
    VALUES (NOW(), 94.8, 89.2, 78.5, 45.2, 112.6, 245)
    """
    cursor.execute(sql)
    conn.commit()
    cursor.close()
    conn.close()
    return {"status": "success", "message": "Injected spike: CPU 94.8%, Memory 89.2%"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
