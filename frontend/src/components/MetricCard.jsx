import { Activity, ArrowDownRight, ArrowUpRight, Cpu, HardDrive, MemoryStick, Network, TriangleAlert } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import { METRIC_COLORS } from '../constants/ui'

const icons = { CPU: Cpu, Memory: MemoryStick, Disk: HardDrive, Network }

export function MetricCard({ metric }) {
  const Icon = icons[metric.name] || Activity
  const isUp = metric.history.at(-1)?.value >= metric.history.at(-2)?.value
  const severityColor = metric.status === 'Critical' ? 'text-rose-600' : metric.status === 'Warning' ? 'text-amber-600' : 'text-emerald-600'
  return <article className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900">
    <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-600 dark:text-slate-300">{metric.name}</p><p className="mt-1 text-3xl font-bold tracking-tight">{metric.value}<span className="ml-1 text-base font-medium text-slate-500">{metric.unit}</span></p></div><span className={`rounded-lg bg-slate-100 p-2 dark:bg-slate-800 ${severityColor}`}><Icon size={20} aria-hidden="true" /></span></div>
    <div className="mt-3 flex items-center justify-between text-xs"><span className={`inline-flex items-center gap-1 font-semibold ${severityColor}`}>{metric.status !== 'Normal' && <TriangleAlert size={14} aria-hidden="true" />}{metric.status}</span><span className="inline-flex items-center gap-1 text-slate-500">{isUp ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}Last 3 sec</span></div>
    <div className="mt-3 h-14" aria-label={`${metric.name} recent trend`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={metric.history}><defs><linearGradient id={`gradient-${metric.id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor={METRIC_COLORS[metric.name]} stopOpacity={0.28}/><stop offset="95%" stopColor={METRIC_COLORS[metric.name]} stopOpacity={0}/></linearGradient></defs><YAxis domain={['dataMin - 5', 'dataMax + 5']} hide /><Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} labelStyle={{ display: 'none' }} /><Area type="monotone" dataKey="value" stroke={METRIC_COLORS[metric.name]} strokeWidth={2} fill={`url(#gradient-${metric.id})`} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>
  </article>
}
