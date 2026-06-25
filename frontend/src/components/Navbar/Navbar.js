import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('glamora-theme') === 'dark';
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('glamora-theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('glamora-theme', 'light');
    }
  }, [darkMode]);
  
// cart count   
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('glamoraCart')) || [];
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    updateCount(); // run once on load

    window.addEventListener('cartUpdated', updateCount);
    window.addEventListener('storage', updateCount); // cross-tab support

    return () => {
      window.removeEventListener('cartUpdated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  const handleSearch = () => {
    if (searchValue.trim() !== '') {
      navigate(`/products?search=${encodeURIComponent(searchValue)}`);
      setSearchValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

// name of login user
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('glamoraUser')) || null;
  });

  useEffect(() => {
    const updateUser = () => {
      setUser(JSON.parse(localStorage.getItem('glamoraUser')) || null);
    };
    window.addEventListener('userUpdated', updateUser);
    return () => window.removeEventListener('userUpdated', updateUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('glamoraToken');
    localStorage.removeItem('glamoraUser');
    setUser(null);
    window.dispatchEvent(new Event('userUpdated'));
    navigate('/');
  };



  return (
    <div className="header">
      <div className="navbar-container">

        {/* LOGO */}
        <div className="logo">
          <Link to="/">
            <img src="/img/logo.png" alt="Glamora" width="150px" />
          </Link>
        </div>

        {/* DESKTOP NAV */}
        <nav className="nav">
          <ul>
            <li><Link to="/">Home</Link></li>

            <li>
              <Link to="/products">Products</Link>
              <ul className="dropdown">
                <li><Link to="/products?category=watches">Watches</Link></li>
                <li><Link to="/products?category=rings">Rings</Link></li>
                <li><Link to="/products?category=glasses">Glasses</Link></li>
                <li><Link to="/products?category=bracelets">Bracelets</Link></li>
                <li><Link to="/products?category=earrings">Earrings</Link></li>
                <li><Link to="/products?category=necklaces">Necklaces</Link></li>
              </ul>
            </li>

            <li><Link to="/about">About Us</Link></li>
            {user ? (
              <li className="dropdown-parent">
                <span style={{ cursor: 'pointer', color: 'dimgrey' }}>👤 {user.name}</span>
                <ul className="dropdown">
                  <li><Link to="/profile">My Profile</Link></li>
                  <li><span onClick={handleLogout} style={{ cursor: 'pointer', padding: '8px 20px', display: 'block', color: 'dimgrey' }}>Logout</span></li>
                </ul>
              </li>
            ) : (
              <li><Link to="/login">Account</Link></li>
            )}
            {/* SEARCH */}
            <li className="search-box">
              <div className="search-container">
                <input
                  id="search-bar"
                  type="text"
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <img
                  id="search-icon"
                  src="/img/search-icon.png"
                  alt="search"
                  onClick={handleSearch}
                />
              </div>
            </li>

          </ul>
        </nav>

        {/* CART + DARK MODE + MOBILE TOGGLE */}
        <div className="nav-right">

          {/* DARK MODE TOGGLE */}
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* CART */}
          <Link to="/cart">
            <div id="cart-icon-wrapper">
              <img id="cart-icon" src="/img/cart.jpg" alt="cart" />
              {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
            </div>
          </Link>

          {/* MOBILE MENU BUTTON */}
          <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </div>

        </div>

      </div>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? 'show' : ''}`}>
        <ul>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <img
              src="/img/search-icon.png"
              alt="search"
              id="search-icon"
              onClick={handleSearch}
            />
          </div>
          <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li>
            <ul className="dropdown">
              <Link to="/products" onClick={() => setMenuOpen(false)}>Products</Link>
              <li><Link to="/products?category=watches" onClick={() => setMenuOpen(false)}>Watches</Link></li>
              <li><Link to="/products?category=rings" onClick={() => setMenuOpen(false)}>Rings</Link></li>
              <li><Link to="/products?category=glasses" onClick={() => setMenuOpen(false)}>Glasses</Link></li>
              <li><Link to="/products?category=bracelets" onClick={() => setMenuOpen(false)}>Bracelets</Link></li>
              <li><Link to="/products?category=earrings" onClick={() => setMenuOpen(false)}>Earrings</Link></li>
              <li><Link to="/products?category=necklaces" onClick={() => setMenuOpen(false)}>Necklaces</Link></li>
            </ul>
          </li>
          <li><Link to="/about" onClick={() => setMenuOpen(false)}>About us</Link></li>
          {user ? (
            <li className="dropdown-parent">
              <span style={{ cursor: 'pointer', color: 'dimgrey' }}>👤 {user.name}</span>
              <ul className="dropdown">
                <li><Link to="/profile">My Profile</Link></li>
                <li><span onClick={handleLogout} style={{ cursor: 'pointer', padding: '8px 20px', display: 'block', color: 'dimgrey' }}>Logout</span></li>
              </ul>
            </li>
          ) : (
            <li><Link to="/login">Account</Link></li>
          )}     
           </ul>
      </div>

    </div>
  );
};

export default Navbar;