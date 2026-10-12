import { alerts, application, incidents, metrics, predictions } from '../data/mockData'

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))
const copy = (value) => JSON.parse(JSON.stringify(value))
const metricState = copy(metrics)
const alertState = copy(alerts)

function advanceMetrics() {
  metricState.forEach((metric) => {
    const spread = metric.name === 'Network' ? 2 : 5
    const next = Math.max(0, Math.min(99, Number((metric.value + (Math.random() * spread * 2 - spread)).toFixed(metric.name === 'Network' ? 1 : 0))))
    metric.value = next
    metric.status = next >= 85 ? 'Critical' : next >= 65 ? 'Warning' : 'Normal'
    metric.history = [...metric.history.slice(-11), { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: next }]
  })
}

export const api = {
  async getDashboard() { await wait(); advanceMetrics(); return { metrics: copy(metricState), application: copy(application), alerts: copy(alertState.slice(0, 3)), prediction: copy(predictions[0]) } },
  async getAlerts() { await wait(); return copy(alertState) },
  async updateAlert(id, status) { await wait(180); const alert = alertState.find((item) => item.id === id); if (!alert) throw new Error('Alert not found.'); alert.status = status; return copy(alert) },
  async getPredictions() { await wait(); return copy(predictions) },
  async getIncidents() { await wait(); return copy(incidents) },
}
