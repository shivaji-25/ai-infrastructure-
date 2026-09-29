import React, { useState, useEffect, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Activity,
  Cpu,
  HardDrive,
  Server,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  Sparkles,
  Zap,
  Clock
} from 'lucide-react'

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function App() {
  const [latestMetric, setLatestMetric] = useState(null)
  const [history, setHistory] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [incidents, setIncidents] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('incidents')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [backendStatus, setBackendStatus] = useState('connecting')
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString())

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    try {
      const [latestRes, historyRes, anomaliesRes, incidentsRes, predRes, statsRes] = await Promise.all([
        fetch('/api/metrics/latest').then(r => r.ok ? r.json() : {}),
        fetch('/api/metrics/history?limit=25').then(r => r.ok ? r.json() : []),
        fetch('/api/anomalies?limit=15').then(r => r.ok ? r.json() : []),
        fetch('/api/incidents?limit=15').then(r => r.ok ? r.json() : []),
        fetch('/api/predictions/latest').then(r => r.ok ? r.json() : null),
        fetch('/api/stats').then(r => r.ok ? r.json() : null)
      ])

      setLatestMetric(latestRes)
      setHistory(Array.isArray(historyRes) ? historyRes : [])
      setAnomalies(Array.isArray(anomaliesRes) ? anomaliesRes : [])
      setIncidents(Array.isArray(incidentsRes) ? incidentsRes : [])
      setPrediction(predRes)
      setStats(statsRes)
      setBackendStatus('connected')
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setBackendStatus('error')
    }
  }, [])

  // Auto-refresh timer every 5 seconds (sync with monitor.py)
  useEffect(() => {
    fetchData()
    if (!autoRefresh) return
    const timer = setInterval(() => {
      fetchData()
    }, 5000)
    return () => clearInterval(timer)
  }, [fetchData, autoRefresh])

  // Trigger manual AI pipeline execution
  const runAiPipeline = async () => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/trigger/pipeline', { method: 'POST' })
      const data = await res.json()
      if (data.status === 'success') {
        await fetchData()
      } else {
        alert('AI Pipeline error: ' + (data.stderr || data.message))
      }
    } catch (e) {
      alert('Could not trigger AI pipeline: ' + e.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Chart 1: Telemetry Timeline (CPU & Memory)
  const lineChartData = {
    labels: history.map(item => item.timestamp || ''),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: history.map(item => item.cpu_usage || 0),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2
      },
      {
        label: 'Memory Usage (%)',
        data: history.map(item => item.memory_usage || 0),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2
      }
    ]
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.25)' },
        ticks: { color: '#64748b', maxTicksLimit: 8 }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(51, 65, 85, 0.25)' },
        ticks: { color: '#64748b' }
      }
    }
  }

  // Chart 2: Incident Severity Distribution (Doughnut)
  const severityCounts = stats?.incidents_by_severity || { Normal: 1, Low: 0, Medium: 0, High: 0 }
  const doughnutData = {
    labels: ['Normal', 'Low', 'Medium', 'High'],
    datasets: [
      {
        data: [
          severityCounts.Normal || 0,
          severityCounts.Low || 0,
          severityCounts.Medium || 0,
          severityCounts.High || 0
        ],
        backgroundColor: [
          '#10b981', // emerald
          '#38bdf8', // sky
          '#f59e0b', // amber
          '#f43f5e'  // rose
        ],
        borderColor: '#131b2e',
        borderWidth: 2
      }
    ]
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
      }
    }
  }

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'badge badge-high'
      case 'medium': return 'badge badge-medium'
      case 'low': return 'badge badge-low'
      default: return 'badge badge-normal'
    }
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title-group">
          <h1>
            <Activity className="w-7 h-7 text-indigo-400" />
            AI Infrastructure Monitor
          </h1>
          <p>Real-time telemetry, Isolation Forest anomaly triage & predictive forecasting</p>
        </div>

        <div className="header-controls">
          <div className="live-badge">
            <span className="live-dot"></span>
            {backendStatus === 'connected' ? 'LIVE MONITORING' : 'OFFLINE'}
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn ${autoRefresh ? 'btn-secondary' : 'btn-secondary opacity-60'}`}
            title="Toggle 5s Polling"
          >
            <Clock size={16} />
            {autoRefresh ? 'Auto 5s ON' : 'Auto OFF'}
          </button>

          <button
            onClick={fetchData}
            className="btn btn-secondary"
            title="Refresh immediately"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={runAiPipeline}
            disabled={isAnalyzing}
            className="btn btn-primary"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Run AI Pipeline
              </>
            )}
          </button>
        </div>
      </header>

      {/* Backend Alert if not reachable */}
      {backendStatus === 'error' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <AlertTriangle size={18} />
          <span>
            Cannot connect to the FastAPI backend at <code>http://127.0.0.1:8000</code>.
            Ensure you run <code>python server.py</code> in your project terminal.
          </span>
        </div>
      )}

      {/* AI Prediction Alert Banner */}
      <div className="forecast-card">
        <div className="forecast-left">
          <div className="forecast-icon-circle">
            <Zap size={24} />
          </div>
          <div className="forecast-details">
            <h3>
              AI Incident Forecast:
              <span className={getSeverityBadgeClass(prediction?.predicted_severity || 'Normal')}>
                {prediction?.predicted_severity || 'Normal'}
              </span>
            </h3>
            <p>
              {prediction?.recommendation || 'System operating within safe baseline parameters.'}
            </p>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Last model inference: {prediction?.timestamp || lastUpdated}
        </div>
      </div>

      {/* Real-time Metric Cards */}
      <div className="metrics-grid">
        {/* CPU */}
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">CPU Utilization</span>
            <div className="metric-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Cpu size={18} />
            </div>
          </div>
          <div className="metric-value">
            {latestMetric?.cpu_usage !== undefined ? latestMetric.cpu_usage : '--'}
            <span className="metric-value-unit">%</span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(latestMetric?.cpu_usage || 0, 100)}%`,
                backgroundColor: (latestMetric?.cpu_usage || 0) > 85 ? '#f43f5e' : (latestMetric?.cpu_usage || 0) > 70 ? '#f59e0b' : '#38bdf8'
              }}
            ></div>
          </div>
        </div>

        {/* Memory */}
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Memory (RAM)</span>
            <div className="metric-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <Server size={18} />
            </div>
          </div>
          <div className="metric-value">
            {latestMetric?.memory_usage !== undefined ? latestMetric.memory_usage : '--'}
            <span className="metric-value-unit">%</span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(latestMetric?.memory_usage || 0, 100)}%`,
                backgroundColor: (latestMetric?.memory_usage || 0) > 85 ? '#f43f5e' : '#a855f7'
              }}
            ></div>
          </div>
        </div>

        {/* Disk */}
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Disk Storage</span>
            <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <HardDrive size={18} />
            </div>
          </div>
          <div className="metric-value">
            {latestMetric?.disk_usage !== undefined ? latestMetric.disk_usage : '--'}
            <span className="metric-value-unit">%</span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(latestMetric?.disk_usage || 0, 100)}%`,
                backgroundColor: '#10b981'
              }}
            ></div>
          </div>
        </div>

        {/* Network */}
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Network I/O</span>
            <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Wifi size={18} />
            </div>
          </div>
          <div className="metric-value">
            {latestMetric?.network_received_mb !== undefined ? latestMetric.network_received_mb : '--'}
            <span className="metric-value-unit">MB rx</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.65rem' }}>
            Tx: {latestMetric?.network_sent_mb || 0} MB | Procs: {latestMetric?.running_processes || 0}
          </div>
        </div>
      </div>

      {/* Visual Graphs Section */}
      <div className="charts-grid">
        {/* Real-time Telemetry Graph */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">
              <Activity size={18} className="text-sky-400" />
              Live Telemetry Trends (CPU & Memory %)
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Samples: {history.length}
            </span>
          </div>
          <div className="chart-container">
            {history.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                Waiting for telemetry data... Run monitor.py
              </div>
            )}
          </div>
        </div>

        {/* Incident Severity Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">
              <AlertTriangle size={18} className="text-amber-400" />
              Incident Severity Breakdown
            </span>
          </div>
          <div className="chart-container">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Tabbed Data Tables */}
      <div className="data-section">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={15} />
            Triaged Incidents ({incidents.length})
          </button>

          <button
            className={`tab-btn ${activeTab === 'anomalies' ? 'active' : ''}`}
            onClick={() => setActiveTab('anomalies')}
          >
            <Zap size={15} />
            Detected Anomalies ({anomalies.length})
          </button>

          <button
            className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <Activity size={15} />
            Telemetry Stream ({history.length})
          </button>
        </div>

        {/* Incidents Table */}
        {activeTab === 'incidents' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Severity</th>
                  <th>Diagnostic Summary</th>
                  <th>Action Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length > 0 ? (
                  incidents.map((inc) => (
                    <tr key={inc.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{inc.timestamp}</td>
                      <td>
                        <span className={getSeverityBadgeClass(inc.severity)}>
                          {inc.severity}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, color: '#f1f5f9' }}>{inc.description}</td>
                      <td style={{ color: '#94a3b8' }}>{inc.recommendation}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No incidents logged. Run `python ml/incident_manager.py` or click "Run AI Pipeline".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Anomalies Table */}
        {activeTab === 'anomalies' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>CPU %</th>
                  <th>Memory %</th>
                  <th>Disk %</th>
                  <th>Isolation Score</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.length > 0 ? (
                  anomalies.map((anom) => (
                    <tr key={anom.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{anom.timestamp}</td>
                      <td>
                        <span className={anom.status === 'Anomaly' ? 'badge badge-high' : 'badge badge-normal'}>
                          {anom.status}
                        </span>
                      </td>
                      <td>{anom.cpu_usage}%</td>
                      <td>{anom.memory_usage}%</td>
                      <td>{anom.disk_usage}%</td>
                      <td style={{ fontFamily: 'monospace' }}>
                        {typeof anom.anomaly_score === 'number' ? anom.anomaly_score.toFixed(4) : anom.anomaly_score}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No anomalies recorded yet. Run `python ml/anomaly_model.py`.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Raw Telemetry Table */}
        {activeTab === 'metrics' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>CPU Usage</th>
                  <th>Memory Usage</th>
                  <th>Disk Usage</th>
                  <th>Network Sent</th>
                  <th>Network Received</th>
                  <th>Processes</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? (
                  [...history].reverse().map((m) => (
                    <tr key={m.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{m.timestamp}</td>
                      <td>{m.cpu_usage}%</td>
                      <td>{m.memory_usage}%</td>
                      <td>{m.disk_usage}%</td>
                      <td>{m.network_sent_mb} MB</td>
                      <td>{m.network_received_mb} MB</td>
                      <td>{m.running_processes}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No telemetry stream available. Run `python monitor.py`.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
