import { RefreshCw, TriangleAlert } from 'lucide-react'

export function ErrorState({ message, onRetry }) {
  return <div className="grid min-h-64 place-items-center px-6 text-center"><div><TriangleAlert className="mx-auto mb-3 text-rose-600" size={32} aria-hidden="true" /><h2 className="font-semibold">Unable to load this view</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p><button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><RefreshCw size={15} />Try again</button></div></div>
}
