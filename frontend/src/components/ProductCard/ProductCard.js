import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/productCard.css';
import StarRating, { NewItemBadge } from '../StarRating/StarRating';
import { useWishlist } from '../../context/WishlistContext';

// This component takes a "product" object and displays it
// Reusable everywhere: Home, Products page, Search results
const ProductCard = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product._id);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="col-4 product-card-wrapper">
      <Link to={`/products/${product._id}`} className="product-card-link">
        <div className="col-5" data-category={product.category}>
          <div className="product-card-img-container">
            <img
              src={product.images?.[0]?.url || '/img/placeholder.png'}
              height="250"
              alt={product.name}
            />
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

          <h1>{product.name}</h1>
          <div className="rating">
            {product.numReviews > 0 ? (
              <>
                <StarRating value={product.rating} size={14} />
                <span className="rating-count">({product.numReviews})</span>
              </>
            ) : (
              <NewItemBadge />
            )}
          </div>
          <p className="price">
            {product.discountPrice > 0 ? (
              <>
                <span className="old-price">Rs.{product.price}</span>
                <span className="new-price">Rs.{product.discountPrice}</span>
              </>
            ) : (
              <span>Rs.{product.price}</span>
            )}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
