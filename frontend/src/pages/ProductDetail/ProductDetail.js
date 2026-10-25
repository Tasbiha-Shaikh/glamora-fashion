import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/productDetail.css';
import StarRating, { NewItemBadge } from '../../components/StarRating/StarRating';
import { useToast } from '../../components/Toast/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import { API_URL } from '../../config/api';

const FIRST_REVIEWS = 3;
const MORE_REVIEWS = 10;

const ProductDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Fetch the single product by ID from URL
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/products/${id}`);
        setProduct(res.data.data);

        // Fetch related products from same category
        const allRes = await axios.get(`${API_URL}/api/products`);
        const related = allRes.data.data
          .filter((p) => p.category === res.data.data.category && p._id !== id)
          .slice(0, 3);
        setRelatedProducts(related);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Latest reviews first; "Show more" loads the next batch
  const fetchReviews = async (skip, limit) => {
    setLoadingReviews(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/reviews/product/${id}?skip=${skip}&limit=${limit}`
      );
      setReviews((prev) => (skip === 0 ? res.data.data.reviews : [...prev, ...res.data.data.reviews]));
      setTotalReviews(res.data.data.total);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    setReviews([]);
    setTotalReviews(0);
    fetchReviews(0, FIRST_REVIEWS);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToCart = () => {
    if (qty <= 0) {
      toast.warning('Quantity must be greater than 0 to add to cart.');
      return;
    }

    // use localStorage
    let cart = JSON.parse(localStorage.getItem('glamoraCart')) || [];
    const existingIndex = cart.findIndex((item) => item.id === product._id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity = qty;
    } else {
      cart.push({
        id: product._id,
        name: product.name,
        price: product.discountPrice > 0 ? product.discountPrice : product.price,
        quantity: qty,
        img: product.images?.[0]?.url || '/img/logo.png',
      });
    }

    localStorage.setItem('glamoraCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success(`${qty}x ${product.name} added to the cart!`, 'Added to Cart');
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '100px' }}>Loading...</p>;
  if (!product) return <p style={{ textAlign: 'center', padding: '100px' }}>Product not found.</p>;

  return (
    <>
      <div id="pd-wrapper">
        <div className="pd-inner-row">

          {/* IMAGE SIDE */}
          <div className="pd-image-side">
            <img
              id="productImg"
              src={product.images?.[0]?.url || '/img/logo.png'}
              alt={product.name}
              onError={(e) => { e.target.src = '/img/logo.png'; }}
            />
          </div>

          {/* CONTENT SIDE */}
          <div className="pd-content-side">
            <p className="pd-breadcrumb">
              Home / {product.category} / {product.name}
            </p>
            <h1 id="productName">{product.name}</h1>

            <div className="pd-rating-stars">
              {product.numReviews > 0 ? (
                <>
                  <StarRating value={product.rating} size={20} />
                  <a href="#pd-reviews">
                    {product.rating.toFixed(1)} ({product.numReviews} review{product.numReviews > 1 ? 's' : ''})
                  </a>
                </>
              ) : (
                <NewItemBadge />
              )}
            </div>

            <h3 id="productPrice">
              {product.discountPrice > 0 ? (
                <>
                  <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '22px', marginRight: '10px' }}>
                    Rs.{product.price}
                  </span>
                  Rs.{product.discountPrice}
                </>
              ) : (
                <>Rs.{product.price.toFixed(2)}</>
              )}
            </h3>

            <div className="pd-meta-info">
              <p><strong>SKU:</strong> GLM-{product._id.slice(-6).toUpperCase()}</p>
              <p>
                <strong>Stock:</strong>{' '}
                {product.stock > 0 ? (
                  <span style={{ color: 'green' }}>Available ({product.stock})</span>
                ) : (
                  <span style={{ color: 'red' }}>Out of Stock</span>
                )}
              </p>
            </div>

            <div className="pd-qty-section">
              <h4 className="pd-label">Quantity</h4>
              <div className="pd-action-box">
                <input
                  type="number"
                  value={qty}
                  min="1"
                  max={product.stock}
                  id="qtyInput"
                  onChange={(e) => setQty(Number(e.target.value))}
                />
                <button
                  className="pd-add-btn"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add To Cart'}
                </button>
                <button
                  type="button"
                  className={`pd-wishlist-btn ${isInWishlist(product._id) ? 'active' : ''}`}
                  onClick={() => toggleWishlist(product)}
                  title={isInWishlist(product._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  {isInWishlist(product._id) ? '❤️ In Wishlist' : '♡ Add to Wishlist'}
                </button>
              </div>
            </div>

            <div className="pd-desc-box">
              <h4>Description</h4>
              <p>{product.description}</p>
            </div>

            <div className="pd-shipping-info">
              <p><strong>Shipping:</strong> Free standard shipping on orders over Rs.50.</p>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <section id="pd-reviews" className="pd-reviews">
        <h2 className="title">Customer Reviews</h2>

        {product.numReviews > 0 ? (
          <div className="pd-review-summary">
            <span className="pd-review-average">{product.rating.toFixed(1)}</span>
            <div>
              <StarRating value={product.rating} size={22} />
              <p>Based on {product.numReviews} review{product.numReviews > 1 ? 's' : ''}</p>
            </div>
          </div>
        ) : null}

        {!loadingReviews && totalReviews === 0 ? (
          <div className="pd-no-reviews">
            <p><strong>No reviews yet</strong></p>
            <p>Customers who buy this item can share their experience once their order is delivered.</p>
          </div>
        ) : (
          <ul className="pd-review-list">
            {reviews.map((review) => (
              <li className="pd-review" key={review._id}>
                <div className="pd-review-head">
                  <div className="pd-review-avatar">{review.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="pd-review-name">
                      {review.name} <span className="pd-verified">✔ Verified purchase</span>
                    </p>
                    <div className="pd-review-meta">
                      <StarRating value={review.rating} size={14} />
                      <span>
                        {new Date(review.createdAt).toLocaleDateString('en-PK', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && <p className="pd-review-comment">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}

        {reviews.length < totalReviews && (
          <button
            className="pd-show-more"
            onClick={() => fetchReviews(reviews.length, MORE_REVIEWS)}
            disabled={loadingReviews}
          >
            {loadingReviews ? 'Loading...' : `Show more reviews (${totalReviews - reviews.length} more)`}
          </button>
        )}
      </section>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="small-container">
          <h2 className="title">Related Products</h2>
          <div className="row" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            {relatedProducts.map((rp) => (
              <div className="col-4" key={rp._id} style={{ flex: 1, maxWidth: '250px' }}>
                <Link to={`/products/${rp._id}`} className="related-link">
                  <img
                    src={rp.images?.[0]?.url || '/img/logo.png'}
                    style={{ width: '100%' }}
                    alt={rp.name}
                    onError={(e) => { e.target.src = '/img/logo.png'; }}
                  />
                  <h4>{rp.name}</h4>
                  <p>Rs.{rp.price.toFixed(2)}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;