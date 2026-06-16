import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/footer.css';

const Footer = () => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;
    // TODO: connect to backend query API later
    alert('Query submitted! We will get back to you soon.');
    setMessage('');
  };

  return (
    <footer className="footer">
      <div className="container footer-grid">

        {/* QUICK LINKS */}
        <div className="footer-col">
          <h2>Quick Links</h2>
          <br />
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/login">Account</Link></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="footer-col">
          <h2>Contact Us</h2>
          <br />
          <ul className="footer-links">
            <li><strong>Email: </strong><a href="mailto:Glamora@gmail.com">Glamora@gmail.com</a></li>
            <li><strong>Phone: </strong><a href="tel:+92311475566">+92 311 475566</a></li>
            <li><strong>Location: </strong><a href="#">Lahore, Pakistan</a></li>
          </ul>
        </div>

        {/* SOCIAL */}
        <div className="footer-col">
          <h3>Follow Us</h3>
          <br />
          <div className="social-links">
            <a href="#" aria-label="Facebook"><img src="/img/facebook.png" alt="Facebook" width="30" /></a>
            <a href="#" aria-label="Instagram"><img src="/img/instagram.png" alt="Instagram" width="30" /></a>
            <a href="#" aria-label="Twitter"><img src="/img/twitter.png" alt="Twitter" width="30" /></a>
            <a href="#" aria-label="YouTube"><img src="/img/youtube.png" alt="YouTube" width="30" /></a>
          </div>
        </div>

        {/* QUERY FORM */}
        <div className="footer-col">
          <h2>Send a Query</h2>
          <br />
          <form className="query-form" onSubmit={handleSubmit}>
            <textarea
              id="q-msg"
              name="message"
              rows="3"
              placeholder="Your message"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <button type="submit" className="btn">Send</button>
          </form>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&#169; 2026 Glamora. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;