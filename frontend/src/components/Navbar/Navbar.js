import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/navbar.css';
import { useWishlist } from '../../context/WishlistContext';

const Navbar = () => {
  const { wishlistCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileUserOpen, setMobileUserOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const [darkMode] = useState(() => {
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

  const handleMenuClose = () => {
    setMenuOpen(false);
    setMobileProductsOpen(false);
    setMobileUserOpen(false);
  };

  return (
    <div className="header">
      <div className="navbar-container">

        {/* LOGO */}
        <div className="logo">
          <Link to="/" onClick={handleMenuClose}>
            <img src="/img/logo.png" alt="Glamora" width="150px" />
          </Link>
        </div>

        {/* DESKTOP NAV */}
        <nav className="nav">
          <ul>
            <li><Link to="/">Home</Link></li>

            <li className="nav-dropdown-item">
              <Link to="/products" className="nav-dropdown-trigger">
                Products <span className="dropdown-arrow">▾</span>
              </Link>
              <ul className="dropdown-menu">
                <li>
                  <Link to="/products" className="dropdown-link all-products-link">
                    All Products
                  </Link>
                </li>
                <li className="dropdown-divider"></li>
                <li><Link to="/products?category=watches" className="dropdown-link">Watches</Link></li>
                <li><Link to="/products?category=rings" className="dropdown-link">Rings</Link></li>
                <li><Link to="/products?category=glasses" className="dropdown-link">Glasses</Link></li>
                <li><Link to="/products?category=bracelets" className="dropdown-link">Bracelets</Link></li>
                <li><Link to="/products?category=earrings" className="dropdown-link">Earrings</Link></li>
                <li><Link to="/products?category=necklaces" className="dropdown-link">Necklaces</Link></li>
              </ul>
            </li>

            <li><Link to="/about">About Us</Link></li>

            {user ? (
              <li className="nav-dropdown-item">
                <span className="nav-dropdown-trigger user-label">
                  👤 {user.name} <span className="dropdown-arrow">▾</span>
                </span>
                <ul className="dropdown-menu user-dropdown">
                  <li><Link to="/profile" className="dropdown-link">My Profile</Link></li>
                  <li><Link to="/wishlist" className="dropdown-link">My Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}</Link></li>
                  <li className="dropdown-divider"></li>
                  <li>
                    <span onClick={handleLogout} className="dropdown-link logout-link">Logout</span>
                  </li>
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

          {/* WISHLIST */}
          <Link to="/wishlist" title="My Wishlist" className="nav-wishlist-link">
            <div id="wishlist-icon-wrapper">
              <span className="nav-wishlist-icon">♡</span>
              {wishlistCount > 0 && <span className="nav-wishlist-badge">{wishlistCount}</span>}
            </div>
          </Link>

          {/* CART */}
          <Link to="/cart">
            <div id="cart-icon-wrapper">
              <img id="cart-icon" src="/img/cart.jpg" alt="cart" />
              {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
            </div>
          </Link>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            className="menu-icon"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>

        </div>

      </div>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? 'show' : ''}`}>
        <div className="mobile-menu-inner">
          <div className="mobile-search-wrapper">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search products..."
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
          </div>

          <ul className="mobile-nav-list">
            <li>
              <Link to="/" onClick={handleMenuClose} className="mobile-nav-link">
                Home
              </Link>
            </li>

            {/* PRODUCTS ACCORDION */}
            <li className={`mobile-nav-item mobile-accordion ${mobileProductsOpen ? 'expanded' : ''}`}>
              <div
                className="mobile-accordion-header"
                onClick={() => setMobileProductsOpen((prev) => !prev)}
              >
                <span className="mobile-accordion-title">Products</span>
                <span className={`accordion-chevron ${mobileProductsOpen ? 'rotate' : ''}`}>▾</span>
              </div>

              <div className={`mobile-accordion-body ${mobileProductsOpen ? 'open' : ''}`}>
                <Link
                  to="/products"
                  onClick={handleMenuClose}
                  className="mobile-sublink all-products"
                >
                  All Products <span>➔</span>
                </Link>

                <div className="mobile-subgrid">
                  <Link to="/products?category=watches" onClick={handleMenuClose} className="mobile-category-chip">
                    Watches
                  </Link>
                  <Link to="/products?category=rings" onClick={handleMenuClose} className="mobile-category-chip">
                    Rings
                  </Link>
                  <Link to="/products?category=glasses" onClick={handleMenuClose} className="mobile-category-chip">
                    Glasses
                  </Link>
                  <Link to="/products?category=bracelets" onClick={handleMenuClose} className="mobile-category-chip">
                    Bracelets
                  </Link>
                  <Link to="/products?category=earrings" onClick={handleMenuClose} className="mobile-category-chip">
                    Earrings
                  </Link>
                  <Link to="/products?category=necklaces" onClick={handleMenuClose} className="mobile-category-chip">
                    Necklaces
                  </Link>
                </div>
              </div>
            </li>

            <li>
              <Link to="/about" onClick={handleMenuClose} className="mobile-nav-link">
                About Us
              </Link>
            </li>

            <li>
              <Link to="/wishlist" onClick={handleMenuClose} className="mobile-nav-link">
                ♡ Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
              </Link>
            </li>

            {user ? (
              <li className={`mobile-nav-item mobile-accordion ${mobileUserOpen ? 'expanded' : ''}`}>
                <div
                  className="mobile-accordion-header"
                  onClick={() => setMobileUserOpen((prev) => !prev)}
                >
                  <span className="mobile-accordion-title">👤 {user.name}</span>
                  <span className={`accordion-chevron ${mobileUserOpen ? 'rotate' : ''}`}>▾</span>
                </div>
                <div className={`mobile-accordion-body ${mobileUserOpen ? 'open' : ''}`}>
                  <div className="mobile-user-links">
                    <Link to="/profile" onClick={handleMenuClose} className="mobile-sublink">
                      My Profile
                    </Link>
                    <Link to="/wishlist" onClick={handleMenuClose} className="mobile-sublink">
                      My Wishlist
                    </Link>
                    <span
                      onClick={() => {
                        handleLogout();
                        handleMenuClose();
                      }}
                      className="mobile-sublink logout"
                    >
                      Logout
                    </span>
                  </div>
                </div>
              </li>
            ) : (
              <li>
                <Link to="/login" onClick={handleMenuClose} className="mobile-nav-link">
                  Account
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

    </div>
  );
};

export default Navbar;