import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/notFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  const categories = [
    { name: 'Watches', icon: '⌚', path: '/products?category=watches' },
    { name: 'Rings', icon: '💍', path: '/products?category=rings' },
    { name: 'Glasses', icon: '👓', path: '/products?category=glasses' },
    { name: 'Necklaces', icon: '📿', path: '/products?category=necklaces' },
    { name: 'Bracelets', icon: '💎', path: '/products?category=bracelets' },
    { name: 'Earrings', icon: '✨', path: '/products?category=earrings' },
  ];

  return (
    <div className="not-found-page">
      <div className="not-found-container">

        {/* 404 BADGE */}
        <div className="not-found-glam">
          <span className="not-found-code">404</span>
          <div className="not-found-sparkle">✨</div>
        </div>

        {/* HEADINGS */}
        <h1 className="not-found-title">Lost in the Collection?</h1>
        <p className="not-found-desc">
          We couldn't find the page you were looking for. It might have been moved, removed, or never existed in our catalog.
        </p>

        {/* PRIMARY ACTIONS */}
        <div className="not-found-actions">
          <button className="not-found-btn-primary" onClick={() => navigate('/')}>
            🏠 Back to Home
          </button>
          <button className="not-found-btn-secondary" onClick={() => navigate('/products')}>
            🛍️ Browse All Products
          </button>
        </div>

        {/* POPULAR CATEGORIES SHORTCUTS */}
        <div className="not-found-categories">
          <p className="not-found-cat-title">Or explore popular categories:</p>
          <div className="not-found-cat-chips">
            {categories.map((cat) => (
              <Link key={cat.name} to={cat.path} className="not-found-chip">
                <span>{cat.icon}</span> {cat.name}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotFound;

