import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, addDoc, getDocs, deleteDoc,
  updateDoc, doc, orderBy, query,
} from 'firebase/firestore';
import { db } from '../firebase';
import Topbar from '../components/Topbar';
import EFGrid from '../components/EFGrid';
import RatingStars from '../components/RatingStars';
import FactorList from '../components/FactorList';
import Card from '../components/Card';
import { LOCATIONS, DOMAINS, WITH_WHOM } from '../data/constants';

const today = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  eventName: '', eventDate: today(), eventTime: '',
  description: '', location: '--', domain: '--', withWhom: '--',
  executiveFunctions: [], importance: 0,
  successSelf: [], failSelf: [], successExt: [], failExt: [],
};

const FACTOR_KEYS = [
  { id: 'successSelf', type: 'success' },
  { id: 'failSelf',    type: 'failure' },
  { id: 'successExt',  type: 'success' },
  { id: 'failExt',     type: 'failure' },
];

export default function AAAPage({ user, theme, onToggleTheme, onLogout }) {
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [entries,    setEntries]    = useState([]);
  const [opeaMap,    setOpeaMap]    = useState({});
  const [editingId,  setEditingId]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showMsg,    setShowMsg]    = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const snap = await getDocs(
      query(collection(db, 'entries'), orderBy('createdAt', 'desc'))
    );
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setEntries(list);

    const oMap = {};
    for (const e of list) {
      const oSnap = await getDocs(collection(db, 'entries', e.id, 'opea'));
      if (!oSnap.empty)
        oMap[e.id] = { id: oSnap.docs[0].id, ...oSnap.docs[0].data() };
    }
    setOpeaMap(oMap);
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'entries', editingId), form);
        cancelEdit();
      } else {
        await addDoc(collection(db, 'entries'), {
          ...form,
          createdAt: new Date().toISOString(),
        });
        setForm({ ...EMPTY_FORM, eventDate: today() });
      }
      setShowMsg(true);
      setTimeout(() => setShowMsg(false), 2500);
      await loadAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(entry) {
    setForm({ ...EMPTY_FORM, ...entry });
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, eventDate: today() });
  }

  async function handleDelete(id) {
    if (!window.confirm('למחוק את הרשומה? גם OPEA ימחק.')) return;
    const oSnap = await getDocs(collection(db, 'entries', id, 'opea'));
    await Promise.all(oSnap.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'entries', id));
    await loadAll();
  }

  // ── HTML Export (ported from original exportHtmlReport) ────────────────────
  async function exportHtml() {
    const btn = document.getElementById('exportBtn');
    btn.disabled = true;
    btn.textContent = '...';

    const stars = v =>
      v ? '★'.repeat(Number(v)) + '☆'.repeat(5 - Number(v)) : '';
    const list  = arr =>
      arr?.length
        ? arr.map(i => `<li>${i}</li>`).join('')
        : `<li style="color:#999">—</li>`;
    const tags  = arr =>
      arr?.length
        ? arr.map(t => `<span class="tag">${t}</span>`).join('')
        : `<span style="color:#999">—</span>`;
    const esc   = s =>
      (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const rows = entries.map(e => ({ aaa: e, opea: opeaMap[e.id] || null }));

    const reportRows = rows.map(({ aaa: e, opea: o }, i) => `
      <div class="report-card">
        <div class="report-card-header">
          <div class="report-num">${i + 1}</div>
          <div class="report-title-block">
            <h2>${esc(e.eventName)}</h2>
            <span class="report-meta">${e.eventDate} ${e.eventTime} • ${esc(e.location)} • ${esc(e.domain)} • ${esc(e.withWhom)}</span>
          </div>
          <div class="report-badges">
            ${o
              ? '<span class="badge-done">✓ OPEA</span>'
              : '<span class="badge-pending">OPEA</span>'}
          </div>
        </div>
        <div class="report-body">
          <div class="report-col">
            <div class="col-title aaa-col-title">AAA</div>
            <div class="field-label">תיאור</div><div class="field-value">${esc(e.description)}</div>
            <div class="field-label">פונקציות ניהוליות</div>
            <div class="field-value tags-wrap">${tags(e.executiveFunctions)}</div>
            <div class="field-label">חשיבות</div>
            <div class="field-value stars">${stars(e.importance)}</div>
            <div class="factors-grid">
              <div class="factor-col success"><div class="factor-title">✅ הצלחה עצמית</div><ul>${list(e.successSelf)}</ul></div>
              <div class="factor-col failure"><div class="factor-title">❌ כישלון עצמי</div><ul>${list(e.failSelf)}</ul></div>
              <div class="factor-col success"><div class="factor-title">✅ הצלחה חיצונית</div><ul>${list(e.successExt)}</ul></div>
              <div class="factor-col failure"><div class="factor-title">❌ כישלון חיצוני</div><ul>${list(e.failExt)}</ul></div>
            </div>
          </div>
          <div class="report-col">
            <div class="col-title opea-col-title">OPEA</div>
            ${o ? `
              <div class="field-label">תיאור</div><div class="field-value">${esc(o.description)}</div>
              <div class="ratings-row">
                <div class="rating-box"><div class="rating-label">חשיבות</div><div class="stars">${stars(o.importance)}</div></div>
                <div class="rating-box"><div class="rating-label">ביצועים</div><div class="stars">${stars(o.performance)}</div></div>
                <div class="rating-box"><div class="rating-label">הנאה</div><div class="stars">${stars(o.enjoyment)}</div></div>
                <div class="rating-box"><div class="rating-label">שביעות רצון</div><div class="stars">${stars(o.satisfaction)}</div></div>
              </div>
              <div class="factors-grid">
                <div class="factor-col success"><div class="factor-title">✅ הצלחה עצמית</div><ul>${list(o.successSelf)}</ul></div>
                <div class="factor-col failure"><div class="factor-title">❌ כישלון עצמי</div><ul>${list(o.failSelf)}</ul></div>
                <div class="factor-col success"><div class="factor-title">✅ הצלחה חיצונית</div><ul>${list(o.successExt)}</ul></div>
                <div class="factor-col failure"><div class="factor-title">❌ כישלון חיצוני</div><ul>${list(o.failExt)}</ul></div>
              </div>
              ${o.learning    ? `<div class="field-label">למידה</div><div class="field-value learn-box">${esc(o.learning)}</div>` : ''}
              ${o.improvement ? `<div class="field-label">שיפור</div><div class="field-value improve-box">${esc(o.improvement)}</div>` : ''}
            ` : '<div class="empty-opea">לא הוזן OPEA לאירוע זה</div>'}
          </div>
        </div>
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8">
<title>AAA OPEA דוח – ${new Date().toLocaleDateString('he-IL')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a2e;background:#f0f4f8;direction:rtl;padding:32px}
h1.report-main-title{text-align:center;font-size:24px;font-weight:800;color:#667eea;margin-bottom:6px}
.report-subtitle{text-align:center;color:#666;font-size:13px;margin-bottom:32px}
.report-card{background:#fff;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:28px;overflow:hidden;page-break-inside:avoid}
.report-card-header{display:flex;align-items:center;gap:16px;padding:18px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:white}
.report-num{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0}
.report-title-block{flex:1}.report-title-block h2{font-size:17px;font-weight:700}
.report-meta{font-size:12px;opacity:.85}
.report-badges{flex-shrink:0}
.badge-done{background:rgba(255,255,255,.2);color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
.badge-pending{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);padding:4px 12px;border-radius:20px;font-size:12px}
.report-body{display:grid;grid-template-columns:1fr 1fr;gap:0}
.report-col{padding:20px 24px;border-left:1px solid #e8edf2}.report-col:last-child{border-left:none}
.col-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px}
.aaa-col-title{color:#667eea;border-bottom:2px solid rgba(102,126,234,.2)}
.opea-col-title{color:#10b981;border-bottom:2px solid rgba(16,185,129,.2)}
.field-label{font-size:12px;font-weight:700;color:#555;margin-top:12px;margin-bottom:4px}
.field-value{font-size:13px;color:#333}
.tags-wrap{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.tag{background:rgba(118,75,162,.1);color:#764ba2;border-radius:6px;padding:2px 8px;font-size:12px}
.stars{color:#f59e0b;font-size:16px;margin-top:2px}
.ratings-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
.rating-box{background:#fafbfc;border:1px solid #e8edf2;border-radius:8px;padding:8px;text-align:center}
.rating-label{font-size:11px;color:#666;margin-bottom:4px}.rating-box .stars{font-size:13px}
.factors-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.factor-col{border-radius:8px;padding:10px;font-size:12px}
.factor-col.success{background:rgba(16,185,129,.06);border:1.5px solid rgba(16,185,129,.3)}
.factor-col.failure{background:rgba(234,88,12,.06);border:1.5px solid rgba(234,88,12,.25)}
.factor-title{font-weight:700;margin-bottom:6px;font-size:12px}
.factor-col.success .factor-title{color:#16a34a}
.factor-col.failure .factor-title{color:#ea580c}
.factor-col ul{padding-right:16px;color:#444;line-height:1.8}
.learn-box{background:rgba(102,126,234,.06);border:1px solid rgba(102,126,234,.2);border-radius:8px;padding:10px;margin-top:4px;font-size:13px;color:#333}
.improve-box{background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:10px;margin-top:4px;font-size:13px;color:#333}
.empty-opea{margin-top:40px;text-align:center;color:#bbb;font-size:14px}
@media print{body{background:white;padding:16px}.report-card{box-shadow:none;border:1px solid #ddd}}
</style></head>
<body>
<h1 class="report-main-title">AAA OPEA</h1>
<div class="report-subtitle">${rows.length} רשומות • ${rows.filter(r => r.opea).length} עם OPEA • ${new Date().toLocaleDateString('he-IL')}</div>
${reportRows}
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `aaa-opea-report-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    btn.disabled    = false;
    btn.textContent = 'ייצוא HTML';
  }

  return (
    <div className="page-wrapper">
      <Topbar user={user} theme={theme} onToggleTheme={onToggleTheme} onLogout={onLogout} />

      {/* ── FORM ── */}
      <div className="form-wrapper">
        <div className="form-header">
          <h1>AAA</h1>
          <p>21 שאלות לאחר אירוע</p>
        </div>

        <form className="form-body" onSubmit={handleSubmit}>
          {editingId && (
            <div id="editBanner">✏️ מצב עריכה – {form.eventName}</div>
          )}

          {/* Event info */}
          <div className="section">
            <div className="section-title">פרטי האירוע</div>
            <label>שם האירוע</label>
            <input
              type="text"
              value={form.eventName}
              onChange={e => set('eventName', e.target.value)}
              placeholder="שם האירוע"
              required
            />
            <div className="row-2">
              <div>
                <label>תאריך</label>
                <input type="date" value={form.eventDate}
                  onChange={e => set('eventDate', e.target.value)} required />
              </div>
              <div>
                <label>שעה</label>
                <input type="text" value={form.eventTime}
                  onChange={e => set('eventTime', e.target.value)}
                  placeholder="HH:mm" required />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="section">
            <div className="section-title">תיאור</div>
            <label>תאר את האירוע</label>
            <textarea rows={4} value={form.description}
              onChange={e => set('description', e.target.value)} required />
          </div>

          {/* Context */}
          <div className="section">
            <div className="section-title">הקשר</div>
            <div className="row-3">
              <div>
                <label>מיקום?</label>
                <select value={form.location} onChange={e => set('location', e.target.value)}>
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label>תחום</label>
                <select value={form.domain} onChange={e => set('domain', e.target.value)}>
                  {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label>עם מי?</label>
                <select value={form.withWhom} onChange={e => set('withWhom', e.target.value)}>
                  {WITH_WHOM.map(w => <option key={w}>{w}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* EF Grid */}
          <div className="section">
            <div className="section-title">פונקציות ניהוליות</div>
            <p className="section-hint">סמן את הפונקציות הרלוונטיות</p>
            <EFGrid
              selected={form.executiveFunctions}
              onChange={v => set('executiveFunctions', v)}
            />
          </div>

          {/* Importance */}
          <div className="section">
            <div className="section-title">חשיבות</div>
            <p className="section-hint">1–5 כוכבים</p>
            <RatingStars
              name="importance"
              value={form.importance}
              onChange={v => set('importance', v)}
            />
          </div>

          {/* Factor Lists */}
          <div className="section">
            <div className="section-title">גורמים</div>
            <div className="factors-grid">
              {FACTOR_KEYS.map(({ id, type }) => (
                <FactorList
                  key={id}
                  id={id}
                  type={type}
                  items={form[id]}
                  onChange={v => set(id, v)}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '...' : editingId ? 'עדכן AAA' : 'שמור AAA'}
          </button>
          {editingId && (
            <button type="button" className="btn-cancel" onClick={cancelEdit}>
              ביטול עריכה
            </button>
          )}
          {showMsg && (
            <div className="success-msg" style={{ display: 'block' }}>✅ נשמר בהצלחה!</div>
          )}
        </form>
      </div>

      {/* ── HISTORY ── */}
      <div className="history-wrapper">
        <div className="history-header">
          <h2>היסטוריה <span className="badge">{entries.length}</span></h2>
        </div>

        {entries.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
            אין רשומות עדיין
          </p>
        )}

        {entries.map(e => (
          <Card
            key={e.id}
            entry={e}
            opea={opeaMap[e.id] || null}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        <div className="history-footer">
          <button id="exportBtn" className="btn-csv" onClick={exportHtml}>
            ייצוא HTML
          </button>
        </div>
      </div>
    </div>
  );
}
