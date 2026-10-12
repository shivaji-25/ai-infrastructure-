import { STATUS } from '../constants/ui'

export function StatusChip({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS[status] || STATUS.Open}`}>{status}</span>
}
