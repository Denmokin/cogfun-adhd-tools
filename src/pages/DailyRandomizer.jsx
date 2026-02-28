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
import { GoogleAuthProvider, signInWithPopup, getAuth, signOut } from "firebase/auth";
import { pushScheduleToGCal } from "@/utils/gcalAPI";
import "@/assets/styles/daily-randomizer.css";

// Preset tasks
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

// Utility functions
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

    const randomOffset = Math.random() * 6 - 3;
    let finalBreak = baseBreak + randomOffset;
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

    // Reset gCalToken on app load to prevent reused tokens without Calendar scope
    useEffect(() => {
        setGCalToken(null);
    }, []);

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
            console.error("Error loading schedules:", err);
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
        const recalc = recalculateSchedule(newSchedule, startTime);
        setSchedule(recalc);
        setEditingBreakIdx(null);
    };

    const cancelEditBreak = () => {
        setEditingBreakIdx(null);
    };

    const saveSchedule = async () => {
        if (!user) {
            showToast("❌ יש להתחבר כדי לשמור");
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
                await setDoc(doc(db, "users", user.uid, "dailySchedules", editingDocId), data, { merge: true });
            } else {
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
            showToast("הלוח נשמר בהצלחה! ✅");

            // Load updated schedules
            await loadSavedSchedules();

            // Scroll to saved schedules
            setTimeout(() => {
                if (savedSchedulesRef.current) {
                    savedSchedulesRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }, 100);
        } catch (err) {
            console.error("Save error:", err);
            showToast("❌ שגיאה בשמירה. אנא נסה שוב.");
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
            console.error("Delete error:", err);
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
            
            // Sign out first to clear any cached credentials without Calendar scope
            console.log('Signing out to clear cached credentials...');
            await signOut(auth);
            
            // Wait a moment for signout to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const provider = new GoogleAuthProvider();
            // Request Calendar scope
            provider.addScope('https://www.googleapis.com/auth/calendar.events');
            
            // Force fresh consent dialog
            provider.setCustomParameters({
                prompt: 'consent',
                access_type: 'offline'  // Request refresh token too
            });
            
            console.log('Requesting Google auth with Calendar scope...');
            const result = await signInWithPopup(auth, provider);
            
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const idToken = credential.idToken;
            
            if (!token) {
                throw new Error('Did not receive access token from Google. Make sure Calendar API is enabled in Google Cloud Console.');
            }
            
            console.log('✅ Received access token successfully');
            console.log('Token preview:', token.substring(0, 20) + '...');
            console.log('ID Token exists:', !!idToken);
            
            setGCalToken(token);
            showToast('✅ Google Calendar מחובר בהצלחה! (עם הרשאות)');
        } catch (err) {
            console.error('GCal connect error:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            
            // Check if it's a user cancellation
            if (err.code === 'auth/popup-closed-by-user') {
                showToast('❌ ביטלת את הדיאלוג. נסה שוב');
            } else {
                setGCalError(err.message || 'שגיאה בחיבור');
                showToast('❌ שגיאה בחיבור ל-Google Calendar\\nודא שהותקן Calendar API בGoogle Cloud Console');
            }
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
                showToast('❌ פג תוקף החיבור, אנא התחבר מחדש');
            } else if (err.message === 'INSUFFICIENT_PERMISSIONS') {
                setGCalToken(null);
                showToast('❌ אין הרשאות מספיקות ל-Google Calendar, התחבר שוב');
            } else if (err.message === 'NO_TASKS') {
                showToast('❌ אין משימות לשכפל');
            } else {
                showToast('❌ שגיאה בשליחה ל-Google Calendar, נסה שוב');
            }
            setGCalError(err.message);
        } finally {
            setGCalLoading(false);
        }
    };

    return (
        <div className="daily-randomizer" dir="rtl">
            {/* SECTION 1: Page Header */}
            <div className="page-header">
                <h1>🎲 מתזמן המשימות היומי</h1>
                <p>בנה את היום שלך בקלות</p>
            </div>

            <div className="page-sections">
                {/* SECTION 2: Preset Tasks Toolbar */}
                <div className="section preset-section">
                    <div className="section-label">משימות מהירות – לחץ להוספה</div>
                    <div className="preset-scroll">
                        {PRESET_TASKS.map((preset, idx) => (
                            <button
                                key={idx}
                                className="preset-chip"
                                onClick={() => addPresetTask(preset)}
                            >
                                {preset.name} {preset.duration} דק׳
                            </button>
                        ))}
                    </div>
                </div>

                {/* SECTION 3: Task Builder Card */}
                <div className="section card task-builder-section">
                    <h2>➕ הוסף משימה</h2>

                    {/* Task inputs */}
                    <div className="task-input-row">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="שם המשימה"
                            className="task-name-input"
                            onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        />
                        <input
                            type="number"
                            min={1}
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="דקות"
                            className="task-duration-input"
                            onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        />
                        <button onClick={addTask} className="btn-add-task">
                            הוסף
                        </button>
                    </div>

                    {/* Tasks list */}
                    {tasks.length > 0 ? (
                        <div className="tasks-list">
                            {tasks.map((t, i) => (
                                <div key={i} className="task-item">
                                    {editingTaskIdx === i ? (
                                        <div className="task-edit-row">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="task-edit-input"
                                                autoFocus
                                            />
                                            <input
                                                type="number"
                                                min={1}
                                                value={editDuration}
                                                onChange={(e) => setEditDuration(e.target.value)}
                                                className="task-edit-input"
                                            />
                                            <button onClick={saveEditTask} className="btn-confirm">✓</button>
                                            <button onClick={cancelEditTask} className="btn-cancel">✕</button>
                                        </div>
                                    ) : (
                                        <div className="task-display">
                                            <span className="task-info">{t.name} · {t.duration} דקות</span>
                                            <div className="task-actions">
                                                <button
                                                    onClick={() => startEditTask(i)}
                                                    className="btn-edit-task"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => removeTask(i)}
                                                    className="btn-delete-task"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">עדיין אין משימות – הוסף משימה למעלה 👆</div>
                    )}
                </div>

                {/* SECTION 4: Schedule Controls Card */}
                {tasks.length > 0 && (
                    <div className="section card controls-section">
                        <div className="control-row">
                            <label className="control-label">
                                🕘 שעת התחלה
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="time-input"
                                />
                            </label>
                        </div>

                        {/* Day name input */}
                        <label className="control-label">
                            📝 שם היום (אופציונלי)
                            <input
                                type="text"
                                value={dayName}
                                onChange={(e) => setDayName(e.target.value)}
                                placeholder="למשל: יום שני, יום עבודה"
                                className="dayname-input"
                            />
                        </label>

                        <button onClick={randomize} className="btn-randomize">
                            סדר לי את היום 🎲
                        </button>
                    </div>
                )}

                {/* SECTION 5: Generated Timeline Card */}
                {schedule.length > 0 && (
                    <div className="section card timeline-section">
                        <h2>📅 לוח היום שלך</h2>

                        {/* Timeline items */}
                        <div className="timeline">
                            {schedule.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`timeline-item timeline-${item.type}`}
                                    draggable={item.type === "task"}
                                    onDragStart={(e) => item.type === "task" && handleDragStart(e, idx)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => item.type === "task" && handleDropSchedule(e, idx)}
                                >
                                    {item.type === "task" ? (
                                        <>
                                            <span className="drag-handle">⠿</span>
                                            <div className="timeline-content">
                                                <span className="timeline-title">{item.title}</span>
                                                <span className="timeline-time">
                                                    {formatMinutes(item.start)} – {formatMinutes(item.end)}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="timeline-content">
                                                <span className="timeline-title">{item.title}</span>
                                                <span className="timeline-time">
                                                    {formatMinutes(item.start)} – {formatMinutes(item.end)}
                                                </span>
                                            </div>
                                            {editingBreakIdx === idx ? (
                                                <div className="break-edit-inline">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={editBreakDuration}
                                                        onChange={(e) => setEditBreakDuration(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <span>דקות</span>
                                                    <button onClick={saveEditBreak} className="btn-confirm">✓</button>
                                                    <button onClick={cancelEditBreak} className="btn-cancel">✕</button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEditBreak(idx)}
                                                    className="btn-edit-break"
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

                        {/* Save + Google Calendar section */}
                        <div className="actions-row">
                            {user && (
                                <>
                                    <button onClick={saveSchedule} className="btn-save">
                                        {editingDocId ? "עדכן לוח יום ✏️" : "שמור לוח יום 💾"}
                                    </button>
                                    {editingDocId && (
                                        <button onClick={cancelEditSchedule} className="btn-cancel-edit">
                                            בטל עריכה ✕
                                        </button>
                                    )}
                                </>
                            )}
                            {!user && <p className="login-hint">👤 התחבר כדי לשמור</p>}
                        </div>

                        {/* Google Calendar section */}
                        <div className="gcal-section">
                            {user && !gCalToken && (
                                <>
                                    <button
                                        onClick={connectGoogleCalendar}
                                        className="btn-gcal-connect"
                                    >
                                        🔗 חבר את Google Calendar
                                    </button>
                                    <p className="gcal-help-text">
                                        💡 עברה את כל המשימות שלך ישירות ל-Google Calendar. לחץ וחזור עם הרשאות.
                                    </p>
                                </>
                            )}
                            {user && gCalToken && (
                                <>
                                    <button
                                        onClick={() => {
                                            const today = new Date().toISOString().split("T")[0];
                                            pushScheduleToGoogleCalendar(schedule, today);
                                        }}
                                        disabled={gCalLoading}
                                        className="btn-gcal-push"
                                    >
                                        {gCalLoading ? '⏳ שמירה...' : '📅 שמור הכל ב-Google Calendar'}
                                    </button>
                                    <span className="gcal-connected">✅ Google Calendar מחובר</span>
                                    {gCalError && (
                                        <div className="gcal-error">
                                            <strong>שגיאה:</strong> {gCalError}
                                            {gCalError === 'INSUFFICIENT_PERMISSIONS' && (
                                                <p>👉 הרשאות לא ניתנו. לחץ שוב על הכפתור וודא שאתה מאשר את Google Calendar.</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* SECTION 6: Saved Schedules Card */}
                {savedSchedules.length > 0 && (
                    <div className="section card saved-section" ref={savedSchedulesRef}>
                        <h2>📂 לוחות שמורים</h2>

                        {savedSchedules.map((saved) => (
                            <div key={saved.id} className="saved-card">
                                <div
                                    className="saved-header-clickable"
                                    onClick={() =>
                                        setExpandedScheduleId(
                                            expandedScheduleId === saved.id ? null : saved.id
                                        )
                                    }
                                >
                                    <div className="saved-info">
                                        {saved.dayName && (
                                            <span className="saved-day-badge">{saved.dayName}</span>
                                        )}
                                        <span className="saved-date">
                                            {new Date(saved.date).toLocaleDateString("he-IL")}
                                        </span>
                                        <span className="saved-meta">
                                            {saved.startTime} • {calculateTotalDuration(saved.schedule)} דקות • {saved.tasks.length} משימות
                                        </span>
                                    </div>
                                    <span className="expand-icon">
                                        {expandedScheduleId === saved.id ? "▼" : "▶"}
                                    </span>
                                </div>

                                {/* Expanded timeline */}
                                {expandedScheduleId === saved.id && (
                                    <div className="saved-expanded">
                                        <div className="saved-timeline">
                                            {saved.schedule.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`timeline-item timeline-${item.type}`}
                                                >
                                                    <div className="timeline-content">
                                                        <span className="timeline-title">{item.title}</span>
                                                        <span className="timeline-time">
                                                            {formatMinutes(item.start)} – {formatMinutes(item.end)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Saved schedule actions */}
                                        <div className="saved-actions">
                                            <button
                                                onClick={() => loadScheduleIntoEditor(saved)}
                                                className="btn-edit-saved"
                                            >
                                                ערוך ✏️
                                            </button>
                                            {user && gCalToken && (
                                                <button
                                                    onClick={() => pushScheduleToGoogleCalendar(saved.schedule, saved.date)}
                                                    disabled={gCalLoading}
                                                    className="btn-gcal-saved"
                                                >
                                                    {gCalLoading ? '⏳ שמירה...' : '📅 Google Calendar'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteSavedSchedule(saved.id)}
                                                className="btn-delete-saved"
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

            {/* Toast notification */}
            {saveToast && <div className="toast">{saveToast}</div>}
        </div>
    );
}
