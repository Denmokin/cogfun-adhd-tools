import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function buildStars(v) {
  if (!v) return '';
  const n = Number(v);
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function FactorSection({ label, items }) {
  const isSuccess = label.startsWith('✅');
  return (
    <div className={`detail-factor ${isSuccess ? 'success' : 'failure'}-factor`}>
      <strong>{label}</strong>
      <ul>
        {items?.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}

export default function Card({ entry, opea, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="aaa-card">
      {/* ── Header (click to expand) ── */}
      <div
        className="card-header"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <strong>{entry.eventName}</strong>
          {opea
            ? <span className="opea-badge done">✅ OPEA מולא</span>
            : <span className="opea-badge pending">⏳ OPEA טרם מולא</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="card-date">{entry.eventDate} {entry.eventTime}</span>
          <span className="card-arrow">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* ── Collapsed summary ── */}
      {!open && (
        <div className="card-summary">
          <div>📍 {entry.location || '—'} | {entry.domain || '—'} | {entry.withWhom || '—'}</div>
          <div>{entry.description?.substring(0, 120)}{entry.description?.length > 120 ? '...' : ''}</div>
          <div className="card-tags">
            {entry.executiveFunctions?.slice(0, 4).map(t => (
              <span key={t} className="card-tag">{t}</span>
            ))}
            {entry.executiveFunctions?.length > 4 && (
              <span className="card-tag">+{entry.executiveFunctions.length - 4}</span>
            )}
          </div>
          <div className="card-stars">{buildStars(entry.importance)}</div>
        </div>
      )}

      {/* ── Expanded details ── */}
      {open && (
        <div className="card-details">
          <div className="detail-section-title">📌 AAA — פרטי האירוע</div>

          <div className="detail-row">
            <strong>📝 תיאור:</strong>
            <p>{entry.description || '—'}</p>
          </div>
          <div className="detail-row">
            <strong>🗂️ הקשר:</strong>
            <p>📍 {entry.location || '—'} | 💼 {entry.domain || '—'} | 👥 {entry.withWhom || '—'}</p>
          </div>
          <div className="detail-row">
            <strong>🧠 תפקודים:</strong>
            <div className="card-tags" style={{ marginTop: 6 }}>
              {entry.executiveFunctions?.length
                ? entry.executiveFunctions.map(t => (
                    <span key={t} className="card-tag">{t}</span>
                  ))
                : <span style={{ color: 'var(--text-muted)' }}>לא צוין</span>}
            </div>
          </div>
          <div className="detail-factors">
            <FactorSection label="✅ להצלחה–אלי"   items={entry.successSelf} />
            <FactorSection label="⚠️ לכישלון–אלי"  items={entry.failSelf} />
            <FactorSection label="✅ להצלחה–חיצוני" items={entry.successExt} />
            <FactorSection label="⚠️ לכישלון–חיצוני" items={entry.failExt} />
          </div>
          <div className="detail-row">
            <strong>⭐ חשיבות:</strong>
            <span className="card-stars">{buildStars(entry.importance)}</span>
          </div>

          {/* ── Linked OPEA ── */}
          {opea && (
            <div className="opea-full-section">
              <div className="opea-full-title">📋 OPEA — פירוט מלא</div>
              <div className="detail-row"><strong>📝 תיאור:</strong><p>{opea.description || '—'}</p></div>
              <div className="detail-row"><strong>🗂️ הקשר:</strong><p>📍 {opea.location || '—'} | 💼 {opea.domain || '—'} | 👥 {opea.withWhom || '—'}</p></div>
              <div className="detail-row"><strong>🧠 תפקודים:</strong>
                <div className="card-tags" style={{ marginTop: 6 }}>
                  {opea.executiveFunctions?.map(t => <span key={t} className="card-tag">{t}</span>) || <span style={{ color: 'var(--text-muted)' }}>לא צוין</span>}
                </div>
              </div>
              <div className="detail-row"><strong>📊 דירוגים:</strong>
                <div className="ratings-inline">
                  <span>⭐ חשיבות: {buildStars(opea.importance) || '—'}</span>
                  <span>🏆 ביצוע: {buildStars(opea.performance) || '—'}</span>
                  <span>😊 הנאה: {buildStars(opea.enjoyment) || '—'}</span>
                  <span>😌 שביעות: {buildStars(opea.satisfaction) || '—'}</span>
                </div>
              </div>
              <div className="detail-factors">
                <FactorSection label="✅ להצלחה–אלי"   items={opea.successSelf} />
                <FactorSection label="⚠️ לכישלון–אלי"  items={opea.failSelf} />
                <FactorSection label="✅ להצלחה–חיצוני" items={opea.successExt} />
                <FactorSection label="⚠️ לכישלון–חיצוני" items={opea.failExt} />
              </div>
              {opea.learning && (
                <div className="detail-row"><strong>💡 למדתי:</strong><p>{opea.learning}</p></div>
              )}
              {opea.improvement && (
                <div className="detail-row"><strong>🔧 לשיפור:</strong><p>{opea.improvement}</p></div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Footer (always visible, like vanilla) ── */}
      <div className="card-footer">
        <button className="btn-edit" onClick={() => onEdit(entry)}>✏️ ערוך AAA</button>
        {!opea ? (
          <button
            className="btn-opea"
            onClick={() =>
              navigate(`/opea?id=${entry.id}&name=${encodeURIComponent(entry.eventName || '')}`)
            }
          >
            📋 מלא OPEA
          </button>
        ) : (
          <button
            className="btn-edit"
            style={{ marginTop: 0 }}
            onClick={() =>
              navigate(`/opea?id=${entry.id}&opeaId=${opea.id}&name=${encodeURIComponent(entry.eventName || '')}&edit=true`)
            }
          >
            ✏️ ערוך OPEA
          </button>
        )}
        <button className="btn-delete" onClick={() => onDelete(entry.id)}>🗑️ מחק</button>
      </div>
    </div>
  );
}
