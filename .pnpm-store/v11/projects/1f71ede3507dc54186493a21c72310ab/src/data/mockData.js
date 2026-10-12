const points = (values) => values.map((value, index) => ({ time: `${String(9 + Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`, value }))

export const metrics = [
  { id: 'cpu', name: 'CPU', value: 42, unit: '%', status: 'Normal', history: points([31, 34, 32, 39, 36, 44, 40, 42]) },
  { id: 'memory', name: 'Memory', value: 68, unit: '%', status: 'Warning', history: points([52, 54, 58, 61, 63, 66, 65, 68]) },
  { id: 'disk', name: 'Disk', value: 81, unit: '%', status: 'Warning', history: points([72, 73, 74, 75, 77, 78, 80, 81]) },
  { id: 'network', name: 'Network', value: 18.4, unit: ' MB/s', status: 'Normal', history: points([12, 14, 17, 15, 19, 16, 20, 18.4]) },
]

export const application = { responseTime: 184, errorRate: 0.4, uptime: 99.96 }

export const alerts = [
  { id: 'ALT-1042', metric: 'Disk', severity: 'Critical', status: 'Open', message: 'Storage on api-node-02 is approaching capacity.', time: '2 minutes ago' },
  { id: 'ALT-1041', metric: 'Memory', severity: 'Warning', status: 'Acknowledged', message: 'Memory usage is above the normal operating range.', time: '18 minutes ago' },
  { id: 'ALT-1040', metric: 'Network', severity: 'Normal', status: 'Resolved', message: 'Network traffic returned to its usual range.', time: '1 hour ago' },
  { id: 'ALT-1039', metric: 'CPU', severity: 'Warning', status: 'Open', message: 'CPU increased quickly during the batch processing window.', time: '2 hours ago' },
]

export const predictions = [
  { id: 'PRD-01', metric: 'Disk', message: 'Disk likely full in 2 hours', etaMinutes: 120, confidence: 91, action: 'Archive old logs or increase storage before the threshold is reached.', severity: 'Critical' },
  { id: 'PRD-02', metric: 'Memory', message: 'Memory pressure likely in 45 minutes', etaMinutes: 45, confidence: 78, action: 'Review the batch job and restart the affected worker if usage keeps growing.', severity: 'Warning' },
  { id: 'PRD-03', metric: 'CPU', message: 'CPU load may rise during the next batch', etaMinutes: 90, confidence: 64, action: 'Schedule the batch outside peak traffic if possible.', severity: 'Warning' },
]

export const incidents = [
  { id: 'INC-208', time: '2026-10-06 10:24', metric: 'Disk', cause: 'Log retention threshold reached', resolution: 'Archived logs and increased volume size', durationMin: 24, status: 'Resolved' },
  { id: 'INC-207', time: '2026-10-06 08:10', metric: 'Memory', cause: 'Worker memory leak', resolution: 'Restarted worker and opened follow-up task', durationMin: 37, status: 'Resolved' },
  { id: 'INC-206', time: '2026-10-05 16:42', metric: 'CPU', cause: 'Unexpected batch job overlap', resolution: 'Batch schedule adjusted', durationMin: 51, status: 'Resolved' },
  { id: 'INC-205', time: '2026-10-05 11:08', metric: 'Network', cause: 'Short traffic burst', resolution: 'Monitoring only; traffic normalized', durationMin: 12, status: 'Resolved' },
  { id: 'INC-204', time: '2026-10-04 09:35', metric: 'Disk', cause: 'Temporary export files not cleaned', resolution: 'Cleanup job added', durationMin: 46, status: 'Resolved' },
]
