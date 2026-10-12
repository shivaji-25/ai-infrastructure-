import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'

export function useAlerts() {
  const [state, setState] = useState({ alerts: [], loading: true, error: null })
  const refresh = useCallback(async () => {
    try { const alerts = await api.getAlerts(); setState({ alerts, loading: false, error: null }) }
    catch { setState((current) => ({ ...current, loading: false, error: 'We could not load alerts.' })) }
  }, [])
  useEffect(() => { refresh() }, [refresh])
  const changeStatus = async (id, status) => { const updated = await api.updateAlert(id, status); setState((current) => ({ ...current, alerts: current.alerts.map((item) => item.id === id ? updated : item) })) }
  return { ...state, refresh, changeStatus }
}
