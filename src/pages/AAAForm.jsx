import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/auth";
import EFGrid from '../components/EFGrid';
import FactorList from '../components/FactorList';
import RatingStars from '../components/RatingStars';
import Card from '../components/Card';
import {
  createEntry,
  updateEntry,
  loadEntries,
  deleteEntry,
  clearAllEntries,
  loadOpea,
} from '../lib/entriesApi';
import { LOCATIONS, DOMAINS, WITH_WHOM } from '../data/constants';

const INIT = {
  eventName: '',
  eventDate: new Date().toISOString().slice(0, 10),
  eventTime: '',
  description: '',
  location: '',
  domain: '',
  withWhom: '',
  executiveFunctions: [],
  importance: null,
  successSelf: [],
  failSelf: [],
  successExt: [],
  failExt: [],
};

export default function AAAForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(INIT);
  const [editingId, setEditingId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [opeaMap, setOpeaMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const list = await loadEntries(user.uid);
      setEntries(list);
      const map = {};
      for (const e of list) {
        const o = await loadOpea(user.uid, e.id);
        if (o) map[e.id] = o;
      }
      setOpeaMap(map);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({
      ...INIT,
      eventDate: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSubmitting(true);
    try {
      const entry = {
        eventName: form.eventName,
        eventDate: form.eventDate,
        eventTime: form.eventTime,
        description: form.description,
        location: form.location,
        domain: form.domain,
        withWhom: form.withWhom,
        executiveFunctions: form.executiveFunctions,
        importance: form.importance ? String(form.importance) : '',
        successSelf: form.successSelf,
        failSelf: form.failSelf,
        successExt: form.successExt,
        failExt: form.failExt,
      };
      if (editingId) {
        await updateEntry(user.uid, editingId, entry);
        resetForm();
      } else {
        await createEntry(user.uid, entry);
        setForm((f) => ({ ...f, ...INIT, eventDate: new Date().toISOString().slice(0, 10), successSelf: [], failSelf: [], successExt: [], failExt: [] }));
      }
      await load();
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      eventName: entry.eventName || '',
      eventDate: entry.eventDate || new Date().toISOString().slice(0, 10),
      eventTime: entry.eventTime || '',
      description: entry.description || '',
      location: entry.location || '',
      domain: entry.domain || '',
      withWhom: entry.withWhom || '',
      executiveFunctions: entry.executiveFunctions || [],
      importance: entry.importance ? Number(entry.importance) : null,
      successSelf: entry.successSelf || [],
      failSelf: entry.failSelf || [],
      successExt: entry.successExt || [],
      failExt: entry.failExt || [],
    });
    document.querySelector('.form-wrapper')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => resetForm();

  const handleDelete = async (id) => {
    if (!confirm('למחוק רשומה זו + OPEA שלה?')) return;
    await deleteEntry(user.uid, id);
    await load();
  };

  const handleClearAll = async () => {
    if (!confirm('לנקות את כל הרשומות?')) return;
    await clearAllEntries(user.uid);
    await load();
  };

  const handleExportHtml = () => {
    exportHtmlReport(entries, opeaMap);
  };

  return (
    <div className="page-wrapper">
      <div className="form-wrapper">
        <div className="form-header">
          <h1>AAA – מודעות מנבאת מסתגלת</h1>
          <p>נספח 21 · ניטור וניתוח התנסות תפקודית עתידית</p>
        </div>
        <form className="form-body" id="aaaForm" onSubmit={handleSubmit}>
          {editingId && (
            <div className="section" style={{ background: '#fef9c3', borderColor: '#fbbf24' }}>
              ✏️ מצב עריכה — אתה עורך רשומה קיימת
            </div>
          )}

          <div className="section">
            <div className="section-title">📌 פרטי האירוע</div>
            <label htmlFor="eventName">שם האירוע</label>
            <input type="text" id="eventName" name="eventName" value={form.eventName} onChange={handleChange} placeholder="לדוגמה: בניית יומן שבועי" required />
            <div className="row-2">
              <div>
                <label htmlFor="eventDate">תאריך</label>
                <input type="date" id="eventDate" name="eventDate" value={form.eventDate} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="eventTime">שעה</label>
                <input type="text" id="eventTime" name="eventTime" value={form.eventTime} onChange={handleChange} placeholder="HH:mm" pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$" required />
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">📝 תיאור</div>
            <label htmlFor="description">תאר את הסיטואציה בפירוט</label>
            <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange} required />
          </div>

          <div className="section">
            <div className="section-title">🗂️ הקשר</div>
            <div className="row-3">
              <div>
                <label htmlFor="location">איפה?</label>
                <select id="location" name="location" value={form.location} onChange={handleChange}>
                  <option value="">-- בחר --</option>
                  {LOCATIONS.filter(Boolean).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="domain">תחום</label>
                <select id="domain" name="domain" value={form.domain} onChange={handleChange}>
                  <option value="">-- בחר --</option>
                  {DOMAINS.filter(Boolean).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="withWhom">עם מי?</label>
                <select id="withWhom" name="withWhom" value={form.withWhom} onChange={handleChange}>
                  <option value="">-- בחר --</option>
                  {WITH_WHOM.filter(Boolean).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">🧠 תפקודים ניהוליים</div>
            <p className="section-hint">סמן את התפקודים הנדרשים לביצוע</p>
            <EFGrid selected={form.executiveFunctions} onChange={(v) => setForm((f) => ({ ...f, executiveFunctions: v }))} />
          </div>

          <div className="section">
            <div className="section-title">⭐ חשיבות</div>
            <p className="section-hint">1=לא חשוב, 5=מאוד חשוב</p>
            <RatingStars name="importance" value={form.importance} onChange={(v) => setForm((f) => ({ ...f, importance: v }))} />
          </div>

          <div className="section">
            <div className="section-title">⚖️ גורמים להצלחה ולכישלון</div>
            <div className="factors-grid">
              <FactorList id="successSelf" type="success" items={form.successSelf} onChange={(v) => setForm((f) => ({ ...f, successSelf: v }))} />
              <FactorList id="failSelf" type="failure" items={form.failSelf} onChange={(v) => setForm((f) => ({ ...f, failSelf: v }))} />
              <FactorList id="successExt" type="success" items={form.successExt} onChange={(v) => setForm((f) => ({ ...f, successExt: v }))} />
              <FactorList id="failExt" type="failure" items={form.failExt} onChange={(v) => setForm((f) => ({ ...f, failExt: v }))} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '⏳ שומר...' : editingId ? '✏️ עדכן' : '💾 שמור טופס AAA'}
          </button>
          {editingId && (
            <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
              ביטול עריכה
            </button>
          )}
          {successMsg && <div className="success-msg">✅ נשמר בהצלחה! 🙌</div>}
        </form>
      </div>

      <div className="history-wrapper">
        <div className="history-header">
          <h2>📋 היסטוריה <span className="badge">{entries.length}</span></h2>
        </div>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>⏳ טוען...</p>
        ) : !entries.length ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>אין רשומות עדיין</p>
        ) : (
          <div>
            {entries.map((entry) => (
              <Card
                key={entry.id}
                entry={entry}
                opea={opeaMap[entry.id]}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        <div className="history-footer">
          <button type="button" className="btn-csv" onClick={handleExportHtml}>
            📊 דו"ח HTML
          </button>
          <button type="button" className="btn-clear" onClick={handleClearAll}>
            🗑️ נקה הכל
          </button>
        </div>
      </div>
    </div>
  );
}

function exportHtmlReport(entries, opeaMap) {
  if (!entries.length) return alert('אין נתונים לדו"ח');

  const stars = (v) => (v ? '★'.repeat(Number(v)) + '☆'.repeat(5 - Number(v)) : '—');
  const list = (arr) => (arr?.length ? arr.map((i) => `<li>${i}</li>`).join('') : '<li style="color:#999">לא צוין</li>');
  const tags = (arr) => (arr?.length ? arr.map((t) => `<span class="tag">${t}</span>`).join('') : '<span style="color:#999">לא צוין</span>');
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const reportRows = entries.map((e, i) => {
    const o = opeaMap[e.id] || null;
    return `
    <div class="report-card">
      <div class="report-card-header">
        <div class="report-num">${i + 1}</div>
        <div class="report-title-block">
          <h2>${esc(e.eventName)}</h2>
          <span class="report-meta">📅 ${e.eventDate} | 🕐 ${e.eventTime} | 📍 ${esc(e.location || '—')} | 💼 ${esc(e.domain || '—')} | 👥 ${esc(e.withWhom || '—')}</span>
        </div>
        <div class="report-badges">
          ${o ? '<span class="badge-done">✅ OPEA מולא</span>' : '<span class="badge-pending">⏳ OPEA חסר</span>'}
        </div>
      </div>
      <div class="report-body">
        <div class="report-col">
          <div class="col-title aaa-col-title">📌 AAA — לפני האירוע</div>
          <div class="field-label">📝 תיאור</div>
          <div class="field-value">${esc(e.description || '—')}</div>
          <div class="field-label">🧠 תפקודים ניהוליים</div>
          <div class="field-value tags-wrap">${tags(e.executiveFunctions)}</div>
          <div class="field-label">⭐ חשיבות</div>
          <div class="field-value stars">${stars(e.importance)}</div>
          <div class="factors-grid">
            <div class="factor-col success"><div class="factor-title">✅ להצלחה — אלי</div><ul>${list(e.successSelf)}</ul></div>
            <div class="factor-col failure"><div class="factor-title">⚠️ לכישלון — אלי</div><ul>${list(e.failSelf)}</ul></div>
            <div class="factor-col success"><div class="factor-title">✅ להצלחה — חיצוני</div><ul>${list(e.successExt)}</ul></div>
            <div class="factor-col failure"><div class="factor-title">⚠️ לכישלון — חיצוני</div><ul>${list(e.failExt)}</ul></div>
          </div>
        </div>
        <div class="report-col ${o ? '' : 'col-empty'}">
          <div class="col-title opea-col-title">📋 OPEA — אחרי האירוע</div>
          ${o ? `
          <div class="field-label">📝 תיאור</div>
          <div class="field-value">${esc(o.description || '—')}</div>
          <div class="field-label">🧠 תפקודים שנדרשו בפועל</div>
          <div class="field-value tags-wrap">${tags(o.executiveFunctions)}</div>
          <div class="ratings-row">
            <div class="rating-box"><div class="rating-label">⭐ חשיבות</div><div class="stars">${stars(o.importance)}</div></div>
            <div class="rating-box"><div class="rating-label">🏆 ביצוע</div><div class="stars">${stars(o.performance)}</div></div>
            <div class="rating-box"><div class="rating-label">😊 הנאה</div><div class="stars">${stars(o.enjoyment)}</div></div>
            <div class="rating-box"><div class="rating-label">😌 שביעות</div><div class="stars">${stars(o.satisfaction)}</div></div>
          </div>
          <div class="factors-grid">
            <div class="factor-col success"><div class="factor-title">✅ להצלחה — אלי</div><ul>${list(o.successSelf)}</ul></div>
            <div class="factor-col failure"><div class="factor-title">⚠️ לכישלון — אלי</div><ul>${list(o.failSelf)}</ul></div>
            <div class="factor-col success"><div class="factor-title">✅ להצלחה — חיצוני</div><ul>${list(o.successExt)}</ul></div>
            <div class="factor-col failure"><div class="factor-title">⚠️ לכישלון — חיצוני</div><ul>${list(o.failExt)}</ul></div>
          </div>
          ${o.learning ? `<div class="field-label">💡 למדתי</div><div class="field-value learn-box">${esc(o.learning)}</div>` : ''}
          ${o.improvement ? `<div class="field-label">🔧 לשיפור</div><div class="field-value improve-box">${esc(o.improvement)}</div>` : ''}
          ` : '<div class="empty-opea">טרם מולא טופס OPEA לאירוע זה</div>'}
        </div>
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>דו"ח AAA + OPEA — ${new Date().toLocaleDateString('he-IL')}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a2e; background: #f0f4f8; direction: rtl; padding: 32px; }
  h1.report-main-title { text-align: center; font-size: 24px; font-weight: 800; color: #667eea; margin-bottom: 6px; }
  .report-subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 32px; }
  .report-card { background: #fff; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,.08); margin-bottom: 28px; overflow: hidden; page-break-inside: avoid; }
  .report-card-header { display: flex; align-items: center; gap: 16px; padding: 18px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
  .report-num { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0; }
  .report-title-block { flex: 1; }
  .report-title-block h2 { font-size: 17px; font-weight: 700; }
  .report-meta { font-size: 12px; opacity: .85; }
  .report-badges { flex-shrink: 0; }
  .badge-done { background: rgba(255,255,255,.2); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-pending { background: rgba(255,255,255,.1); color: rgba(255,255,255,.7); padding: 4px 12px; border-radius: 20px; font-size: 12px; }
  .report-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .report-col { padding: 20px 24px; border-left: 1px solid #e8edf2; }
  .report-col:last-child { border-left: none; }
  .col-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 14px; padding-bottom: 8px; }
  .aaa-col-title { color: #667eea; border-bottom: 2px solid rgba(102,126,234,.2); }
  .opea-col-title { color: #10b981; border-bottom: 2px solid rgba(16,185,129,.2); }
  .field-label { font-size: 12px; font-weight: 700; color: #555; margin-top: 12px; margin-bottom: 4px; }
  .field-value { font-size: 13px; color: #333; }
  .tags-wrap { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
  .tag { background: rgba(118,75,162,.1); color: #764ba2; border-radius: 6px; padding: 2px 8px; font-size: 12px; }
  .stars { color: #f59e0b; font-size: 16px; margin-top: 2px; }
  .ratings-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
  .rating-box { background: #fafbfc; border: 1px solid #e8edf2; border-radius: 8px; padding: 8px; text-align: center; }
  .rating-label { font-size: 11px; color: #666; margin-bottom: 4px; }
  .factors-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  .factor-col { border-radius: 8px; padding: 10px; font-size: 12px; }
  .factor-col.success { background: rgba(16,185,129,.06); border: 1.5px solid rgba(16,185,129,.3); }
  .factor-col.failure { background: rgba(234,88,12,.06); border: 1.5px solid rgba(234,88,12,.25); }
  .factor-title { font-weight: 700; margin-bottom: 6px; font-size: 12px; }
  .factor-col ul { padding-right: 16px; color: #444; line-height: 1.8; }
  .learn-box, .improve-box { background: rgba(102,126,234,.06); border: 1px solid rgba(102,126,234,.2); border-radius: 8px; padding: 10px; margin-top: 4px; font-size: 13px; }
  .col-empty .empty-opea { margin-top: 40px; text-align: center; color: #bbb; font-size: 14px; }
  @media print { body { background: white; padding: 16px; } .report-card { box-shadow: none; border: 1px solid #ddd; } }
</style>
</head>
<body>
  <h1 class="report-main-title">🧠 דו"ח AAA + OPEA</h1>
  <div class="report-subtitle">
    ${entries.length} אירועים · ${entries.filter((e) => opeaMap[e.id]).length} עם OPEA · הופק בתאריך ${new Date().toLocaleDateString('he-IL')}
  </div>
  ${reportRows}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
