import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/cart.css';
import { useToast } from '../../components/Toast/ToastContext';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  // Load cart from localStorage when page opens
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('glamoraCart')) || [];
    setCart(savedCart);
  };

  // Increase / decrease quantity, remove if it hits 0
  const changeQuantity = (index, change) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity += change;

    if (updatedCart[index].quantity <= 0) {
      updatedCart.splice(index, 1); // remove item completely
    }

    localStorage.setItem('glamoraCart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    setCart(updatedCart);
  };

  const removeItem = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    localStorage.setItem('glamoraCart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    setCart(updatedCart);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal; // free delivery, same as original

  const handleProceedToCheckout = () => {
    const token = localStorage.getItem('glamoraToken');
    if (!token) {
      toast.warning('Please log in to your account to complete your order.', 'Login Required');
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <main className="cart-container">
      <h2>Your Shopping Cart</h2>

      <div className="cart-items">
        {cart.length === 0 ? (
          <p>No products in the cart yet.</p>
        ) : (
          cart.map((product, index) => (
            <div className="cart-item" key={product.id || index}>
              <div className="cart-item-info">
                <img
                  src={product.img || '/img/logo.png'}
                  alt={product.name}
                  className="cart-item-img"
                  onError={(e) => { e.target.src = '/img/logo.png'; }}
                />
                <div>
                  <p><strong>{product.name}</strong></p>
                  <p>
                    Price: Rs.{product.price.toFixed(2)} | Subtotal: Rs.{(product.price * product.quantity).toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button className="qt-btn" onClick={() => changeQuantity(index, -1)}>-</button>
                <span>Qty: {product.quantity}</span>
                <button className="qt-btn" onClick={() => changeQuantity(index, 1)}>+</button>
                <button className="remove-btn" onClick={() => removeItem(index)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-summary">
        <h3>Cart Totals</h3>
        <div className="summary-details">
          <p>Subtotal: <span>Rs.{subtotal.toFixed(2)}</span></p>
          <p>Delivery: <span>Free</span></p>
          <hr />
          <p>Total: <span>Rs.{total.toFixed(2)}</span></p>
        </div>

        <button
          className="primary-btn"
          onClick={handleProceedToCheckout}
          disabled={cart.length === 0}
        >
          Complete Your Order
        </button>

        {cart.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: '15px' }}>
            <Link to="/products" style={{ color: 'plum' }}>← Continue Shopping</Link>
          </p>
        )}
      </div>
    </main>
  );
};

export default Cart;