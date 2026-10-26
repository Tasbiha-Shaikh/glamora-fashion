import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/productCard.css';
import StarRating, { NewItemBadge } from '../StarRating/StarRating';
import { useWishlist } from '../../context/WishlistContext';

// Unified Product Card Component used across the entire website
const ProductCard = ({ product, onClick }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product._id);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="product-card">
      <Link
        to={`/products/${product._id}`}
        className="product-card-link"
        onClick={onClick}
      >
        <div className="product-card-media">
          <div className="product-card-img-wrapper">
            <img
              src={product.images?.[0]?.url || product.img || '/img/logo.png'}
              alt={product.name}
              className="product-card-img"
              onError={(e) => {
                e.target.src = '/img/logo.png';
              }}
            />
          </div>
          {product.isDeal && (
            <span className="product-card-badge deal">🔥 Deal</span>
          )}
          {product.discountPrice > 0 && !product.isDeal && (
            <span className="product-card-badge sale">Sale</span>
          )}
          {/* Floating Wishlist Button */}
          <button
            type="button"
            className={`product-card-wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={handleWishlistClick}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            {isWishlisted ? '❤️' : '♡'}
          </button>
        </div>

        <div className="product-card-body">
          {product.category && (
            <div className="product-card-meta">
              <span className="product-card-category">{product.category}</span>
              {product.brand && (
                <span className="product-card-brand">{product.brand}</span>
              )}
            </div>
          )}

          <h3 className="product-card-title">{product.name}</h3>

          <div className="product-card-rating">
            {product.numReviews > 0 ? (
              <>
                <StarRating value={product.rating} size={13} />
                <span className="product-card-reviews">
                  ({product.numReviews})
                </span>
              </>
            ) : (
              <NewItemBadge />
            )}
          </div>

          <div className="product-card-pricing">
            {product.discountPrice > 0 ? (
              <>
                <span className="product-card-old-price">
                  Rs.{product.price}
                </span>
                <span className="product-card-new-price">
                  Rs.{product.discountPrice}
                </span>
              </>
            ) : (
              <span className="product-card-new-price">Rs.{product.price}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
