import os
import sys
import time
from datetime import datetime

# Ensure project root and ml directory are in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)
ML_DIR = os.path.join(BASE_DIR, "ml")
if ML_DIR not in sys.path:
    sys.path.append(ML_DIR)

try:
    from ml.db_connection import get_connection, init_database
except ImportError:
    from db_connection import get_connection, init_database

import psutil


print("==========================================")
print("       AI INFRASTRUCTURE MONITORING       ")
print("==========================================")

# Ensure tables exist
init_database()

connection = get_connection()

if connection is None:
    print("Could not connect to MySQL. Please check your credentials and MySQL service.")
    exit(1)

cursor = connection.cursor()

print("Connected to MySQL successfully.")
print("Monitoring started...")
print("Press CTRL + C to stop.\n")

# Determine system root drive for disk usage
system_drive = os.getenv("SystemDrive", "C:") + "\\" if os.name == "nt" else "/"

try:
    while True:
        timestamp = datetime.now()

        # Telemetry metrics
        cpu = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory().percent
        try:
            disk = psutil.disk_usage(system_drive).percent
        except Exception:
            disk = psutil.disk_usage("/").percent

        network = psutil.net_io_counters()
        network_sent = network.bytes_sent / (1024 ** 2)
        network_received = network.bytes_recv / (1024 ** 2)

        processes = len(psutil.pids())

        # Display current readings
        print("------------------------------------------")
        print("Timestamp:        ", timestamp.strftime("%Y-%m-%d %H:%M:%S"))
        print(f"CPU Usage:         {cpu}%")
        print(f"Memory Usage:      {memory}%")
        print(f"Disk Usage:        {disk}%")
        print(f"Network Sent:      {round(network_sent, 2)} MB")
        print(f"Network Received:  {round(network_received, 2)} MB")
        print(f"Running Processes: {processes}")

        # Insert into system_metrics
        sql = """
        INSERT INTO system_metrics
        (
            timestamp,
            cpu_usage,
            memory_usage,
            disk_usage,
            network_sent_mb,
            network_received_mb,
            running_processes
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            timestamp,
            cpu,
            memory,
            disk,
            round(network_sent, 2),
            round(network_received, 2),
            processes
        )

        cursor.execute(sql, values)
        connection.commit()

        print("Data stored in MySQL successfully.")
        print("------------------------------------------")

        time.sleep(5)

except KeyboardInterrupt:
    print("\nMonitoring stopped by user.")

finally:
    if cursor:
        cursor.close()
    if connection and connection.is_connected():
        connection.close()
    print("MySQL connection closed.")