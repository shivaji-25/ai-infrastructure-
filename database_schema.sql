
CREATE DATABASE IF NOT EXISTS infrastructure_db;
USE infrastructure_db;

-- 1. Table: system_metrics
-- Stores live hardware & OS telemetry collected by monitor.py
CREATE TABLE IF NOT EXISTS system_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    cpu_usage FLOAT NOT NULL,
    memory_usage FLOAT NOT NULL,
    disk_usage FLOAT NOT NULL,
    network_sent_mb FLOAT NOT NULL,
    network_received_mb FLOAT NOT NULL,
    running_processes INT NOT NULL,
    INDEX idx_metrics_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table: anomalies
-- Stores anomaly detection results from anomaly_model.py
CREATE TABLE IF NOT EXISTS anomalies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_id INT NOT NULL,
    timestamp DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    anomaly_score FLOAT NOT NULL,
    INDEX idx_anomalies_metric_id (metric_id),
    INDEX idx_anomalies_timestamp (timestamp),
    CONSTRAINT fk_anomalies_metric
        FOREIGN KEY (metric_id) REFERENCES system_metrics (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table: incidents
-- Stores triaged incidents with severity and recommendations from incident_manager.py
CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anomaly_id INT NOT NULL,
    timestamp DATETIME NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT,
    recommendation TEXT,
    workflow_status VARCHAR(20) NOT NULL DEFAULT 'Open',
    acknowledged_by VARCHAR(100) NULL,
    acknowledged_at DATETIME NULL,
    resolved_by VARCHAR(100) NULL,
    resolved_at DATETIME NULL,
    INDEX idx_incidents_anomaly_id (anomaly_id),
    INDEX idx_incidents_severity (severity),
    INDEX idx_incidents_workflow_status (workflow_status),
    CONSTRAINT fk_incidents_anomaly
        FOREIGN KEY (anomaly_id) REFERENCES anomalies (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table: predictions
-- Stores future incident forecasts from incident_predictor.py
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    predicted_severity VARCHAR(50) NOT NULL,
    recommendation TEXT,
    risk_window_minutes INT NULL,
    confidence_score FLOAT NULL,
    INDEX idx_predictions_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
