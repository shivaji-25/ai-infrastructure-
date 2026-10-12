import { Clock3, ShieldCheck, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ErrorState } from '../components/ErrorState'
import { SeverityBadge } from '../components/SeverityBadge'
import { Skeleton } from '../components/Skeleton'
import { api } from '../services/api'

function timeLabel(minutes) { return minutes >= 60 ? `${Math.floor(minutes / 60)} hour${minutes >= 120 ? 's' : ''}` : `${minutes} minutes` }

export function PredictionsPage() {
  const [state, setState] = useState({ items: [], loading: true, error: null })
  const load = useCallback(async () => { try { setState((current) => ({ ...current, error: null })); setState({ items: await api.getPredictions(), loading: false, error: null }) } catch { setState({ items: [], loading: false, error: 'We could not load predictions.' }) } }, [])
  useEffect(() => { load() }, [load])
  if (state.error) return <ErrorState message={state.error} onRetry={load} />
  return <div className="space-y-5"><div><h2 className="text-xl font-bold">Predicted incidents</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Predictions help you act before a resource issue affects users.</p></div><div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{state.loading ? [1,2,3].map((item) => <Skeleton key={item} className="h-72" />) : state.items.map((prediction) => <article key={prediction.id} className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{prediction.metric}</p><h3 className="mt-1 text-lg font-bold">{prediction.message}</h3></div><SeverityBadge severity={prediction.severity} /></div><div className="mt-5 flex items-center gap-2 text-sm"><Clock3 className="text-indigo-600" size={18} /><span>Expected in <strong>{timeLabel(prediction.etaMinutes)}</strong></span></div><div className="mt-5"><div className="mb-2 flex justify-between text-sm"><span className="font-medium">Prediction confidence</span><span>{prediction.confidence}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className={prediction.severity === 'Critical' ? 'h-full bg-rose-500' : 'h-full bg-amber-500'} style={{ width: `${prediction.confidence}%` }} /></div></div><div className="mt-5 border-t pt-4"><div className="flex gap-2"><Wrench className="mt-0.5 shrink-0 text-indigo-600" size={18} /><div><p className="text-sm font-semibold">Suggested action</p><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{prediction.action}</p></div></div></div></article>)}</div><section className="flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100"><ShieldCheck className="shrink-0 text-indigo-600" size={20} /><p><strong>How to use this page:</strong> treat predictions as an early warning, then confirm the resource trend before making a production change.</p></section></div>
}
