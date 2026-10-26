import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/footer.css';
import { useToast } from '../Toast/ToastContext';

const Footer = () => {
  const toast = useToast();
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;
    toast.success('Query submitted! Our team will get back to you soon.', 'Message Sent');
    setMessage('');
  };

  return (
    <footer className="footer">
      <div className="container footer-grid">

        {/* BRAND & ABOUT */}
        <div className="footer-col brand-col">
          <div className="footer-logo">
            <Link to="/">
              <img src="/img/logo.png" alt="Glamora" width="130" />
            </Link>
          </div>
          <p className="footer-tagline">
            Elevate your everyday style with our handcrafted jewelry and timeless accessories.
          </p>
          <div className="social-links">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="social-icon-btn"
            >
              <img src="/img/facebook.png" alt="Facebook" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="social-icon-btn"
            >
              <img src="/img/instagram.png" alt="Instagram" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="social-icon-btn"
            >
              <img src="/img/twitter.png" alt="Twitter" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="social-icon-btn"
            >
              <img src="/img/youtube.png" alt="YouTube" />
            </a>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="footer-col links-col">
          <h3 className="footer-col-title">Quick Links</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/wishlist">My Wishlist</Link></li>
            <li><Link to="/login">My Account</Link></li>
          </ul>
        </div>

        {/* CONTACT US */}
        <div className="footer-col contact-col">
          <h3 className="footer-col-title">Contact Us</h3>
          <ul className="footer-contact-list">
            <li>
              <span className="contact-label">Email:</span>
              <a href="mailto:Glamora@gmail.com">Glamora@gmail.com</a>
            </li>
            <li>
              <span className="contact-label">Phone:</span>
              <a href="tel:+92311475566">+92 311 475566</a>
            </li>
            <li>
              <span className="contact-label">Location:</span>
              <span>Lahore, Pakistan</span>
            </li>
            <li>
              <span className="contact-label">Hours:</span>
              <span>Mon - Sat: 9am - 9pm</span>
            </li>
          </ul>
        </div>

        {/* QUERY FORM */}
        <div className="footer-col query-col">
          <h3 className="footer-col-title">Send a Query</h3>
          <p className="query-desc">Have a question or custom order? Reach out to us anytime.</p>
          <form className="query-form" onSubmit={handleSubmit}>
            <textarea
              id="q-msg"
              name="message"
              rows="3"
              placeholder="Write your message..."
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <button type="submit" className="footer-submit-btn">Send Message &#8594;</button>
          </form>
        </div>

      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>&#169; 2026 Glamora. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/about">Privacy</Link>
            <span className="divider">•</span>
            <Link to="/about">Terms</Link>
            <span className="divider">•</span>
            <Link to="/products">Shop</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;