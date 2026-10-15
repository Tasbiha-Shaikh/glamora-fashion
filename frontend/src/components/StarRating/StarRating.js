import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import '../../styles/starRating.css';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

// Display mode: <StarRating value={4.3} />  — stars fill partially for averages
// Input mode:   <StarRating value={rating} onChange={setRating} />
const StarRating = ({ value = 0, onChange, size = 16 }) => {
  const [hover, setHover] = useState(0);
  const isInput = typeof onChange === 'function';
  const shown = isInput && hover ? hover : value;

  if (isInput) {
    return (
      <div className="star-rating star-input" role="radiogroup" aria-label="Choose a rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            className={`star-btn ${star <= shown ? 'filled' : ''}`}
            style={{ fontSize: size }}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <FaStar />
          </button>
        ))}
        {shown > 0 && <span className="star-label">{LABELS[shown]}</span>}
      </div>
    );
  }

  return (
    <span
      className="star-rating"
      style={{ fontSize: size }}
      role="img"
      aria-label={`Rated ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1))) * 100;
        return (
          <span className="star" key={star}>
            <FaStar className="star-empty" />
            <span className="star-fill" style={{ width: `${fill}%` }}>
              <FaStar />
            </span>
          </span>
        );
      })}
    </span>
  );
};

// Shown instead of stars when a product has no reviews yet
export const NewItemBadge = () => <span className="new-item-badge">New item</span>;

export default StarRating;
