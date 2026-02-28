import React from 'react';

export default function RatingStars({ name, value, onChange }) {
  return (
    <div className="rating-row">
      {[5, 4, 3, 2, 1].map(n => (
        <React.Fragment key={n}>
          <input
            type="radio"
            id={`${name}-${n}`}
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
          />
          <label htmlFor={`${name}-${n}`}>★</label>
        </React.Fragment>
      ))}
    </div>
  );
}
