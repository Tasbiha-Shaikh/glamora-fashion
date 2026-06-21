import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchTab = (tab) => {
    setError('');
    setActiveTab(tab);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', loginData);
      const { token, ...user } = res.data.data;
      localStorage.setItem('glamoraToken', token);
      localStorage.setItem('glamoraUser', JSON.stringify(user));
      window.dispatchEvent(new Event('userUpdated'));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register', regData);
      // ── OTP HOOK POINT: replace below with sendOtp(regData.email) later ──
      alert('Registration successful! Please login.');
      switchTab('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Exact same logic as original JS:
  // login()  → both forms translateX(300px), indicator translateX(0px)
  // register() → both forms translateX(0px), indicator translateX(100px)
  const formTransform = activeTab === 'login' ? 'translateX(300px)' : 'translateX(0px)';
  const indicatorTransform = activeTab === 'login' ? 'translateX(0px)' : 'translateX(100px)';

  return (
    <div className="account-page">
      <div className="container">
        <div className="auth-row">

          {/* LEFT IMAGE */}
          <div className="col-2-auth">
            <img src="/img/A1.png" alt="Glamora" />
          </div>

          {/* FORM */}
          <div className="col-2-auth">
            <div className="form-container">

              <div className="form-btn">
                <span
                  onClick={() => switchTab('login')}
                  className={activeTab === 'login' ? 'active-tab' : ''}
                >Login</span>
                <span
                  onClick={() => switchTab('register')}
                  className={activeTab === 'register' ? 'active-tab' : ''}
                >Register</span>
                <hr id="indicator" style={{ transform: indicatorTransform }} />
              </div>

              {error && <p className="auth-error">{error}</p>}

              {/* LOGIN FORM */}
              <form id="loginform" onSubmit={handleLogin} style={{ transform: formTransform }}>
                <input type="email" placeholder="Enter email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required />
                <input type="password" placeholder="Enter password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required />
                <a href="#">Forgot Password?</a>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* REGISTER FORM */}
              <form id="regform" onSubmit={handleRegister} style={{ transform: formTransform }}>
                <input type="text" placeholder="Full Name"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  required />
                <input type="email" placeholder="Email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  required />
                <input type="password" placeholder="Password"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  required />
                {/* OTP HOOK: replace button with OTP step component here later */}
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;