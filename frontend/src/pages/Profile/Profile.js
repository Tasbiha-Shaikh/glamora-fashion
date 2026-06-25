import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [updateForm, setUpdateForm] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('glamoraUser'));
    const token = localStorage.getItem('glamoraToken');

    // If not logged in redirect to login
    if (!savedUser || !token) {
      navigate('/login');
      return;
    }

    setUser(savedUser);
    setUpdateForm({ name: savedUser.name, email: savedUser.email });
    fetchOrders(savedUser.email);
  }, []);

  const fetchOrders = async (email) => {
    try {
      // Fetch all orders and filter by email on frontend for now
      // Later: add GET /api/orders/myorders protected route
      const res = await axios.get('http://localhost:5000/api/orders');
      const myOrders = res.data.data.filter((o) => o.email === email);
      setOrders(myOrders);
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
        `http://localhost:5000/api/auth/profile`,
        updateForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update localStorage with new info
      const updatedUser = { ...user, ...res.data.data };
      localStorage.setItem('glamoraUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('userUpdated'));
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile.');
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
                orders.map((order) => (
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
                      <span
                        className="order-status"
                        style={{ background: statusColor(order.status) }}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="order-items-list">
                      {order.items.map((item, i) => (
                        <div className="order-item-row" key={i}>
                          <img
                            src={item.img || '/img/logo.png'}
                            alt={item.name}
                            onError={(e) => { e.target.src = '/img/logo.png'; }}
                          />
                          <div>
                            <p>{item.name}</p>
                            <p>Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                          </div>
                          <p className="item-subtotal">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <p>Payment: <strong>{order.paymentMethod.toUpperCase()}</strong></p>
                      <p>Total: <strong style={{ color: 'plum' }}>${order.total.toFixed(2)}</strong></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;