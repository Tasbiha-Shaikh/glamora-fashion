import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/admin.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('glamoraAdminToken');
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    const token = localStorage.getItem('glamoraAdminToken');
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error) {
      alert('Error deleting user.');
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="admin-logo">Glamora<span>Admin</span></h2>
        <ul className="admin-menu">
          <li><Link to="/admin">📊 Dashboard</Link></li>
          <li><Link to="/admin/products">📦 Products</Link></li>
          <li><Link to="/admin/orders">🧾 Orders</Link></li>
          <li className="active"><Link to="/admin/users">👥 Users</Link></li>
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
          <h1>Users</h1>
          <p>{users.length} registered users</p>
        </div>

        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="admin-avatar">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="status-badge" style={{ background: user.role === 'admin' ? 'plum' : '#999' }}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="delete-btn" onClick={() => deleteUser(user._id)}>
                      🗑️ Delete
                    </button>
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

export default AdminUsers;