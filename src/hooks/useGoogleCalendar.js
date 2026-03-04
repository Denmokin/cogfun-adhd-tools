import { useState, useCallback } from 'react'

export function useGoogleCalendar() {
  const [clientId, setClientId] = useState(import.meta.env.VITE_GCAL_CLIENT_ID)
  const [clientSecret, setClientSecret] = useState(import.meta.env.VITE_GCAL_CLIENT_SECRET)
  const [refreshToken, setRefreshToken] = useState(import.meta.env.VITE_GCAL_REFRESH_TOKEN)
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState([])

  const refreshAccessToken = useCallback(() => {
    setLoading(true)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://oauth2.googleapis.com/token')
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        setAccessToken(JSON.parse(xhr.responseText).access_token)
        setLoading(false)
      } else if (xhr.readyState === 4) {
        setLoading(false)
      }
    }
    xhr.send(`client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}&grant_type=refresh_token`)
  }, [clientId, clientSecret, refreshToken])

  const fetchEvents = useCallback(() => {
    if (!accessToken) return
    setLoading(true)
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const end   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${encodeURIComponent(start.toISOString())}` +
      `&timeMax=${encodeURIComponent(end.toISOString())}` +
      `&singleEvents=true&orderBy=startTime`
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return
      setLoading(false)
      if (xhr.status === 200) {
        const parsed = JSON.parse(xhr.responseText).items.reduce((acc, ev) => {
          if (!ev.start.dateTime || !ev.end.dateTime) return acc
          const s = new Date(ev.start.dateTime)
          const e = new Date(ev.end.dateTime)
          acc.push({
            id: ev.id,
            title: ev.summary || 'Untitled',
            start: s.getHours() + s.getMinutes() / 60 + s.getSeconds() / 3600,
            end:   e.getHours() + e.getMinutes() / 60 + e.getSeconds() / 3600,
            endTime: e.getTime(),
            color: null,
          })
          return acc
        }, [])
        setEvents(parsed)
      }
    }
    xhr.send()
  }, [accessToken])

  return {
    clientId, setClientId,
    clientSecret, setClientSecret,
    refreshToken, setRefreshToken,
    accessToken, loading,
    events, setEvents,
    refreshAccessToken, fetchEvents,
  }
}