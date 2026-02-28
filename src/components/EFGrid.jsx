import { EF_CATEGORIES } from '../data/constants';

export default function EFGrid({ selected, onChange }) {
  const toggle = (item) => {
    const next = selected.includes(item)
      ? selected.filter(x => x !== item)
      : [...selected, item];
    onChange(next);
  };

  return (
    <div className="ef-grid">
      {Object.entries(EF_CATEGORIES).map(([cat, items]) => (
        <div key={cat} className="ef-category">
          <div className="ef-category-title">{cat}</div>
          {items.map(item => (
            <label key={item} className="ef-item">
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => toggle(item)}
              />
              {item}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
