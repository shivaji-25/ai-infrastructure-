import os
from urllib.parse import quote_plus
import mysql.connector
from sqlalchemy import create_engine

# Database Configuration (can be overridden with environment variables)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "shivaji25")
DB_NAME = os.getenv("DB_NAME", "infrastructure_db")


def get_connection(database=DB_NAME):
    """Returns a raw MySQL connector connection."""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=database
        )
        return connection
    except mysql.connector.Error as error:
        print("MySQL connection error:", error)
        return None


def get_engine(database=DB_NAME):
    """Returns a SQLAlchemy engine."""
    encoded_password = quote_plus(DB_PASSWORD)
    db_url = f"mysql+mysqlconnector://{DB_USER}:{encoded_password}@{DB_HOST}/{database}"
    return create_engine(db_url)


def init_database():
    """Initializes the database and creates all required tables if they don't exist."""
    print("Checking and initializing database...")
    # First connect without specifying the database to create it if needed
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print("Failed to verify/create database:", err)
        return False

    # Now connect to the database and create tables
    conn = get_connection()
    if conn is None:
        print("Could not connect to database to initialize tables.")
        return False

    cursor = conn.cursor()

    tables = {
        "system_metrics": """
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
        """,
        "anomalies": """
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
        """,
        "incidents": """
            CREATE TABLE IF NOT EXISTS incidents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                anomaly_id INT NOT NULL,
                timestamp DATETIME NOT NULL,
                severity VARCHAR(50) NOT NULL,
                description TEXT,
                recommendation TEXT,
                INDEX idx_incidents_anomaly_id (anomaly_id),
                INDEX idx_incidents_severity (severity),
                CONSTRAINT fk_incidents_anomaly
                    FOREIGN KEY (anomaly_id) REFERENCES anomalies (id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """,
        "predictions": """
            CREATE TABLE IF NOT EXISTS predictions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME NOT NULL,
                predicted_severity VARCHAR(50) NOT NULL,
                recommendation TEXT,
                INDEX idx_predictions_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    }

    for table_name, ddl in tables.items():
        cursor.execute(ddl)
        print(f"Table '{table_name}' verified/ready.")

    conn.commit()
    cursor.close()
    conn.close()
    print("Database initialization complete.")
    return True


if __name__ == "__main__":
    init_database()