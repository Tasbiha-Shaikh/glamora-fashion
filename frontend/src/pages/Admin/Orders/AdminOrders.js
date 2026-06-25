import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/admin.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('glamoraToken');
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
    const token = localStorage.getItem('glamoraToken');
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
          <li><Link to="/admin">📊 Dashboard</Link></li>
          <li><Link to="/admin/products">📦 Products</Link></li>
          <li className="active"><Link to="/admin/orders">🧾 Orders</Link></li>
          <li><Link to="/admin/users">👥 Users</Link></li>
          <li><Link to="/">🏠 Back to Store</Link></li>
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
                <th>Email</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-6).toUpperCase()}</td>
                  <td>{order.customerName}</td>
                  <td>{order.email}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>{order.paymentMethod.toUpperCase()}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;