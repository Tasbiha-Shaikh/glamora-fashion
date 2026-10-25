import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/checkout.css';
import { useToast } from '../../components/Toast/ToastContext';
import { API_URL } from '../../config/api';

const Checkout = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [cart, setCart] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', address: '',
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('glamoraCart')) || [];
    setCart(savedCart);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save order to MongoDB — server works out prices and total from the database
      const token = localStorage.getItem('glamoraToken');
      await axios.post(
        `${API_URL}/api/orders`,
        {
          customerName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      setModalContent({
        title: 'Your Order Has Been Placed!',
        message: 'Your order has been confirmed on Cash On Delivery (COD). You will receive it within 3 days.',
      });

      // Clear cart
      localStorage.removeItem('glamoraCart');
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Your order was placed successfully!', 'Order Confirmed');
      setShowModal(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    navigate('/');
  };

  return (
    <>
      <div className="payment-wrapper">
        <div className="payment-title">
          <h2>Complete Your Order</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SHIPPING DETAILS */}
          <h3>Shipping Details</h3>
          <hr className="section-divider" />

          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="fullName" placeholder="Enter your full name"
              value={form.fullName} onChange={handleFormChange} required />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" placeholder="Enter your email address"
              value={form.email} onChange={handleFormChange} required />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" placeholder="Enter your phone number"
              value={form.phone} onChange={handleFormChange} required />
          </div>

          <div className="form-group">
            <label>Delivery Address</label>
            <input type="text" name="address" placeholder="Enter full delivery address"
              value={form.address} onChange={handleFormChange} required />
          </div>

          {/* ORDER SUMMARY */}
          <h3 style={{ marginTop: '30px' }}>Order Summary</h3>
          <hr className="section-divider" />
          <div className="order-summary-box">
            {cart.map((item, i) => (
              <div key={i} className="summary-item">
                <span>{item.name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="summary-item total-row">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <h3 style={{ marginTop: '30px' }}>Payment Method</h3>
          <hr className="section-divider" />

          <div className="payment-methods">
            <div className="method-card active">
              <h4>Cash On Delivery (COD)</h4>
              <p>Pay upon delivery</p>
            </div>
          </div>

          <div className="checkbox-group">
            <input type="checkbox" required /> Your details will be kept completely private (Secure & Encrypted).
          </div>

          <button type="submit" className="pay-btn" disabled={loading || cart.length === 0}>
            {loading ? 'Placing Order...' : 'Submit Order'}
          </button>

          {cart.length === 0 && (
            <p style={{ textAlign: 'center', marginTop: '15px', color: '#999' }}>
              Your cart is empty.
            </p>
          )}
        </form>
      </div>

      {/* SUCCESS MODAL — exact match to original */}
      {showModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <h3>{modalContent.title}</h3>
            <p>{modalContent.message}</p>
            <button onClick={closeModal}>OK</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;