import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/admin.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('glamoraAdminToken');
    fetchStats(token);
  }, []);

  const fetchStats = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/orders', { headers }),
        axios.get('http://localhost:5000/api/products'),
        axios.get('http://localhost:5000/api/users', { headers }),
      ]);

      const orders = ordersRes.data.data;
      const revenue = orders.reduce((sum, o) => sum + o.total, 0);
      const pending = orders.filter((o) => o.status === 'pending').length;

      setStats({
        totalOrders: orders.length,
        totalProducts: productsRes.data.data.length,
        totalUsers: usersRes.data.data.length,
        totalRevenue: revenue,
        pendingOrders: pending,
        recentOrders: orders.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    const colors = {
      pending: '#f39c12', processing: '#3498db',
      shipped: '#9b59b6', delivered: '#27ae60', cancelled: '#e74c3c',
    };
    return colors[status] || '#999';
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '100px' }}>Loading...</p>;

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">Glamora<span>Admin</span></h2>
        <ul className="admin-menu">
          <li className="active"><Link to="/admin">📊 Dashboard</Link></li>
          <li><Link to="/admin/products">📦 Products</Link></li>
          <li><Link to="/admin/orders">🧾 Orders</Link></li>
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

      {/* MAIN */}
      <main className="admin-main">
        <div className="admin-topbar">
          <h1>Dashboard</h1>
          <p>Welcome back, Admin 👋</p>
        </div>

        {/* STAT CARDS */}
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e8f4fd' }}>📦</div>
            <div>
              <p>Total Orders</p>
              <h3>{stats.totalOrders}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef9e7' }}>⏳</div>
            <div>
              <p>Pending Orders</p>
              <h3>{stats.pendingOrders}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eafaf1' }}>💰</div>
            <div>
              <p>Total Revenue</p>
              <h3>${stats.totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f5eef8' }}>🛍️</div>
            <div>
              <p>Total Products</p>
              <h3>{stats.totalProducts}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fdebd0' }}>👥</div>
            <div>
              <p>Total Users</p>
              <h3>{stats.totalUsers}</h3>
            </div>
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Orders</h3>
            <Link to="/admin/orders">View All →</Link>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-6).toUpperCase()}</td>
                  <td>{order.customerName}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>{order.paymentMethod.toUpperCase()}</td>
                  <td>
                    <span className="status-badge" style={{ background: statusColor(order.status) }}>
                      {order.status}
                    </span>
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

export default Dashboard;