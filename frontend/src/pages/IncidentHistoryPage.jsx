import { Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Skeleton } from '../components/Skeleton'
import { StatusChip } from '../components/StatusChip'
import { api } from '../services/api'

const pageSize = 3

export function IncidentHistoryPage() {
  const [state, setState] = useState({ items: [], loading: true, error: null })
  const [search, setSearch] = useState('')
  const [metric, setMetric] = useState('All')
  const [sort, setSort] = useState({ key: 'time', direction: 'desc' })
  const [visible, setVisible] = useState(pageSize)
  const load = useCallback(async () => { try { setState({ items: await api.getIncidents(), loading: false, error: null }) } catch { setState({ items: [], loading: false, error: 'We could not load incident history.' }) } }, [])
  useEffect(() => { load() }, [load])
  const rows = useMemo(() => state.items.filter((item) => (metric === 'All' || item.metric === metric) && Object.values(item).join(' ').toLowerCase().includes(search.toLowerCase())).sort((a, b) => { const left = a[sort.key]; const right = b[sort.key]; const order = left > right ? 1 : left < right ? -1 : 0; return sort.direction === 'asc' ? order : -order }), [state.items, metric, search, sort])
  const changeSort = (key) => setSort((current) => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' })
  const columns = [{ key: 'time', label: 'Time', sortable: true }, { key: 'metric', label: 'Metric', sortable: true }, { key: 'cause', label: 'Cause', sortable: true }, { key: 'resolution', label: 'Resolution', sortable: true }, { key: 'durationMin', label: 'Duration', sortable: true, render: (row) => `${row.durationMin} min` }, { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusChip status={row.status} /> }]
  if (state.error) return <ErrorState message={state.error} onRetry={load} />
  return <div className="space-y-5"><div><h2 className="text-xl font-bold">Incident history</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review past events to find repeated causes and improve reliability.</p></div><section className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900"><div className="grid gap-3 md:grid-cols-[1fr_180px]"><label className="flex items-center gap-2 rounded-lg border px-3 py-2"><Search size={17} className="text-slate-400" /><span className="sr-only">Search incident history</span><input value={search} onChange={(event) => { setSearch(event.target.value); setVisible(pageSize) }} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search cause or resolution" /></label><select value={metric} onChange={(event) => { setMetric(event.target.value); setVisible(pageSize) }} className="rounded-lg border bg-transparent px-3 py-2 text-sm" aria-label="Filter incidents by metric"><option>All</option><option>CPU</option><option>Memory</option><option>Disk</option><option>Network</option></select></div></section><section className="overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-900">{state.loading ? <div className="space-y-3 p-4">{[1,2,3].map((item) => <Skeleton key={item} className="h-12" />)}</div> : rows.length === 0 ? <EmptyState title="No incidents match these filters" /> : <><DataTable columns={columns} rows={rows.slice(0, visible)} sort={sort} onSort={changeSort} />{visible < rows.length && <div className="border-t p-4 text-center"><button className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setVisible((count) => count + pageSize)}>Load more incidents</button></div>}</>}</section></div>
}
