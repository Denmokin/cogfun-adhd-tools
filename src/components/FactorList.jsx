import { useState } from 'react';

const LABELS = {
  successSelf: '✅ הצלחה עצמית',
  failSelf:    '❌ כישלון עצמי',
  successExt:  '✅ הצלחה חיצונית',
  failExt:     '❌ כישלון חיצוני',
};

export default function FactorList({ id, items, onChange, type }) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput('');
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  };

  return (
    <div className={`factor-box ${type}`}>
      <div className="factor-title">{LABELS[id] || (type === 'success' ? '✅ הצלחה' : '❌ כישלון')}</div>
      <div className="add-item-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="הוסף פריט..."
        />
        <button type="button" className="btn-add" onClick={add}>+</button>
      </div>
      <div className="items-list">
        {items.map((item, i) => (
          <div key={i} className="list-item">
            <span>{item}</span>
            <button type="button" onClick={() => remove(i)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
