import { Check, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { SeverityBadge } from '../components/SeverityBadge'
import { Skeleton } from '../components/Skeleton'
import { StatusChip } from '../components/StatusChip'
import { useAlerts } from '../hooks/useAlerts'

export function AlertsPage() {
  const { alerts, loading, error, refresh, changeStatus } = useAlerts()
  const [params] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const [severity, setSeverity] = useState('All')
  const [status, setStatus] = useState('All')
  const [actionError, setActionError] = useState('')
  useEffect(() => setSearch(params.get('q') || ''), [params])
  const filtered = useMemo(() => alerts.filter((alert) => (severity === 'All' || alert.severity === severity) && (status === 'All' || alert.status === status) && `${alert.id} ${alert.metric} ${alert.message}`.toLowerCase().includes(search.toLowerCase())), [alerts, severity, status, search])
  const act = async (id, nextStatus) => { try { setActionError(''); await changeStatus(id, nextStatus) } catch (err) { setActionError(err.message) } }
  if (error) return <ErrorState message={error} onRetry={refresh} />
  return <div className="space-y-5"><div><h2 className="text-xl font-bold">Alerts requiring attention</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Acknowledge an alert when you are investigating it. Resolve it after the issue is fixed.</p></div><section className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900"><div className="grid gap-3 md:grid-cols-[1fr_150px_170px]"><label className="flex items-center gap-2 rounded-lg border px-3 py-2"><Search size={17} className="text-slate-400" /><span className="sr-only">Search alerts</span><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search alert text or metric" /></label><label className="text-sm"><span className="sr-only">Filter by severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value)} className="w-full rounded-lg border bg-transparent px-3 py-2"><option>All</option><option>Normal</option><option>Warning</option><option>Critical</option></select></label><label className="text-sm"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border bg-transparent px-3 py-2"><option>All</option><option>Open</option><option>Acknowledged</option><option>Resolved</option></select></label></div>{actionError && <p role="alert" className="mt-3 text-sm text-rose-600">{actionError}</p>}</section><section className="overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-900" aria-live="polite">{loading ? <div className="space-y-3 p-4">{[1,2,3].map((item) => <Skeleton key={item} className="h-20" />)}</div> : filtered.length === 0 ? <EmptyState title="No alerts match these filters" message="Try a different search term or clear one of the filters." /> : <ul className="divide-y">{filtered.map((alert) => <li key={alert.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{alert.metric}</p><SeverityBadge severity={alert.severity} /><StatusChip status={alert.status} /></div><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{alert.message}</p><p className="mt-1 text-xs text-slate-500">{alert.id} · {alert.time}</p></div><div className="flex shrink-0 gap-2">{alert.status === 'Open' && <button onClick={() => act(alert.id, 'Acknowledged')} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Acknowledge</button>}{alert.status !== 'Resolved' && <button onClick={() => act(alert.id, 'Resolved')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Check size={16} />Resolve</button>}</div></li>)}</ul>}</section></div>
}
