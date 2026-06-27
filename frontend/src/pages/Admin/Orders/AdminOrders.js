import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/admin.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null); // which order is expanded

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('glamoraAdminToken');
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('glamoraAdminToken');
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (error) {
      alert('Error updating status.');
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const statusColor = (status) => {
    const colors = {
      pending: '#f39c12', processing: '#3498db',
      shipped: '#9b59b6', delivered: '#27ae60', cancelled: '#e74c3c',
    };
    return colors[status] || '#999';
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="admin-logo">Glamora<span>Admin</span></h2>
        <ul className="admin-menu">
          <li><Link to="/admin/dashboard">📊 Dashboard</Link></li>
          <li><Link to="/admin/products">📦 Products</Link></li>
          <li className="active"><Link to="/admin/orders">🧾 Orders</Link></li>
          <li><Link to="/admin/users">👥 Users</Link></li>
          <li><Link to="/">🏠 Back to Store</Link></li>
          <li onClick={() => {
            localStorage.removeItem('glamoraAdminToken');
            localStorage.removeItem('glamoraAdminUser');
            window.location.href = '/admin';
          }} style={{ cursor: 'pointer' }}>
            <a>🚪 Logout</a>
          </li>
        </ul>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1>Orders</h1>
          <p>{orders.length} total orders</p>
        </div>

        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Status</th>
                <th>Update</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : orders.map((order) => (
                <React.Fragment key={order._id}>

                  {/* MAIN ROW */}
                  <tr>
                    <td><strong>#{order._id.slice(-6).toUpperCase()}</strong></td>
                    <td>
                      <strong>{order.customerName}</strong>
                      <br />
                      <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{order.email}</span>
                    </td>
                    <td>{order.phone}</td>
                    <td><strong style={{ color: 'plum' }}>${order.total.toFixed(2)}</strong></td>
                    <td>
                      <span className="status-badge" style={{
                        background: order.paymentMethod === 'cod' ? '#f39c12' : '#27ae60'
                      }}>
                        {order.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-PK', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                      <br />
                      {new Date(order.createdAt).toLocaleTimeString('en-PK', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: statusColor(order.status) }}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="detail-toggle-btn"
                        onClick={() => toggleExpand(order._id)}
                      >
                        {expandedOrder === order._id ? '▲ Hide' : '▼ View'}
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDED DETAIL ROW */}
                  {expandedOrder === order._id && (
                    <tr className="order-detail-row">
                      <td colSpan="9">
                        <div className="order-detail-box">

                          {/* CUSTOMER INFO */}
                          <div className="order-detail-section">
                            <h4>👤 Customer Information</h4>
                            <div className="order-detail-grid">
                              <div>
                                <label>Full Name</label>
                                <p>{order.customerName}</p>
                              </div>
                              <div>
                                <label>Email</label>
                                <p>{order.email}</p>
                              </div>
                              <div>
                                <label>Phone</label>
                                <p>{order.phone}</p>
                              </div>
                              <div>
                                <label>Payment Method</label>
                                <p>{order.paymentMethod === 'cod' ? 'Cash On Delivery' : 'Online Payment'}</p>
                              </div>
                            </div>
                          </div>

                          {/* DELIVERY ADDRESS */}
                          <div className="order-detail-section">
                            <h4>📍 Delivery Address</h4>
                            <p className="address-text">{order.address}</p>
                          </div>

                          {/* ORDER ITEMS */}
                          <div className="order-detail-section">
                            <h4>🛍️ Order Items</h4>
                            <table className="order-items-table">
                              <thead>
                                <tr>
                                  <th>Image</th>
                                  <th>Product Name</th>
                                  <th>Unit Price</th>
                                  <th>Quantity</th>
                                  <th>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, i) => (
                                  <tr key={i}>
                                    <td>
                                      <img
                                        src={item.img || '/img/logo.png'}
                                        alt={item.name}
                                        className="order-detail-img"
                                        onError={(e) => { e.target.src = '/img/logo.png'; }}
                                      />
                                    </td>
                                    <td><strong>{item.name}</strong></td>
                                    <td>${item.price.toFixed(2)}</td>
                                    <td>{item.quantity}</td>
                                    <td><strong style={{ color: 'plum' }}>${(item.price * item.quantity).toFixed(2)}</strong></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* ORDER TOTALS */}
                          <div className="order-detail-section">
                            <h4>💰 Order Summary</h4>
                            <div className="order-totals">
                              <div className="total-row-detail">
                                <span>Subtotal</span>
                                <span>${order.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="total-row-detail">
                                <span>Delivery</span>
                                <span>Free</span>
                              </div>
                              <div className="total-row-detail total-final">
                                <span>Total</span>
                                <span>${order.total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* ORDER META */}
                          <div className="order-detail-section">
                            <h4>🕐 Order Timeline</h4>
                            <div className="order-detail-grid">
                              <div>
                                <label>Order Placed</label>
                                <p>{new Date(order.createdAt).toLocaleString()}</p>
                              </div>
                              <div>
                                <label>Last Updated</label>
                                <p>{new Date(order.updatedAt).toLocaleString()}</p>
                              </div>
                              <div>
                                <label>Order ID</label>
                                <p>#{order._id}</p>
                              </div>
                              <div>
                                <label>Current Status</label>
                                <p>
                                  <span className="status-badge" style={{ background: statusColor(order.status) }}>
                                    {order.status.toUpperCase()}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}

                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;