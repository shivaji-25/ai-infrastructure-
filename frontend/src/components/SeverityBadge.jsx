import { CheckCircle2, OctagonAlert, TriangleAlert } from 'lucide-react'
import { SEVERITY } from '../constants/ui'

const icons = { CheckCircle2, TriangleAlert, OctagonAlert }

export function SeverityBadge({ severity }) {
  const details = SEVERITY[severity] || SEVERITY.Normal
  const Icon = icons[details.icon]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${details.classes}`}><Icon size={14} aria-hidden="true" />{details.label}</span>
}
