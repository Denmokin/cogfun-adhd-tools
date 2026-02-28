import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/auth";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { pushScheduleToGCal } from "@/utils/gcalAPI";

// default preset tasks
const PRESET_TASKS = [
    { name: "📚 לימודים", duration: 45 },
    { name: "🍽️ אוכל", duration: 20 },
    { name: "🧺 כביסה", duration: 30 },
    { name: "🚿 מקלחת", duration: 15 },
    { name: "🏃 פעילות גופנית", duration: 30 },
    { name: "💊 תרופות", duration: 5 },
    { name: "📱 מנוחה", duration: 15 },
    { name: "🛒 קניות", duration: 45 },
    { name: "🧹 ניקיון", duration: 30 },
    { name: "💤 שינה קצרה", duration: 20 },
];

function parseTime(str) {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
}

function formatMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function calculateBreakDuration(taskDuration) {
    let baseBreak;
    if (taskDuration < 20) baseBreak = 5;
    else if (taskDuration <= 45) baseBreak = 10;
    else baseBreak = 15;

    // Add randomness: ±2–3 minutes
    const randomOffset = (Math.random() * 6 - 3); // -3 to +3
    let finalBreak = baseBreak + randomOffset;

    // Clamp to 5–20 minutes
    finalBreak = Math.max(5, Math.min(20, finalBreak));

    return Math.round(finalBreak);
}

function generateSchedule(tasks, startTime) {
    if (!tasks.length) return [];
    const order = shuffle(tasks);
    let current = parseTime(startTime);
    const schedule = [];

    order.forEach((t, idx) => {
        const start = current;
        const end = start + Number(t.duration);
        schedule.push({ type: "task", title: t.name, start, end, duration: t.duration });
        current = end;

        if (idx < order.length - 1) {
            const breakDur = calculateBreakDuration(Number(t.duration));
            const bstart = current;
            const bend = current + breakDur;
            schedule.push({ type: "break", title: "הפסקה ☕", start: bstart, end: bend, duration: breakDur });
            current = bend;
        }
    });

    return schedule;
}

function recalculateSchedule(schedule, startTimeStr) {
    if (!schedule.length) return [];
    let current = parseTime(startTimeStr);
    const recalc = [];

    schedule.forEach((item) => {
        const start = current;
        const end = start + item.duration;
        recalc.push({ ...item, start, end });
        current = end;
    });

    return recalc;
}

export default function DailyRandomizer() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [name, setName] = useState("");
    const [duration, setDuration] = useState(30);
    const [startTime, setStartTime] = useState("09:00");
    const [schedule, setSchedule] = useState([]);
    const [editingTaskIdx, setEditingTaskIdx] = useState(null);
    const [editName, setEditName] = useState("");
    const [editDuration, setEditDuration] = useState(30);
    const [editingBreakIdx, setEditingBreakIdx] = useState(null);
    const [editBreakDuration, setEditBreakDuration] = useState(10);
    const [savedSchedules, setSavedSchedules] = useState([]);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [dayName, setDayName] = useState("");
    const [expandedScheduleId, setExpandedScheduleId] = useState(null);
    const [editingDocId, setEditingDocId] = useState(null);
    const [saveToast, setSaveToast] = useState(null);
    const [gCalToken, setGCalToken] = useState(null);
    const [gCalLoading, setGCalLoading] = useState(false);
    const [gCalError, setGCalError] = useState(null);
    const savedSchedulesRef = useRef(null);

    useEffect(() => {
        if (user) {
            loadSavedSchedules();
        }
    }, [user]);

    const loadSavedSchedules = async () => {
        if (!user) return;
        try {
            const schedulesCol = collection(db, "users", user.uid, "dailySchedules");
            const q = query(schedulesCol, orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            setSavedSchedules(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        }
    };

    const addTask = () => {
        if (!name.trim() || !duration) return;
        setTasks((t) => [...t, { name: name.trim(), duration: Number(duration) }]);
        setName("");
        setDuration(30);
    };

    const addPresetTask = (preset) => {
        setTasks((t) => [...t, { ...preset }]);
    };

    const removeTask = (idx) => {
        setTasks((t) => t.filter((_, i) => i !== idx));
    };

    const startEditTask = (idx) => {
        setEditingTaskIdx(idx);
        setEditName(tasks[idx].name);
        setEditDuration(tasks[idx].duration);
    };

    const saveEditTask = () => {
        if (!editName.trim() || !editDuration) {
            setEditingTaskIdx(null);
            return;
        }
        const newTasks = [...tasks];
        newTasks[editingTaskIdx] = {
            name: editName.trim(),
            duration: Number(editDuration),
        };
        setTasks(newTasks);
        setEditingTaskIdx(null);
    };

    const cancelEditTask = () => {
        setEditingTaskIdx(null);
    };

    const randomize = () => {
        const sched = generateSchedule(tasks, startTime);
        setSchedule(sched);
    };

    const handleDragStart = (e, idx) => {
        setDraggedIdx(idx);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDropSchedule = (e, targetIdx) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === targetIdx) return;

        const taskIndices = schedule
            .map((item, i) => (item.type === "task" ? i : -1))
            .filter((i) => i !== -1);

        const draggedTaskIdx = taskIndices.indexOf(draggedIdx);
        const targetTaskIdx = taskIndices.indexOf(targetIdx);

        if (draggedTaskIdx === -1 || targetTaskIdx === -1) return;

        const taskList = schedule.filter((item) => item.type === "task");
        const [moved] = taskList.splice(draggedTaskIdx, 1);
        taskList.splice(targetTaskIdx, 0, moved);

        let current = parseTime(startTime);
        const newSchedule = [];
        taskList.forEach((t, idx) => {
            const start = current;
            const end = start + t.duration;
            newSchedule.push({ type: "task", title: t.title, start, end, duration: t.duration });
            current = end;

            if (idx < taskList.length - 1) {
                const breakDur = calculateBreakDuration(t.duration);
                const bstart = current;
                const bend = current + breakDur;
                newSchedule.push({ type: "break", title: "הפסקה ☕", start: bstart, end: bend, duration: breakDur });
                current = bend;
            }
        });

        setSchedule(newSchedule);
        setDraggedIdx(null);
    };

    const startEditBreak = (idx) => {
        setEditingBreakIdx(idx);
        setEditBreakDuration(schedule[idx].duration);
    };

    const saveEditBreak = () => {
        if (!editBreakDuration || editBreakDuration < 1) {
            setEditingBreakIdx(null);
            return;
        }
        const newSchedule = [...schedule];
        newSchedule[editingBreakIdx] = {
            ...newSchedule[editingBreakIdx],
            duration: Number(editBreakDuration),
        };
        // Recalculate all start/end times from this break onward
        const recalc = recalculateSchedule(newSchedule, startTime);
        setSchedule(recalc);
        setEditingBreakIdx(null);
    };

    const cancelEditBreak = () => {
        setEditingBreakIdx(null);
    };

    const saveSchedule = async () => {
        if (!user) {
            alert("יש להתחבר כדי לשמור");
            return;
        }
        try {
            const today = new Date().toISOString().split("T")[0];
            const data = {
                date: today,
                dayName,
                startTime,
                schedule,
                tasks,
                createdAt: new Date().toISOString(),
            };

            if (editingDocId) {
                // Overwrite existing document
                await setDoc(doc(db, "users", user.uid, "dailySchedules", editingDocId), data, { merge: true });
            } else {
                // Create new document
                const schedulesCol = collection(db, "users", user.uid, "dailySchedules");
                await addDoc(schedulesCol, data);
            }

            // Clear editor state
            setTasks([]);
            setSchedule([]);
            setName("");
            setDuration(30);
            setStartTime("09:00");
            setDayName("");
            setEditingDocId(null);

            // Show success toast
            setSaveToast(true);
            const toastTimer = setTimeout(() => {
                setSaveToast(false);
            }, 3000);

            // Load updated schedules
            await loadSavedSchedules();

            // Scroll to saved schedules
            setTimeout(() => {
                if (savedSchedulesRef.current) {
                    savedSchedulesRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }, 100);
        } catch (err) {
            console.error(err);
            alert("שגיאה בשמירה. אנא נסה שוב.");
        }
    };

    const deleteSavedSchedule = async (id) => {
        if (!user) return;
        if (!window.confirm("האם אתה בטוח?")) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "dailySchedules", id));
            setExpandedScheduleId(null);
            await loadSavedSchedules();
        } catch (err) {
            console.error(err);
        }
    };

    const calculateTotalDuration = (sched) => {
        const tasks = sched.filter((item) => item.type === "task");
        return tasks.reduce((sum, item) => sum + item.duration, 0);
    };

    const loadScheduleIntoEditor = (saved) => {
        setTasks(saved.tasks);
        setStartTime(saved.startTime);
        setSchedule(saved.schedule);
        setDayName(saved.dayName || "");
        setEditingDocId(saved.id);
        setExpandedScheduleId(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEditSchedule = () => {
        setTasks([]);
        setName("");
        setDuration(30);
        setStartTime("09:00");
        setSchedule([]);
        setDayName("");
        setEditingDocId(null);
    };

    const showToast = (message) => {
        setSaveToast(message);
        setTimeout(() => setSaveToast(null), 3000);
    };

    const connectGoogleCalendar = async () => {
        try {
            setGCalError(null);
            const auth = getAuth();
            const provider = new GoogleAuthProvider();
            // Add Calendar scope for creating events
            provider.addScope('https://www.googleapis.com/auth/calendar.events');
            // Force consent screen to appear so user grants Calendar permission
            provider.setCustomParameters({ prompt: 'consent' });
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            setGCalToken(token);
            showToast('✅ Google Calendar מחובר בהצלחה');
        } catch (error) {
            console.error('Google Calendar connection error:', error);
            setGCalError('שגיאה בחיבור ל-Google Calendar');
            showToast('❌ שגיאה בחיבור ל-Google Calendar, אנא נסה שוב');
        }
    };

    const pushScheduleToGoogleCalendar = async (sched, schedDate) => {
        if (!gCalToken) {
            showToast('❌ אנא חבר קודם את Google Calendar');
            return;
        }

        try {
            setGCalLoading(true);
            setGCalError(null);
            await pushScheduleToGCal(sched, gCalToken, schedDate);
            showToast('✅ כל האירועים נוספו ל-Google Calendar!');
        } catch (err) {
            console.error('Google Calendar push error:', err);

            if (err.message === 'TOKEN_EXPIRED') {
                setGCalToken(null);
                showToast('❌ פג תוקף החיבור ל-Google Calendar, אנא התחבר מחדש');
            } else if (err.message === 'NO_TOKEN') {
                showToast('❌ אנא חבר את Google Calendar תחילה');
            } else if (err.message === 'NO_TASKS') {
                showToast('❌ אין משימות לשלוח');
            } else if (err.message === 'INSUFFICIENT_PERMISSIONS') {
                setGCalToken(null);
                showToast('❌ אין הרשאות מספיקות ל-Google Calendar');
            } else {
                showToast('❌ שגיאה בשליחה ל-Google Calendar, נסה שוב');
            }
            setGCalError(err.message);
        } finally {
            setGCalLoading(false);
        }
    };

    return (
        <div className="page-wrapper daily-randomizer" dir="rtl">
            <div className="page-content">
                <div className="form-wrapper">
                    <div
                        className="form-header"
                        style={{
                            background: "linear-gradient(135deg, var(--primary), var(--purple))",
                        }}
                    >
                        <h1>מתזמן המשימות היומי</h1>
                        <p>בנה לעצמך לוח זמנים אקראי עם הפסקות</p>
                    </div>

                    <div className="form-body">
                        {/* Preset tasks toolbar */}
                        <div className="preset-toolbar">
                            <div className="preset-label">משימות מומלצות:</div>
                            <div className="preset-scroll">
                                {PRESET_TASKS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        className="preset-chip"
                                        onClick={() => addPresetTask(preset)}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.effectAllowed = "copy";
                                            e.dataTransfer.setData("text/plain", JSON.stringify(preset));
                                        }}
                                    >
                                        {preset.name} · {preset.duration} דקות
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Day name */}
                        <div className="day-name">
                            <label>
                                שם היום (אופציונלי)
                                <input
                                    type="text"
                                    value={dayName}
                                    onChange={(e) => setDayName(e.target.value)}
                                    placeholder="למשל: יום שני, יום עבודה, יום חקלאות"
                                />
                            </label>
                        </div>

                        {/* Custom task input */}
                        <div className="task-builder">
                            <label>
                                שם המשימה
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="למשל: ללמוד, כביסה, אכול ארוחה"
                                />
                            </label>
                            <label>
                                זמן בדקות
                                <input
                                    type="number"
                                    min={1}
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="30"
                                />
                            </label>
                            <button onClick={addTask} className="btn-add">
                                הוסף משימה
                            </button>
                        </div>

                        {/* Tasks list */}
                        {tasks.length > 0 ? (
                            <div className="task-list">
                                {tasks.map((t, i) => (
                                    <div key={i} className="task-card">
                                        {editingTaskIdx === i ? (
                                            <div className="task-edit">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="task-edit-input"
                                                />
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={editDuration}
                                                    onChange={(e) => setEditDuration(e.target.value)}
                                                    className="task-edit-input"
                                                />
                                                <button onClick={saveEditTask} className="btn-small">
                                                    ✓ שמור
                                                </button>
                                                <button onClick={cancelEditTask} className="btn-small btn-cancel-small">
                                                    ✕ בטל
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className="task-display"
                                                onClick={() => startEditTask(i)}
                                            >
                                                <span>
                                                    {t.name} – {t.duration} דקות
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeTask(i);
                                                    }}
                                                    className="btn-delete-small"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {tasks.length === 0 && schedule.length === 0 && (
                            <p className="empty-state">טרם נוספו משימות</p>
                        )}


                        {/* Start time */}
                        <div className="start-time">
                            <label>
                                שעת התחלה
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </label>
                        </div>

                        {/* Randomize button */}
                        {tasks.length > 0 && (
                            <button onClick={randomize} className="btn-primary">
                                סדר לי את היום 🎲
                            </button>
                        )}

                        {/* Schedule output */}
                        {schedule.length > 0 && (
                            <>
                                <div className="save-row">
                                    {user && (
                                        <>
                                            <button onClick={saveSchedule} className="btn-secondary">
                                                {editingDocId ? "עדכן לוח יום ✏️" : "שמור לוח יום 💾"}
                                            </button>
                                            {editingDocId && (
                                                <button onClick={cancelEditSchedule} className="btn-secondary btn-cancel">
                                                    בטל עריכה ✕
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {!user && <p className="login-hint">יש להתחבר כדי לשמור</p>}
                                    {user && !gCalToken && (
                                        <button
                                            onClick={connectGoogleCalendar}
                                            className="btn-secondary"
                                            style={{ background: '#ea4335' }}
                                        >
                                            🔗 חבר את Google Calendar
                                        </button>
                                    )}
                                    {user && gCalToken && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    const today = new Date().toISOString().split("T")[0];
                                                    pushScheduleToGoogleCalendar(schedule, today);
                                                }}
                                                disabled={gCalLoading}
                                                className="btn-secondary"
                                                style={{ background: '#34a853', opacity: gCalLoading ? 0.6 : 1 }}
                                            >
                                                {gCalLoading ? '⏳ שמירה לעיבוד...' : '📅 שמור הכל ב-Google Calendar'}
                                            </button>
                                            <span style={{ color: '#34a853', fontSize: '12px', fontWeight: '600' }}>
                                                ✅ Google Calendar מחובר
                                            </span>
                                            {gCalError && (
                                                <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '8px' }}>
                                                    שגיאה: {gCalError}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <button onClick={randomize} className="btn-secondary">
                                        ערבב מחדש 🔀
                                    </button>
                                </div>

                                <div className="schedule">
                                    {schedule.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`schedule-item schedule-${item.type}`}
                                            draggable={item.type === "task"}
                                            onDragStart={(e) => item.type === "task" && handleDragStart(e, idx)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => item.type === "task" && handleDropSchedule(e, idx)}
                                        >
                                            {item.type === "task" ? (
                                                <>
                                                    <span className="drag-handle">⠿</span>
                                                    <div className="schedule-content">
                                                        <span>{item.title}</span>
                                                        <span className="schedule-time">
                                                            {formatMinutes(item.start)} – {formatMinutes(item.end)}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="schedule-content">
                                                        <span>{item.title}</span>
                                                        <span className="schedule-time">
                                                            {formatMinutes(item.start)} – {formatMinutes(item.end)}
                                                        </span>
                                                    </div>
                                                    {editingBreakIdx === idx ? (
                                                        <div className="break-edit">
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={editBreakDuration}
                                                                onChange={(e) => setEditBreakDuration(e.target.value)}
                                                                className="break-edit-input"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") saveEditBreak();
                                                                    if (e.key === "Escape") cancelEditBreak();
                                                                }}
                                                            />
                                                            <span className="break-edit-unit">דקות</span>
                                                            <button onClick={saveEditBreak} className="btn-break-confirm">
                                                                ✓
                                                            </button>
                                                            <button onClick={cancelEditBreak} className="btn-break-cancel">
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => startEditBreak(idx)}
                                                            className="btn-break-edit"
                                                            title="ערוך משך הפסקה"
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Saved schedules */}
                        {savedSchedules.length > 0 && (
                            <div className="saved-schedules" ref={savedSchedulesRef}>
                                <h3>לוחות יום שנשמרו</h3>
                                {savedSchedules.map((saved) => (
                                    <div key={saved.id} className="saved-schedule-card">
                                        <div
                                            className="saved-header"
                                            onClick={() =>
                                                setExpandedScheduleId(
                                                    expandedScheduleId === saved.id ? null : saved.id
                                                )
                                            }
                                        >
                                            <div className="saved-info">
                                                {saved.dayName && (
                                                    <span className="saved-day-name">{saved.dayName}</span>
                                                )}
                                                <span className="saved-date">
                                                    {new Date(saved.date).toLocaleDateString("he-IL")}
                                                </span>
                                                <span className="saved-time">מ-{saved.startTime}</span>
                                                <span className="saved-duration">
                                                    {calculateTotalDuration(saved.schedule)} דקות
                                                </span>
                                            </div>
                                            <span className="saved-expand-icon">
                                                {expandedScheduleId === saved.id ? "▼" : "▶"}
                                            </span>
                                        </div>
                                        <div className="saved-tasks-count">
                                            {saved.tasks.length} משימות
                                        </div>

                                        {expandedScheduleId === saved.id && (
                                            <div className="saved-expanded">
                                                {/* Timeline preview */}
                                                <div className="saved-timeline">
                                                    {saved.schedule.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`schedule-item schedule-${item.type}`}
                                                        >
                                                            {item.type === "task" ? (
                                                                <>
                                                                    <div className="schedule-content">
                                                                        <span>{item.title}</span>
                                                                        <span className="schedule-time">
                                                                            {formatMinutes(item.start)} –{" "}
                                                                            {formatMinutes(item.end)}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="schedule-content">
                                                                        <span>{item.title}</span>
                                                                        <span className="schedule-time">
                                                                            {formatMinutes(item.start)} –{" "}
                                                                            {formatMinutes(item.end)}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Action buttons */}
                                                <div className="saved-actions">
                                                    <button
                                                        onClick={() => loadScheduleIntoEditor(saved)}
                                                        className="btn-secondary"
                                                    >
                                                        ערוך לוח יום ✏️
                                                    </button>
                                                    {user && gCalToken && (
                                                        <button
                                                            onClick={() => pushScheduleToGoogleCalendar(saved.schedule, saved.date)}
                                                            disabled={gCalLoading}
                                                            className="btn-secondary"
                                                            style={{ background: '#34a853', opacity: gCalLoading ? 0.6 : 1 }}
                                                        >
                                                            {gCalLoading ? '⏳ שמירה לעיבוד...' : '📅 שמור ב-Google Calendar'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteSavedSchedule(saved.id)}
                                                        className="btn-delete"
                                                    >
                                                        מחק 🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success toast */}
            {saveToast && (
                <div className="save-toast">
                    הלוח נשמר בהצלחה! ✅
                </div>
            )}
        </div>
    );
}
