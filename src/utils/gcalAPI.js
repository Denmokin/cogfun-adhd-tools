/**
 * Google Calendar API Utility
 * 
 * Handles pushing schedules to Google Calendar with proper timezone handling
 * and comprehensive error checking.
 */

/**
 * Convert minutes since midnight to "HH:mm" time string
 * @param {number} minutes - Minutes since midnight (e.g., 540 = 09:00)
 * @returns {string} - Time in "HH:mm" format
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Build ISO datetime string with dynamic timezone offset
 * 
 * @param {string} time - Time in "HH:mm" format (e.g., "09:00")
 * @param {string} dateStr - Date in "YYYY-MM-DD" format (e.g., "2026-02-28")
 * @returns {string} - ISO datetime with timezone offset (e.g., "2026-02-28T09:00:00+02:00")
 */
function toISOString(time, dateStr) {
  // Get current UTC offset in minutes
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const mm = String(Math.abs(offset) % 60).padStart(2, '0');
  const tzOffset = `${sign}${hh}:${mm}`;
  
  // Final format: "2026-02-28T09:00:00+02:00"
  return `${dateStr}T${time}:00${tzOffset}`;
}

/**
 * Push schedule to Google Calendar
 * 
 * Converts schedule array (with minute-based times) to Google Calendar events
 * and batches them with proper error handling.
 * 
 * @param {Array} schedule - Array of schedule items with type, title, start, end, duration
 * @param {string} accessToken - Google OAuth access token with Calendar scope
 * @param {string} dateStr - Date in "YYYY-MM-DD" format (defaults to today)
 * @returns {Promise<boolean>} - true if all events created successfully
 * @throws {Error} - TOKEN_EXPIRED if token invalid, otherwise descriptive error
 */
export async function pushScheduleToGCal(schedule, accessToken, dateStr = null) {
  if (!accessToken) {
    throw new Error('NO_TOKEN');
  }

  if (!dateStr) {
    dateStr = new Date().toISOString().split('T')[0];
  }

  // Filter only tasks (skip breaks)
  const tasks = schedule.filter(block => block.type === 'task');

  if (!tasks.length) {
    throw new Error('NO_TASKS');
  }

  // Build event objects with proper datetime formatting
  const requests = tasks.map((block, i) => {
    // Convert minutes to "HH:mm" format
    const startTimeStr = minutesToTime(block.start);
    const endTimeStr = minutesToTime(block.end);

    // Build ISO datetime with timezone
    const startDateTime = toISOString(startTimeStr, dateStr);
    const endDateTime = toISOString(endTimeStr, dateStr);

    const event = {
      summary: block.title,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Jerusalem'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Jerusalem'
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 5 }]
      }
    };

    // Log first event payload for debugging
    if (i === 0) {
      console.log('First event payload:', JSON.stringify(event, null, 2));
    }

    // Return fetch promise
    return fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
  });

  // Execute all requests in parallel
  const results = await Promise.all(requests);

  // Check each response for errors
  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    
    if (!res.ok) {
      const errorBody = await res.json();
      console.error(`Event ${i + 1} error:`, errorBody);

      // Handle specific error codes
      if (res.status === 401) {
        throw new Error('TOKEN_EXPIRED');
      }
      
      if (res.status === 403) {
        throw new Error('INSUFFICIENT_PERMISSIONS');
      }

      // Generic API error
      const errorMsg = errorBody.error?.message || 'Unknown error';
      throw new Error(`API_ERROR: ${errorMsg}`);
    }
  }

  return true;
}

export default { pushScheduleToGCal };
