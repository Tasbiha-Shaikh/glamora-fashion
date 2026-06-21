import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [cardType, setCardType] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', address: '',
    cardName: '', cardNumber: '', cardCvv: '',
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('glamoraCart')) || [];
    setCart(savedCart);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // Detect card type as user types card number
    if (e.target.name === 'cardNumber') {
      if (e.target.value.startsWith('4')) setCardType('CARD TYPE: VISA');
      else if (e.target.value.startsWith('5')) setCardType('CARD TYPE: DEBIT / MASTERCARD');
      else setCardType('');
    }
  };

  const selectPaymentMethod = (method) => {
    setPaymentMethod(method);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save order to MongoDB
      await axios.post('http://localhost:5000/api/orders', {
        customerName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        paymentMethod,
        items: cart,
        subtotal,
        total: subtotal,
      });

      // Show success modal — same as original
      if (paymentMethod === 'cod') {
        setModalContent({
          title: 'Your Order Has Been Placed!',
          message: 'Your order has been confirmed on Cash On Delivery (COD). You will receive it within 3 days.',
        });
      } else {
        setModalContent({
          title: 'Payment Successful!',
          message: 'Your online payment was successful. Your order will be dispatched shortly.',
        });
      }

      // Clear cart
      localStorage.removeItem('glamoraCart');
      window.dispatchEvent(new Event('cartUpdated'));
      setShowModal(true);
    } catch (error) {
      alert('Something went wrong. Please try again.');
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
            <div
              className={`method-card ${paymentMethod === 'cod' ? 'active' : ''}`}
              onClick={() => selectPaymentMethod('cod')}
            >
              <h4>Cash On Delivery (COD)</h4>
              <p>Pay upon delivery</p>
            </div>
            <div
              className={`method-card ${paymentMethod === 'online' ? 'active' : ''}`}
              onClick={() => selectPaymentMethod('online')}
            >
              <h4>Pay Online</h4>
              <p>Visa / Debit Card</p>
            </div>
          </div>

          {/* ONLINE PAYMENT DETAILS */}
          {paymentMethod === 'online' && (
            <div className="payment-details">
              <div className="card-icon-container">
                <span className="card-type-label">{cardType}</span>
              </div>

              <div className="form-group">
                <label>Cardholder Name</label>
                <input type="text" name="cardName" placeholder="Name on card"
                  value={form.cardName} onChange={handleFormChange} />
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input type="text" name="cardNumber" placeholder="xxxx xxxx xxxx xxxx"
                  maxLength="16" value={form.cardNumber} onChange={handleFormChange} />
              </div>

              <div className="form-group">
                <label>CVV</label>
                <input type="password" name="cardCvv" placeholder="***"
                  maxLength="3" value={form.cardCvv} onChange={handleFormChange} />
              </div>
            </div>
          )}

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