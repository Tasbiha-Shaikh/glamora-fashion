import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../components/Toast/ToastContext';
import StarRating, { NewItemBadge } from '../../components/StarRating/StarRating';
import '../../styles/wishlist.css';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const toast = useToast();

  const handleAddToCart = (product) => {
    if (product.stock === 0) {
      toast.warning(`"${product.name}" is currently out of stock.`, 'Out of Stock');
      return;
    }

    const productId = product._id || product.id;
    let cart = JSON.parse(localStorage.getItem('glamoraCart')) || [];
    const existingIndex = cart.findIndex((item) => item.id === productId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        id: productId,
        name: product.name,
        price: product.discountPrice > 0 ? product.discountPrice : product.price,
        quantity: 1,
        img: product.images?.[0]?.url || product.img || '/img/logo.png',
      });
    }

    localStorage.setItem('glamoraCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success(`"${product.name}" added to cart!`, 'Added to Cart');
  };

  const handleMoveAllToCart = () => {
    const availableItems = wishlist.filter((item) => item.stock > 0 || item.stock === undefined);
    if (availableItems.length === 0) {
      toast.warning('No available in-stock items to add to cart.', 'Cart Update');
      return;
    }

    let cart = JSON.parse(localStorage.getItem('glamoraCart')) || [];

    availableItems.forEach((product) => {
      const productId = product._id || product.id;
      const existingIndex = cart.findIndex((item) => item.id === productId);
      if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          id: productId,
          name: product.name,
          price: product.discountPrice > 0 ? product.discountPrice : product.price,
          quantity: 1,
          img: product.images?.[0]?.url || product.img || '/img/logo.png',
        });
      }
    });

    localStorage.setItem('glamoraCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success(`Added ${availableItems.length} items from your wishlist to cart!`, 'Cart Updated');
  };

  return (
    <div className="wishlist-page-container">
      {/* Top Banner / Breadcrumb */}
      <div className="wishlist-header">
        <div className="wishlist-header-content">
          <div className="wishlist-breadcrumbs">
            <Link to="/">Home</Link>
            <span> / </span>
            <span>Wishlist</span>
          </div>
          <h1>My Wishlist</h1>
          <p className="wishlist-subtitle">
            {wishlist.length === 0
              ? 'Save your favorite luxury fashion and accessories in one place.'
              : `You have ${wishlist.length} item${wishlist.length === 1 ? '' : 's'} saved in your wishlist.`}
          </p>
        </div>

        {wishlist.length > 0 && (
          <div className="wishlist-header-actions">
            <button
              className="wishlist-action-btn move-all-btn"
              onClick={handleMoveAllToCart}
              title="Add all in-stock wishlist items to cart"
            >
              🛒 Add All to Cart
            </button>
            <button
              className="wishlist-action-btn clear-all-btn"
              onClick={clearWishlist}
              title="Clear all saved items"
            >
              🗑️ Clear Wishlist
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {wishlist.length === 0 ? (
        <div className="wishlist-empty-state">
          <div className="wishlist-empty-icon-wrapper">
            <span className="wishlist-empty-heart">♡</span>
          </div>
          <h2>Your wishlist is currently empty</h2>
          <p>
            Explore our curated collections of watches, rings, glasses, bracelets, and necklaces.
            Tap the heart icon on any product to save it here for later.
          </p>
          <div className="wishlist-empty-actions">
            <Link to="/products" className="wishlist-browse-btn">
              Explore Collections
            </Link>
            <Link to="/products?category=watches" className="wishlist-cat-pill">
              Watches
            </Link>
            <Link to="/products?category=rings" className="wishlist-cat-pill">
              Rings
            </Link>
            <Link to="/products?category=bracelets" className="wishlist-cat-pill">
              Bracelets
            </Link>
          </div>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item) => {
            const itemId = item._id || item.id;
            const imageUrl =
              item.images?.[0]?.url || item.img || '/img/placeholder.png';
            const isOutOfStock = item.stock === 0;

            return (
              <div className="wishlist-card" key={itemId}>
                {/* Remove Button */}
                <button
                  className="wishlist-remove-btn"
                  title="Remove from wishlist"
                  aria-label="Remove item"
                  onClick={() => removeFromWishlist(itemId)}
                >
                  ✕
                </button>

                {/* Product Thumbnail */}
                <Link to={`/products/${itemId}`} className="wishlist-card-media">
                  <img src={imageUrl} alt={item.name} loading="lazy" />
                  {isOutOfStock ? (
                    <span className="wishlist-stock-tag out-of-stock">Out of Stock</span>
                  ) : item.discountPrice > 0 ? (
                    <span className="wishlist-stock-tag on-sale">Sale</span>
                  ) : null}
                </Link>

                {/* Card Info */}
                <div className="wishlist-card-body">
                  <div className="wishlist-card-meta">
                    {item.category && <span className="wishlist-category">{item.category}</span>}
                    {item.brand && <span className="wishlist-brand">{item.brand}</span>}
                  </div>

                  <Link to={`/products/${itemId}`} className="wishlist-card-title">
                    <h3>{item.name}</h3>
                  </Link>

                  <div className="wishlist-card-rating">
                    {item.numReviews > 0 ? (
                      <>
                        <StarRating value={item.rating || 0} size={13} />
                        <span className="wishlist-reviews-count">({item.numReviews})</span>
                      </>
                    ) : (
                      <NewItemBadge />
                    )}
                  </div>

                  <div className="wishlist-card-pricing">
                    {item.discountPrice > 0 ? (
                      <>
                        <span className="wishlist-old-price">Rs.{item.price}</span>
                        <span className="wishlist-new-price">Rs.{item.discountPrice}</span>
                      </>
                    ) : (
                      <span className="wishlist-new-price">Rs.{item.price}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="wishlist-card-actions">
                    <button
                      className={`wishlist-cart-btn ${isOutOfStock ? 'disabled' : ''}`}
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(item)}
                    >
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <Link to={`/products/${itemId}`} className="wishlist-view-btn">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

