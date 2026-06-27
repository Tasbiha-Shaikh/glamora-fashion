import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/adminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If admin already logged in → skip login page, go straight to dashboard
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('glamoraAdminUser'));
    const token = localStorage.getItem('glamoraAdminToken');
    if (user && token && user.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', form);
      const { token, ...user } = res.data.data;

      // Only allow admin role
      if (user.role !== 'admin') {
        setError('Access denied. You are not an admin.');
        setLoading(false);
        return;
      }

      // Save separately from regular user session
      localStorage.setItem('glamoraAdminToken', token);
      localStorage.setItem('glamoraAdminUser', JSON.stringify(user));

      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">

        <div className="admin-login-header">
          <h1>Glamora</h1>
          <span>Admin Panel</span>
        </div>

        <h2>Sign In</h2>
        <p className="admin-login-sub">Enter your admin credentials to continue</p>

        {error && <p className="admin-login-error">{error}</p>}

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="admin@gmail.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="admin-login-back">
          <a href="/">← Back to Store</a>
        </p>

      </div>
    </div>
  );
};

export default AdminLogin;