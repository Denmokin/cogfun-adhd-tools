import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  collection, addDoc, getDocs, doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import EFGrid from '../components/EFGrid';
import RatingStars from '../components/RatingStars';
import FactorList from '../components/FactorList';
import { useTheme } from '../hooks/useTheme';
import { LOCATIONS, DOMAINS, WITH_WHOM } from '../data/constants';

const EMPTY = {
  description: '', location: '--', domain: '--', withWhom: '--',
  executiveFunctions: [],
  importance: 0, performance: 0, enjoyment: 0, satisfaction: 0,
  successSelf: [], failSelf: [], successExt: [], failExt: [],
  learning: '', improvement: '',
};

const FACTOR_KEYS = [
  { id: 'successSelf', type: 'success' },
  { id: 'failSelf',    type: 'failure' },
  { id: 'successExt',  type: 'success' },
  { id: 'failExt',     type: 'failure' },
];

const RATINGS = [
  ['importance',   'חשיבות'],
  ['performance',  'ביצועים'],
  ['enjoyment',    'הנאה'],
  ['satisfaction', 'שביעות רצון'],
];

export default function OPEAPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const aaaId   = params.get('id');
  const opeaId  = params.get('opeaId');
  const isEdit  = params.get('edit') === 'true';
  const aaaName = decodeURIComponent(params.get('name') || '');

  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [showMsg, setShowMsg] = useState(false);

  useEffect(() => {
    if (isEdit && aaaId && opeaId) loadExisting();
  }, [isEdit, aaaId, opeaId]);

  async function loadExisting() {
    const snap = await getDocs(collection(db, 'entries', aaaId, 'opea'));
    const existing = snap.docs.find(d => d.id === opeaId);
    if (existing) setForm({ ...EMPTY, ...existing.data() });
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && opeaId) {
        await updateDoc(doc(db, 'entries', aaaId, 'opea', opeaId), form);
      } else {
        await addDoc(collection(db, 'entries', aaaId, 'opea'), {
          ...form,
          createdAt: new Date().toISOString(),
        });
      }
      setShowMsg(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-user">
          <span>OPEA</span>
        </div>
        <div className="topbar-actions">
          <button className="btn-theme" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn-logout" onClick={() => navigate('/')}>
            ← חזור
          </button>
        </div>
      </div>

      <div className="form-wrapper">
        <div
          className="form-header"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
        >
          <h1>OPEA</h1>
          <p>Occupational Performance Experience Analysis</p>
          {aaaName && (
            <p style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>
              🔗 {aaaName}
            </p>
          )}
        </div>

        <form className="form-body" onSubmit={handleSubmit}>
          {/* Description */}
          <div className="section">
            <div className="section-title">תיאור</div>
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

          {/* Ratings */}
          <div className="section">
            <div className="section-title">דירוגים</div>
            <div className="ratings-grid">
              {RATINGS.map(([key, label]) => (
                <div key={key} className="rating-item">
                  <label style={{ display: 'block', marginBottom: 6 }}>{label}</label>
                  <RatingStars
                    name={key}
                    value={form[key]}
                    onChange={v => set(key, v)}
                  />
                </div>
              ))}
            </div>
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

          {/* Learning + Improvement */}
          <div className="section">
            <div className="section-title">למידה ושיפור</div>
            <label>למידה מהאירוע</label>
            <textarea rows={3} value={form.learning}
              onChange={e => set('learning', e.target.value)} />
            <label>מה לשפר</label>
            <textarea rows={3} value={form.improvement}
              onChange={e => set('improvement', e.target.value)} />
          </div>

          <button
            type="submit"
            className="submit-btn"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
            disabled={loading}
          >
            {loading ? '...' : isEdit ? 'עדכן OPEA' : 'שמור OPEA'}
          </button>

          {showMsg && (
            <div className="success-msg" style={{ display: 'block' }}>
              ✅ נשמר בהצלחה!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
