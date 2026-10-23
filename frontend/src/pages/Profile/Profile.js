import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/profile.css';
import StarRating from '../../components/StarRating/StarRating';
import { useToast } from '../../components/Toast/ToastContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── REVIEW FORM (shown under a delivered item) ───────────────────────────────
const ReviewForm = ({ orderId, item, onSubmitted, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please choose a star rating.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('glamoraToken');
      const res = await axios.post(
        `${API_URL}/api/reviews`,
        { productId: item.productId, orderId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSubmitted(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your review. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <p className="review-form-title">How would you rate {item.name}?</p>
      <StarRating value={rating} onChange={setRating} size={26} />
      <textarea
        placeholder="Share what you liked or didn't like (optional)"
        value={comment}
        maxLength={1000}
        rows={3}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="review-form-footer">
        <span className="review-char-count">{comment.length}/1000</span>
        <div className="review-form-actions">
          <button type="button" className="review-cancel-btn" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
      {error && <p className="review-error">{error}</p>}
    </form>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [updateForm, setUpdateForm] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [myReviews, setMyReviews] = useState({}); // productId -> review
  const [openReview, setOpenReview] = useState(null); // `${orderId}-${productId}`

  // Cancellation modal state
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelCustomReason, setCancelCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Return modal state
  const [returningOrderId, setReturningOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState('Defective / Damaged product');
  const [returnDetails, setReturnDetails] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    let savedUser = null;
    try {
      const stored = localStorage.getItem('glamoraUser');
      if (stored) savedUser = JSON.parse(stored);
    } catch (e) {
      savedUser = null;
    }
    const token = localStorage.getItem('glamoraToken');

    // If not logged in redirect to login
    if (!savedUser || !token) {
      navigate('/login');
      return;
    }

    setUser(savedUser);
    setUpdateForm({ name: savedUser.name, email: savedUser.email });
    fetchOrders(token);
    fetchMyReviews(token);
  }, []);

  const fetchMyReviews = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/api/reviews/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyReviews(Object.fromEntries(res.data.data.map((r) => [r.product, r])));
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleReviewSubmitted = (review) => {
    setMyReviews((prev) => ({ ...prev, [review.product]: review }));
    setOpenReview(null);
  };

  // Delivered items the user hasn't reviewed yet (each product counted once)
  const pendingReviewCount = new Set(
    orders
      .filter((o) => o.status === 'delivered')
      .flatMap((o) => o.items.map((i) => i.productId))
      .filter((productId) => productId && !myReviews[productId])
  ).size;

  const fetchOrders = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const token = localStorage.getItem('glamoraToken');
      const res = await axios.put(
        `${API_URL}/api/auth/profile`,
        updateForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update localStorage with new info
      const updatedUser = { ...user, ...res.data.data };
      localStorage.setItem('glamoraUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('userUpdated'));
      setMessage('Profile updated successfully!');
      toast.success('Your profile details have been saved.', 'Profile Updated');
    } catch (error) {
      setMessage('Failed to update profile.');
      toast.error('Failed to update profile. Please try again.');
    }
  };

  // ── ORDER CANCELLATION ────────────────────────────────────────────────────────
  const handleCancelOrderSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingOrderId) return;
    setCancelling(true);

    const fullReason = cancelReason === 'Other'
      ? (cancelCustomReason.trim() || 'Other reason')
      : cancelReason;

    try {
      const token = localStorage.getItem('glamoraToken');
      const res = await axios.put(
        `${API_URL}/api/orders/${cancellingOrderId}/cancel`,
        { reason: fullReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update orders list locally
      setOrders(prev => prev.map(o => o._id === cancellingOrderId ? res.data.data : o));
      setCancellingOrderId(null);
      setCancelCustomReason('');
      toast.success(`Order #${cancellingOrderId.slice(-6).toUpperCase()} has been cancelled.`, 'Order Cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // ── RETURN REQUEST ────────────────────────────────────────────────────
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returningOrderId) return;
    setSubmittingReturn(true);

    try {
      const token = localStorage.getItem('glamoraToken');
      const res = await axios.post(
        `${API_URL}/api/orders/${returningOrderId}/return`,
        { reason: returnReason, details: returnDetails },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update orders list locally
      setOrders(prev => prev.map(o => o._id === returningOrderId ? res.data.data : o));
      setReturningOrderId(null);
      setReturnDetails('');
      toast.success('Return request submitted! Our team will review and assign a courier rider for pickup.', 'Return Requested');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return request.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('glamoraToken');
    localStorage.removeItem('glamoraUser');
    window.dispatchEvent(new Event('userUpdated'));
    navigate('/login');
  };

  // Status badge color
  const statusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      processing: '#3498db',
      shipped: '#9b59b6',
      delivered: '#27ae60',
      cancelled: '#e74c3c',
    };
    return colors[status] || '#999';
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '100px' }}>Loading...</p>;

  return (
    <div className="profile-page">
      <div className="profile-wrapper">

        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
          </div>

          <ul className="profile-menu">
            <li
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              👤 My Profile
            </li>
            <li
              className={activeTab === 'orders' ? 'active' : ''}
              onClick={() => setActiveTab('orders')}
            >
              📦 My Orders
              {orders.length > 0 && (
                <span className="order-count-badge">{orders.length}</span>
              )}
              {pendingReviewCount > 0 && (
                <span className="review-pending-badge" title="Items waiting for your review">
                  ★ {pendingReviewCount}
                </span>
              )}
            </li>
            <li onClick={handleLogout} className="logout-item">
              🚪 Logout
            </li>
          </ul>
        </aside>

        {/* MAIN CONTENT */}
        <div className="profile-content">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <h2>My Profile</h2>
              <hr />
              {message && (
                <p className={`profile-msg ${message.includes('success') ? 'success' : 'error'}`}>
                  {message}
                </p>
              )}
              <form onSubmit={handleUpdate} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={updateForm.name}
                    onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={updateForm.email}
                    onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" value={user?.role} disabled />
                </div>
                <button type="submit" className="btn">Update Profile</button>
              </form>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="orders-tab">
              <h2>My Orders</h2>
              <hr />
              {orders.length === 0 ? (
                <div className="no-orders">
                  <p>You have no orders yet.</p>
                  <button className="btn" onClick={() => navigate('/products')}>
                    Start Shopping
                  </button>
                </div>
              ) : (
                orders.map((order) => {
                  const isCancellable = order.status === 'pending' || order.status === 'processing';
                  const isDelivered = order.status === 'delivered';
                  const returnReq = order.returnRequest;
                  const hasReturn = returnReq && returnReq.status && returnReq.status !== 'none';

                  return (
                    <div className="order-card" key={order._id}>
                      <div className="order-card-header">
                        <div>
                          <p className="order-id">Order ID: <strong>#{order._id.slice(-8).toUpperCase()}</strong></p>
                          <p className="order-date">
                            {new Date(order.createdAt).toLocaleDateString('en-PK', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            className="order-status"
                            style={{ background: statusColor(order.status) }}
                          >
                            {order.status.toUpperCase()}
                          </span>

                          {/* Order Action: Cancel Button (for pending/processing) */}
                          {isCancellable && (
                            <button
                              className="order-cancel-btn"
                              onClick={() => setCancellingOrderId(order._id)}
                              title="Cancel this order before it is dispatched"
                            >
                              ✕ Cancel
                            </button>
                          )}

                          {/* Order Action: Return Button (for delivered orders without active return) */}
                          {isDelivered && !hasReturn && (
                            <button
                              className="order-return-btn"
                              onClick={() => setReturningOrderId(order._id)}
                              title="Request a return within 7 days of delivery"
                            >
                              🔄 Return Item
                            </button>
                          )}
                        </div>
                      </div>

                      {/* CANCELLATION NOTICE IF CANCELLED */}
                      {order.status === 'cancelled' && (
                        <div className="order-cancel-notice">
                          <span>🚫 <strong>Cancelled:</strong> {order.cancelReason || 'Cancelled by customer'}</span>
                          {order.cancelledAt && (
                            <span className="order-cancel-date">
                              on {new Date(order.cancelledAt).toLocaleDateString('en-PK')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* RETURN STATUS BANNER IF RETURN REQUESTED/APPROVED/REJECTED */}
                      {hasReturn && (
                        <div className={`order-return-banner status-${returnReq.status}`}>
                          <div className="return-banner-header">
                            <span className="return-banner-title">
                              {returnReq.status === 'requested' && '🔄 Return Request Under Review'}
                              {returnReq.status === 'approved' && '✅ Return Approved — Courier Pickup Assigned'}
                              {returnReq.status === 'rejected' && '❌ Return Request Rejected'}
                              {returnReq.status === 'completed' && '📦 Return Completed'}
                            </span>
                            <span className="return-banner-date">
                              {returnReq.requestedAt && new Date(returnReq.requestedAt).toLocaleDateString('en-PK')}
                            </span>
                          </div>

                          <div className="return-banner-body">
                            <p><strong>Your Reason:</strong> {returnReq.reason}</p>
                            {returnReq.details && (
                              <p className="return-banner-details">"{returnReq.details}"</p>
                            )}

                            {/* ADMIN RESPONSE & PICKUP INSTRUCTIONS */}
                            {returnReq.adminResponse && (
                              <div className="return-admin-note">
                                <strong>Admin & Pickup Update:</strong>
                                <p>{returnReq.adminResponse}</p>
                              </div>
                            )}

                            {returnReq.pickupStatus && (
                              <p className="return-pickup-status">
                                <strong>Pickup Status:</strong> <span>{returnReq.pickupStatus}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="order-items-list">
                        {order.items.map((item, i) => {
                          const reviewKey = `${order._id}-${item.productId}`;
                          const myReview = myReviews[item.productId];
                          const canReview = order.status === 'delivered' && item.productId;

                          return (
                            <div className="order-item-block" key={i}>
                              <div className="order-item-row">
                                <img
                                  src={item.img || '/img/logo.png'}
                                  alt={item.name}
                                  onError={(e) => { e.target.src = '/img/logo.png'; }}
                                />
                                <div>
                                  <p>{item.name}</p>
                                  <p>Qty: {item.quantity} × Rs.{item.price.toFixed(2)}</p>
                                </div>
                                <p className="item-subtotal">
                                  Rs.{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>

                              {canReview && (
                                myReview ? (
                                  <div className="item-review-done">
                                    <span>Your rating:</span>
                                    <StarRating value={myReview.rating} size={14} />
                                    <Link to={`/products/${item.productId}#pd-reviews`}>View on product</Link>
                                  </div>
                                ) : openReview === reviewKey ? (
                                  <ReviewForm
                                    orderId={order._id}
                                    item={item}
                                    onSubmitted={handleReviewSubmitted}
                                    onCancel={() => setOpenReview(null)}
                                  />
                                ) : (
                                  <button
                                    className="write-review-btn"
                                    onClick={() => setOpenReview(reviewKey)}
                                  >
                                    ★ Write a review
                                  </button>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="order-card-footer">
                        <p>Payment: <strong>{order.paymentMethod.toUpperCase()}</strong></p>
                        <p>Total: <strong style={{ color: 'plum' }}>Rs.{order.total.toFixed(2)}</strong></p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── CANCEL ORDER MODAL ──────────────────────────────────────────────── */}
      {cancellingOrderId && (
        <div className="order-modal-backdrop" onClick={() => !cancelling && setCancellingOrderId(null)}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <h3>Cancel Order #{cancellingOrderId.slice(-6).toUpperCase()}</h3>
              <button
                className="order-modal-close"
                onClick={() => setCancellingOrderId(null)}
                disabled={cancelling}
              >
                ✕
              </button>
            </div>
            <p className="order-modal-sub">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <form onSubmit={handleCancelOrderSubmit}>
              <div className="order-modal-group">
                <label>Reason for cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="order-modal-select"
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered wrong item / size">Ordered wrong item / size</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Need to change delivery address">Need to change delivery address</option>
                  <option value="Shipping time too long">Shipping time too long</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              {cancelReason === 'Other' && (
                <div className="order-modal-group">
                  <label>Please specify reason</label>
                  <input
                    type="text"
                    placeholder="Enter your cancellation reason..."
                    value={cancelCustomReason}
                    onChange={(e) => setCancelCustomReason(e.target.value)}
                    required
                    className="order-modal-input"
                  />
                </div>
              )}

              <div className="order-modal-actions">
                <button
                  type="button"
                  className="order-modal-btn-secondary"
                  onClick={() => setCancellingOrderId(null)}
                  disabled={cancelling}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  className="order-modal-btn-danger"
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RETURN ORDER MODAL ──────────────────────────────────────────────── */}
      {returningOrderId && (
        <div className="order-modal-backdrop" onClick={() => !submittingReturn && setReturningOrderId(null)}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <h3>Request Return for #{returningOrderId.slice(-6).toUpperCase()}</h3>
              <button
                className="order-modal-close"
                onClick={() => setReturningOrderId(null)}
                disabled={submittingReturn}
              >
                ✕
              </button>
            </div>
            <p className="order-modal-sub">
              Our policy allows returns within 7 days of delivery. Once submitted, our team will review your request and arrange a courier rider for pickup.
            </p>
            <form onSubmit={handleReturnSubmit}>
              <div className="order-modal-group">
                <label>Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="order-modal-select"
                >
                  <option value="Defective / Damaged product">Defective / Damaged product</option>
                  <option value="Received wrong item">Received wrong item</option>
                  <option value="Item does not match website description">Item does not match website description</option>
                  <option value="Quality not as expected">Quality not as expected</option>
                  <option value="Size or fit issue">Size or fit issue</option>
                  <option value="Changed mind / No longer needed">Changed mind / No longer needed</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="order-modal-group">
                <label>Additional Details / Explanation</label>
                <textarea
                  placeholder="Please describe what was wrong with the item or any details to help us process the pickup quickly..."
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  rows={3}
                  className="order-modal-textarea"
                />
              </div>

              <div className="order-modal-actions">
                <button
                  type="button"
                  className="order-modal-btn-secondary"
                  onClick={() => setReturningOrderId(null)}
                  disabled={submittingReturn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="order-modal-btn-primary"
                  disabled={submittingReturn}
                >
                  {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
