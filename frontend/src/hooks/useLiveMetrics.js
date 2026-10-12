import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'

export function useLiveMetrics() {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const refresh = useCallback(async () => {
    try { setState((current) => ({ ...current, error: null })); const data = await api.getDashboard(); setState({ data, loading: false, error: null }) }
    catch { setState((current) => ({ ...current, loading: false, error: 'We could not load the live system data.' })) }
  }, [])
  useEffect(() => { refresh(); const intervalId = window.setInterval(refresh, 3000); return () => window.clearInterval(intervalId) }, [refresh])
  return { ...state, refresh }
}
