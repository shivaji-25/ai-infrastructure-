import { Inbox } from 'lucide-react'

export function EmptyState({ title = 'Nothing to show yet', message = 'Try changing your filters or check back later.' }) {
  return <div className="grid min-h-64 place-items-center px-6 text-center"><div><Inbox className="mx-auto mb-3 text-slate-400" size={32} aria-hidden="true" /><h2 className="font-semibold">{title}</h2><p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p></div></div>
}
