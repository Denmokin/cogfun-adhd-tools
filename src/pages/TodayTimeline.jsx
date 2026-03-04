import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/auth'
import { contrastColor, withAlpha, COLOR_PALETTE } from '@/utils/timelineUtils'
import { useCountdown } from '@/hooks/useCountdown'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import '@/assets/styles/comp-styles/today-timeline.css'

const PX_PER_HOUR = 64
const HOURS = Array.from({ length: 25 }, (_, i) => i)
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmt12(h) {
  const ampm = (h % 24) < 12 ? 'AM' : 'PM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour} ${ampm}`
}

function fmtEventTime(dec) {
  const h = Math.floor(dec)
  const m = Math.round((dec - h) * 60)
  const ampm = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

const TodayTimeline = () => {
  const { user } = useAuth()
  const [now, setNow] = useState(new Date())
  const [editingEventIndex, setEditingEventIndex] = useState(-1)
  const scrollRef = useRef(null)

  const {
    loading, events, setEvents,
    accessToken,
    refreshAccessToken, fetchEvents,
  } = useGoogleCalendar()

  const currentHourDecimal = now.getHours() + now.getMinutes() / 60.0 + now.getSeconds() / 3600.0

  const currentEvent = events.find(
    ev => currentHourDecimal >= ev.start && currentHourDecimal < ev.end
  ) ?? null

  const currentCountdown = useCountdown(currentEvent, now)

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Fetch when token ready
  useEffect(() => {
    if (accessToken) fetchEvents()
  }, [accessToken, fetchEvents])

  // Auto-scroll to current event or current time when events load
  useEffect(() => {
    if (!scrollRef.current || loading) return
    const scrollTarget = currentEvent
      ? currentEvent.start * PX_PER_HOUR - 80
      : currentHourDecimal * PX_PER_HOUR - 120
    scrollRef.current.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: 'smooth'
    })
  }, [events])

  // Escape closes color picker
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setEditingEventIndex(-1) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleColorChange = (color) => {
    if (editingEventIndex < 0) return
    setEvents(prev => prev.map((ev, i) => i === editingEventIndex ? { ...ev, color } : ev))
  }

  const editingEvent = editingEventIndex >= 0 ? events[editingEventIndex] : null
  const nowBarColor = currentEvent?.color || '#5294e2'

  return (
    <div className="today-timeline-page">
      <div className="timeline-container">

        {/* Header */}
        <div className="header-row">
          <div className="header-date">
            <span className="header-day">{DAYS[now.getDay()]}</span>
            <span className="header-month-day">{MONTHS[now.getMonth()]} {now.getDate()}</span>
            <span className="header-year">{now.getFullYear()}</span>
          </div>

          <button
            className="refresh-button"
            onClick={accessToken ? fetchEvents : refreshAccessToken}
            disabled={loading}
          >
            {loading ? '···' : accessToken ? '↻ Refresh' : 'Connect'}
          </button>

          <div className="header-time">
            <div className="header-hour-minute">
              {now.getHours().toString().padStart(2,'0')}:{now.getMinutes().toString().padStart(2,'0')}
            </div>
            <span className="header-year" style={{ textAlign: 'right' }}>
              {now.getSeconds().toString().padStart(2,'0')}s
            </span>
          </div>
        </div>

        {/* Now Bar */}
        <div
          className="now-bar"
          style={{
            background: withAlpha(nowBarColor, 0.18),
            borderColor: withAlpha(nowBarColor, 0.55),
          }}
        >
          <div className="now-glow" style={{ borderColor: nowBarColor }} />
          <div className="now-bar-content">
            <div className="now-playing-info">
              <span className="now-playing-label" style={{ color: nowBarColor }}>NOW</span>
              <span className="now-playing-title">
                {currentEvent ? currentEvent.title : 'No event'}
              </span>
            </div>
            {currentEvent && (
              <div
                className="countdown-box"
                style={{ background: withAlpha(nowBarColor, 0.25) }}
              >
                {currentCountdown}
              </div>
            )}
          </div>
        </div>

        {/* Color Picker */}
        {editingEvent && (
          <div className="color-picker-row">
            <span className="color-picker-label">COLOR</span>
            <div className="color-options">
              {COLOR_PALETTE.map(color => (
                <button
                  key={color}
                  className={`color-option${editingEvent.color === color ? ' selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                >
                  {editingEvent.color === color && <div className="color-option-indicator" />}
                </button>
              ))}
            </div>
            <span className="escape-hint">ESC</span>
          </div>
        )}

        {/* Timeline */}
        <div className="timeline-flickable" ref={scrollRef}>
          <div className="timeline-content" style={{ height: `${24 * PX_PER_HOUR}px` }}>

            {/* Hour markers */}
            {HOURS.map(h => (
              <div
                key={h}
                className="hour-marker"
                style={{ top: `${h * PX_PER_HOUR}px`, height: `${PX_PER_HOUR}px` }}
              >
                <div className="hour-divider" />
                <span className="hour-label">{fmt12(h)}</span>
                {h < 24 && <div className="half-hour-divider" style={{ top: '50%' }} />}
              </div>
            ))}

            {/* Events */}
            {events.map((ev, i) => {
              const top    = ev.start * PX_PER_HOUR
              const height = Math.max((ev.end - ev.start) * PX_PER_HOUR, 24)
              const color  = ev.color || '#5294e2'
              const isCurrent = currentEvent === ev
              const isEditing = editingEventIndex === i

              return (
                <div
                  key={ev.id || i}
                  className="event-block"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    background: withAlpha(color, isCurrent ? 0.35 : 0.2),
                    borderColor: withAlpha(color, isCurrent ? 0.8 : 0.45),
                    borderWidth: isEditing ? '2px' : '1.5px',
                  }}
                  onClick={() => setEditingEventIndex(i === editingEventIndex ? -1 : i)}
                >
                  {isCurrent && <div className="event-glow" style={{ borderColor: color }} />}
                  <span className="event-title">{ev.title}</span>
                  <span className="event-time">{fmtEventTime(ev.start)} – {fmtEventTime(ev.end)}</span>
                </div>
              )
            })}

            {/* Now line */}
            <div
              className="now-line-container"
              style={{ top: `${currentHourDecimal * PX_PER_HOUR}px` }}
            >
              <div className="now-dot" />
              <div className="now-line" />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default TodayTimeline
