import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/auth.css';

// ─── OTP HOOK (placeholder — plug in your OTP logic here later) ───────────────
// When you're ready to add OTP:
// 1. After register success, call sendOtp(email) instead of navigating directly
// 2. Show <OtpStep /> component asking user to enter OTP
// 3. Call verifyOtp(email, otp) → if success, navigate to login
// 4. Backend: add POST /api/auth/send-otp and POST /api/auth/verify-otp routes
// ─────────────────────────────────────────────────────────────────────────────

const Login = () => {
  const navigate = useNavigate();

  // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('register');

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register form state
  const [regData, setRegData] = useState({ name: '', email: '', password: '' });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── TAB SWITCH ──────────────────────────────────────────────────────────────
  const switchTab = (tab) => {
    setError('');
    setActiveTab(tab);
  };

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', loginData);
      const { token, ...user } = res.data.data;

      // Save token + user info to localStorage
      // Later when we add OTP: move this inside verifyOtp() success callback
      localStorage.setItem('glamoraToken', token);
      localStorage.setItem('glamoraUser', JSON.stringify(user));

      // Notify Navbar to update Account link
      window.dispatchEvent(new Event('userUpdated'));

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER ────────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/register', regData);

      // ── OTP HOOK POINT ──
      // Replace the two lines below with:
      // await sendOtp(regData.email);
      // setStep('otp');   ← show OTP input step
      // ───────────────────

      alert('Registration successful! Please login.');
      switchTab('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <div className="container">
        <div className="row auth-row">

          {/* LEFT SIDE IMAGE */}
          <div className="col-2 auth-img-col">
            <img src="/img/A1.png" alt="Glamora" width="100%" />
          </div>

          {/* RIGHT SIDE FORM */}
          <div className="col-2">
            <div className="form-container">

              {/* TAB BUTTONS */}
              <div className="form-btn">
                <span
                  onClick={() => switchTab('login')}
                  className={activeTab === 'login' ? 'active-tab' : ''}
                >
                  Login
                </span>
                <span
                  onClick={() => switchTab('register')}
                  className={activeTab === 'register' ? 'active-tab' : ''}
                >
                  Register
                </span>
                {/* SLIDING INDICATOR — exact match to original */}
                <hr
                  id="indicator"
                  style={{
                    transform: activeTab === 'login'
                      ? 'translateX(0px)'
                      : 'translateX(100px)',
                  }}
                />
              </div>

              {/* ERROR MESSAGE */}
              {error && <p className="auth-error">{error}</p>}

              {/* LOGIN FORM */}
              <form
                id="loginform"
                onSubmit={handleLogin}
                style={{
                  transform: activeTab === 'login'
                    ? 'translateX(300px)'
                    : 'translateX(0px)',
                }}
              >
                <input
                  type="email"
                  placeholder="Enter email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
                <a href="#">Forgot Password?</a>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* REGISTER FORM */}
              <form
                id="regform"
                onSubmit={handleRegister}
                style={{
                  transform: activeTab === 'login'
                    ? 'translateX(300px)'
                    : 'translateX(0px)',
                }}
              >
                <input
                  type="text"
                  placeholder="Full Name"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  required
                />

                {/* ── OTP STEP PLACEHOLDER ──────────────────────────────────
                  When you add OTP later, replace this button with:
                  {step === 'form' && <button>Send OTP</button>}
                  {step === 'otp' && <OtpStep email={regData.email} onVerified={...} />}
                ─────────────────────────────────────────────────────────── */}

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