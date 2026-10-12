export const SEVERITY = {
  Normal: { label: 'Normal', icon: 'CheckCircle2', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30' },
  Warning: { label: 'Warning', icon: 'TriangleAlert', classes: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30' },
  Critical: { label: 'Critical', icon: 'OctagonAlert', classes: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30' },
}

export const STATUS = {
  Open: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
  Acknowledged: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30',
  Resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
}

export const METRIC_COLORS = { CPU: '#4f46e5', Memory: '#0ea5e9', Disk: '#f59e0b', Network: '#10b981' }
