import { useState } from 'react'
import { Activity, Bell, History, LayoutDashboard, Menu, Moon, Search, Sun, TriangleAlert, WandSparkles, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/alerts', label: 'Alerts', icon: TriangleAlert },
  { to: '/predictions', label: 'Predictions', icon: WandSparkles },
  { to: '/incidents', label: 'Incident history', icon: History },
]

const pageTitles = { '/': 'System overview', '/alerts': 'Alerts', '/predictions': 'Predictions', '/incidents': 'Incident history' }

export function Layout({ children, theme, toggleTheme }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] || 'System overview'
  const submitSearch = (event) => { event.preventDefault(); navigate(`/alerts?q=${encodeURIComponent(query)}`); setOpen(false) }
  return <div className="min-h-screen"><aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-white p-4 transition-transform dark:bg-slate-900 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Main navigation"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-lg font-bold"><span className="rounded-lg bg-indigo-600 p-2 text-white"><Activity size={18} /></span>Sentinel AIOps</div><button className="rounded-md p-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={19} /></button></div><p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Monitor</p><nav className="mt-2 space-y-1">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon size={18} aria-hidden="true" />{label}</NavLink>)}</nav><div className="absolute bottom-5 left-4 right-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"><span className="font-semibold text-emerald-600">● All systems connected</span><p className="mt-1">Mock data refreshes every 3 seconds.</p></div></aside>{open && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-slate-50/90 px-4 py-3 backdrop-blur dark:bg-slate-950/90 sm:px-6"><button className="rounded-md p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="min-w-0 flex-1"><h1 className="truncate text-lg font-bold">{title}</h1></div><form onSubmit={submitSearch} className="hidden max-w-sm flex-1 md:block"><label className="sr-only" htmlFor="global-search">Search alerts</label><div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 dark:bg-slate-900"><Search size={16} className="text-slate-400" /><input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search alerts" /></div></form><button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-800" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button><button className="relative rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-800" aria-label="Notifications, 2 unread"><Bell size={19} /><span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-600 text-[10px] font-bold text-white">2</span></button></header><main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main></div></div>
}
