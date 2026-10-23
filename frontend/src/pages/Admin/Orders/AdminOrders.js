import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/admin.css';
import { useToast } from '../../../components/Toast/ToastContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminOrders = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null); // which order is expanded

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('glamoraAdminToken');
      const res = await axios.get(`${API_URL}/api/orders`, {
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
      await axios.put(`${API_URL}/api/orders/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order status updated to ${status.toUpperCase()}`, 'Status Updated');
      fetchOrders();
    } catch (error) {
      toast.error('Error updating status.');
    }
  };

  const handleReturnAction = async (orderId, action, adminResponse, pickupStatus) => {
    const token = localStorage.getItem('glamoraAdminToken');
    try {
      await axios.put(
        `${API_URL}/api/orders/${orderId}/return-action`,
        { action, adminResponse, pickupStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
      toast.success(`Return request has been ${action}!`, 'Return Updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating return request');
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
              ) : orders.map((order) => {
                const returnReq = order.returnRequest;
                const hasReturn = returnReq && returnReq.status && returnReq.status !== 'none';

                return (
                  <React.Fragment key={order._id}>

                    {/* MAIN ROW */}
                    <tr>
                      <td>
                        <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                        {hasReturn && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              background: returnReq.status === 'requested' ? '#f39c12' :
                                          returnReq.status === 'approved' ? '#27ae60' :
                                          returnReq.status === 'completed' ? '#2980b9' : '#e74c3c',
                              color: '#fff',
                            }}>
                              Return: {returnReq.status.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{order.customerName}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{order.email}</span>
                      </td>
                      <td>{order.phone}</td>
                      <td><strong style={{ color: 'plum' }}>Rs.{order.total.toFixed(2)}</strong></td>
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

                            {/* CANCELLATION NOTICE */}
                            {order.status === 'cancelled' && (
                              <div className="order-detail-section" style={{
                                borderLeft: '4px solid #e74c3c',
                                background: 'rgba(231,76,60,0.06)',
                                borderRadius: '6px',
                                marginBottom: '16px',
                              }}>
                                <h4 style={{ color: '#c0392b', margin: '0 0 6px 0' }}>🚫 Cancellation Information</h4>
                                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                                  <strong>Cancelled by:</strong> {order.cancelledBy ? order.cancelledBy.toUpperCase() : 'N/A'}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: '13px' }}>
                                  <strong>Reason:</strong> {order.cancelReason || 'No reason specified'}
                                </p>
                                {order.cancelledAt && (
                                  <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
                                    <strong>Date:</strong> {new Date(order.cancelledAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* RETURN REQUEST MANAGEMENT */}
                            {hasReturn && (
                              <div className="order-detail-section" style={{
                                borderLeft: '4px solid #2980b9',
                                background: 'rgba(52,152,219,0.06)',
                                borderRadius: '6px',
                                marginBottom: '16px',
                              }}>
                                <h4 style={{ color: '#2980b9', margin: '0 0 10px 0' }}>🔄 Return Request Management</h4>
                                <div className="order-detail-grid">
                                  <div>
                                    <label>Return Status</label>
                                    <p><strong style={{ color: '#2980b9' }}>{returnReq.status.toUpperCase()}</strong></p>
                                  </div>
                                  <div>
                                    <label>Customer Reason</label>
                                    <p>{returnReq.reason}</p>
                                  </div>
                                  {returnReq.details && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                      <label>Customer Explanation</label>
                                      <p style={{ fontStyle: 'italic' }}>"{returnReq.details}"</p>
                                    </div>
                                  )}
                                  <div>
                                    <label>Requested Date</label>
                                    <p>{returnReq.requestedAt ? new Date(returnReq.requestedAt).toLocaleString() : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label>Pickup Status</label>
                                    <p><strong>{returnReq.pickupStatus || 'None'}</strong></p>
                                  </div>
                                  {returnReq.adminResponse && (
                                    <div style={{ gridColumn: 'span 2' }}>
                                      <label>Admin Note to Customer</label>
                                      <p style={{
                                        background: '#fff',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                        marginTop: '4px',
                                      }}>
                                        {returnReq.adminResponse}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* ACTION BUTTONS FOR RETURN */}
                                {returnReq.status === 'requested' && (
                                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                      className="btn"
                                      style={{ background: '#27ae60', color: '#fff', fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
                                      onClick={() => {
                                        const note = window.prompt(
                                          'Enter pickup instructions or courier details for customer:',
                                          'Return approved. Our courier rider will pick up the package from your address within 24-48 hours. Please have the item in original packaging.'
                                        );
                                        if (note !== null) {
                                          handleReturnAction(order._id, 'approved', note, 'Rider Pickup Assigned');
                                        }
                                      }}
                                    >
                                      ✓ Approve Return & Schedule Pickup
                                    </button>
                                    <button
                                      className="btn"
                                      style={{ background: '#e74c3c', color: '#fff', fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
                                      onClick={() => {
                                        const note = window.prompt('Enter rejection reason for customer:', 'Return request cannot be accepted according to store policy.');
                                        if (note !== null) {
                                          handleReturnAction(order._id, 'rejected', note, 'Rejected');
                                        }
                                      }}
                                    >
                                      ✕ Reject Return
                                    </button>
                                  </div>
                                )}

                                {returnReq.status === 'approved' && (
                                  <div style={{ marginTop: '16px' }}>
                                    <button
                                      className="btn"
                                      style={{ background: '#2980b9', color: '#fff', fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
                                      onClick={() => {
                                        if (window.confirm('Mark this return as completed? Returned items will be added back into stock.')) {
                                          handleReturnAction(order._id, 'completed', 'Package received and inspected. Return completed successfully.', 'Picked up & completed');
                                        }
                                      }}
                                    >
                                      📦 Mark Return Received & Completed (Restocks items)
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

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
                                      <td>Rs.{item.price.toFixed(2)}</td>
                                      <td>{item.quantity}</td>
                                      <td><strong style={{ color: 'plum' }}>Rs.{(item.price * item.quantity).toFixed(2)}</strong></td>
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
                                  <span>Rs.{order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="total-row-detail">
                                  <span>Delivery</span>
                                  <span>Free</span>
                                </div>
                                <div className="total-row-detail total-final">
                                  <span>Total</span>
                                  <span>Rs.{order.total.toFixed(2)}</span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;
