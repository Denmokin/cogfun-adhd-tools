import { useMemo } from 'react'

export function useCountdown(currentEvent, now) {
  return useMemo(() => {
    if (!currentEvent) return ''
    const endDate = new Date(currentEvent.endTime || 0)
    const diffMs = endDate - now
    if (diffMs <= 0) return 'Ending now'
    const totalSec = Math.floor(diffMs / 1000)
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
    return `${m.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
  }, [currentEvent, now])
}