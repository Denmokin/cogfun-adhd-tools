import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from "@/auth";
import EFGrid from '../components/EFGrid';
import FactorList from '../components/FactorList';
import RatingStars from '../components/RatingStars';
import {
  createOpea,
  updateOpea,
  loadOpeaForEdit,
} from '../lib/entriesApi';
import { LOCATIONS, DOMAINS, WITH_WHOM } from '../data/constants';

const INIT = {
  description: '',
  location: '',
  domain: '',
  withWhom: '',
  executiveFunctions: [],
  importance: null,
  performance: null,
  enjoyment: null,
  satisfaction: null,
  successSelf: [],
  failSelf: [],
  successExt: [],
  failExt: [],
  learning: '',
  improvement: '',
};

export default function OPEAForm() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const aaaId = searchParams.get('id') || '';
  const opeaId = searchParams.get('opeaId') || '';
  const linkedName = searchParams.get('name') ? decodeURIComponent(searchParams.get('name')) : '';
  const isEdit = searchParams.get('edit') === 'true';

  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(!!(isEdit && opeaId));
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (!user?.uid || !isEdit || !opeaId || !aaaId) return;
    let mounted = true;
    (async () => {
      try {
        const data = await loadOpeaForEdit(user.uid, aaaId, opeaId);
        if (mounted && data) {
          setForm({
            description: data.description || '',
            location: data.location || '',
            domain: data.domain || '',
            withWhom: data.withWhom || '',
            executiveFunctions: data.executiveFunctions || [],
            importance: data.importance ? Number(data.importance) : null,
            performance: data.performance ? Number(data.performance) : null,
            enjoyment: data.enjoyment ? Number(data.enjoyment) : null,
            satisfaction: data.satisfaction ? Number(data.satisfaction) : null,
            successSelf: data.successSelf || [],
            failSelf: data.failSelf || [],
            successExt: data.successExt || [],
            failExt: data.failExt || [],
            learning: data.learning || '',
            improvement: data.improvement || '',
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.uid, aaaId, opeaId, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid || !aaaId) return alert('חסר מזהה אירוע');
    setSubmitting(true);
    try {
      const entry = {
        linkedAaaId: aaaId,
        linkedAaaName: linkedName,
        description: form.description,
        location: form.location,
        domain: form.domain,
        withWhom: form.withWhom,
        executiveFunctions: form.executiveFunctions,
        importance: form.importance ? String(form.importance) : '',
        performance: form.performance ? String(form.performance) : '',
        enjoyment: form.enjoyment ? String(form.enjoyment) : '',
        satisfaction: form.satisfaction ? String(form.satisfaction) : '',
        successSelf: form.successSelf,
        failSelf: form.failSelf,
        successExt: form.successExt,
        failExt: form.failExt,
        learning: form.learning,
        improvement: form.improvement,
      };
      if (isEdit && opeaId) {
        await updateOpea(user.uid, aaaId, opeaId, entry);
      } else {
        await createOpea(user.uid, aaaId, entry);
      }
      setSuccessMsg(true);
      setTimeout(() => navigate('/aaa'), 2000);
    } catch (err) {
      alert('שגיאה: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!aaaId) {
    return (
      <div className="page-wrapper">
        <div className="card">
          <p>יש לגשת לעמוד OPEA דרך כרטיס AAA — לחץ על "📋 מלא OPEA" בכרטיס אירוע.</p>
          <button type="button" className="btn-edit" onClick={() => navigate('/aaa')}>
            חזרה ל-AAA
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <p style={{ textAlign: 'center', padding: 40 }}>⏳ טוען...</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="form-wrapper">
        <div className="form-header" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
          <h1>📋 OPEA</h1>
          <p>Occupational Performance Experience Analysis</p>
          {linkedName && (
            <p style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>
              🔗 מקושר ל: {linkedName}
            </p>
          )}
        </div>
        <form className="form-body" id="opeaForm" onSubmit={handleSubmit}>
          <div className="section">
            <div className="section-title">📝 תיאור האירוע</div>
            <label htmlFor="description">תאר את האירוע בפירוט</label>
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
            <p className="section-hint">סמן את התפקודים שנדרשו בפועל</p>
            <EFGrid selected={form.executiveFunctions} onChange={(v) => setForm((f) => ({ ...f, executiveFunctions: v }))} />
          </div>

          <div className="section">
            <div className="section-title">📊 דירוגים</div>
            <div className="ratings-grid">
              <div className="rating-item">
                <label>⭐ חשיבות</label>
                <RatingStars name="importance" value={form.importance} onChange={(v) => setForm((f) => ({ ...f, importance: v }))} />
              </div>
              <div className="rating-item">
                <label>🏆 רמת ביצוע</label>
                <RatingStars name="performance" value={form.performance} onChange={(v) => setForm((f) => ({ ...f, performance: v }))} />
              </div>
              <div className="rating-item">
                <label>😊 הנאה</label>
                <RatingStars name="enjoyment" value={form.enjoyment} onChange={(v) => setForm((f) => ({ ...f, enjoyment: v }))} />
              </div>
              <div className="rating-item">
                <label>😌 שביעות רצון</label>
                <RatingStars name="satisfaction" value={form.satisfaction} onChange={(v) => setForm((f) => ({ ...f, satisfaction: v }))} />
              </div>
            </div>
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

          <div className="section">
            <div className="section-title">💡 למידה ושיפור</div>
            <label htmlFor="learning">מה למדתי מהאירוע?</label>
            <textarea id="learning" name="learning" rows={3} value={form.learning} onChange={handleChange} />
            <label htmlFor="improvement">רעיונות לשימור ו/או שיפור</label>
            <textarea id="improvement" name="improvement" rows={3} value={form.improvement} onChange={handleChange} />
          </div>

          <button
            type="submit"
            className="submit-btn"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
            disabled={submitting}
          >
            {submitting ? '⏳ שומר...' : isEdit ? '✏️ עדכן OPEA' : '💾 שמור OPEA'}
          </button>
          {successMsg && <div className="success-msg">✅ נשמר! חוזר לדף הראשי... 🙌</div>}
        </form>
      </div>
    </div>
  );
}
