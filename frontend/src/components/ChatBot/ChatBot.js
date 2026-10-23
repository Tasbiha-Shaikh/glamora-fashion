import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/chatbot.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── CALL STORE ASSISTANT ───────────────────────────────────────────────────────
const callChat = async (conversationHistory) => {
  try {
    const token = localStorage.getItem('glamoraToken');
    const res = await axios.post(
      `${API_URL}/api/chat`,
      {
        history: conversationHistory.map(({ role, text }) => ({
          role,
          text: text.slice(0, 1000),
        })),
      },
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    return res.data;
  } catch (err) {
    if (err.response?.status === 429) {
      return {
        success: false,
        reply: "I'm a bit overwhelmed right now 😅 Please wait a moment and try again!",
        products: [],
        category: null,
        filterParams: {},
      };
    }
    console.error('Chat error:', err.message);
    return {
      success: false,
      reply: 'Sorry, connection error. Please try again.',
      products: [],
      category: null,
      filterParams: {},
    };
  }
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
const ChatBot = () => {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Dragging
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef(null);

  // Conversation history for context memory
  const conversationHistory = useRef([]);

  // ── WELCOME MESSAGE ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let user = null;
      try {
        const stored = localStorage.getItem('glamoraUser');
        if (stored) user = JSON.parse(stored);
      } catch (e) {
        user = null;
      }

      const greeting = user?.name
        ? `Hi ${user.name}! 👋 How can I help you today?`
        : `Hi! 👋 How can I help you today?`;

      setMessages([{
        role: 'bot',
        text: greeting,
        products: [],
        quickReplies: [
          { label: '🎁 Find a Gift', value: 'I want to find a gift for someone' },
          { label: '📦 My Orders', value: 'Show me my orders' },
          { label: '⌚ Show Watches', value: 'Show me your watches' },
          { label: '💍 Show Rings', value: 'Show me your rings' },
          { label: '❓ Shipping Info', value: 'What is your shipping policy?' },
        ],
      }]);
    }
  }, [isOpen]);

  // ── AUTO SCROLL ──────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── DETECT PRODUCT INTENT (client fallback) ───────────────────────────────────
  const detectProductIntent = (text) => {
    const lower = text.toLowerCase();
    const categoryMap = {
      'watch': 'watches', 'watches': 'watches',
      'ring': 'rings', 'rings': 'rings',
      'glass': 'glasses', 'glasses': 'glasses', 'sunglass': 'glasses', 'sunglasses': 'glasses',
      'bracelet': 'bracelets', 'bracelets': 'bracelets',
      'earring': 'earrings', 'earrings': 'earrings',
      'necklace': 'necklaces', 'necklaces': 'necklaces',
    };

    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (lower.includes(keyword)) return category;
    }

    const budgetKeywords = ['under', 'budget', 'dollar', '$', 'rs', 'price', 'cheap', 'afford'];
    if (budgetKeywords.some(k => lower.includes(k))) return 'all';

    const showKeywords = ['show', 'find', 'browse', 'see', 'look', 'view', 'display', 'search'];
    if (showKeywords.some(k => lower.includes(k))) return 'all';

    return null;
  };

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    conversationHistory.current.push({ role: 'user', text });

    try {
      const detectedCategory = detectProductIntent(text);
      const resData = await callChat(conversationHistory.current);

      const cleanReply = resData.reply || 'Sorry, I could not process that.';
      const returnedProducts = Array.isArray(resData.products) ? resData.products : [];
      let activeCategory = resData.category || detectedCategory || null;
      let filterParams = resData.filterParams || {};

      if (activeCategory && !filterParams.category && activeCategory !== 'all') {
        filterParams.category = activeCategory;
      }

      // Add bot reply to conversation history
      conversationHistory.current.push({ role: 'bot', text: cleanReply });

      // Determine label for "View All" button with active filters
      let actionLabel = null;
      const catName = filterParams.category && filterParams.category !== 'all'
        ? filterParams.category.charAt(0).toUpperCase() + filterParams.category.slice(1)
        : 'Products';

      if (filterParams.maxPrice && filterParams.minPrice) {
        actionLabel = `🛍️ View ${catName} (Rs.${filterParams.minPrice} - Rs.${filterParams.maxPrice})`;
      } else if (filterParams.maxPrice) {
        actionLabel = `🛍️ View ${catName} (Under Rs.${filterParams.maxPrice})`;
      } else if (filterParams.minPrice) {
        actionLabel = `🛍️ View ${catName} (Over Rs.${filterParams.minPrice})`;
      } else if (filterParams.category && filterParams.category !== 'all') {
        actionLabel = `🛍️ View All ${catName}`;
      } else if (returnedProducts.length > 0 || activeCategory === 'all' || filterParams.search) {
        actionLabel = '🛍️ View All Products';
      }

      const botMsg = {
        role: 'bot',
        text: cleanReply,
        products: returnedProducts,
        actionButton: actionLabel ? {
          label: actionLabel,
          filterParams,
        } : null,
        quickReplies: getContextualReplies(text, cleanReply),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Something went wrong. Please try again.',
        products: [],
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── CONTEXTUAL QUICK REPLIES ──────────────────────────────────────────────────
  const getContextualReplies = (userText, botText) => {
    const lower = botText.toLowerCase();
    const userLower = userText.toLowerCase();

    if (lower.includes('budget') || lower.includes('price range')) {
      return [
        { label: 'Under Rs.20', value: 'My budget is under 20' },
        { label: 'Rs.20 - Rs.50', value: 'My budget is 20 to 50' },
        { label: 'Rs.50+', value: 'My budget is over 50' },
      ];
    }
    if (lower.includes('category') || lower.includes('type of')) {
      return [
        { label: '⌚ Watches', value: 'Show me watches' },
        { label: '💍 Rings', value: 'Show me rings' },
        { label: '👓 Glasses', value: 'Show me glasses' },
        { label: '📿 Necklaces', value: 'Show me necklaces' },
        { label: '💎 Bracelets', value: 'Show me bracelets' },
        { label: '✨ Earrings', value: 'Show me earrings' },
      ];
    }
    if (lower.includes('color')) {
      return [
        { label: '🥇 Gold', value: 'Gold color' },
        { label: '🥈 Silver', value: 'Silver color' },
        { label: '🖤 Black', value: 'Black color' },
        { label: '🌸 Rose Gold', value: 'Rose Gold color' },
        { label: 'Any color', value: 'Any color is fine' },
      ];
    }
    if (lower.includes('gift') || userLower.includes('gift')) {
      return [
        { label: '🎁 Find Gift', value: 'Help me find a gift' },
        { label: '⌚ Gift Watch', value: 'I want to gift a watch' },
        { label: '💍 Gift Ring', value: 'I want to gift a ring' },
      ];
    }

    return [
      { label: '🎁 Find a Gift', value: 'I want to find a gift' },
      { label: '📦 My Orders', value: 'Show me my orders' },
      { label: '🛍️ All Products', value: 'Show me all products' },
    ];
  };

  // ── NAVIGATE TO SINGLE PRODUCT ────────────────────────────────────────────────
  const handleProductClick = (productId) => {
    setIsOpen(false);
    navigate(`/products/${productId}`);
  };

  // ── VIEW ALL PRODUCTS WITH SAME FILTERS ────────────────────────────────────────
  const handleViewProducts = (filters = {}) => {
    setIsOpen(false);
    const params = new URLSearchParams();

    if (filters.category && filters.category !== 'all') {
      params.set('category', filters.category);
    }
    if (filters.search) {
      params.set('search', filters.search);
    }
    if (filters.minPrice) {
      params.set('minPrice', filters.minPrice);
    }
    if (filters.maxPrice) {
      params.set('maxPrice', filters.maxPrice);
    }

    const qs = params.toString();
    navigate(qs ? `/products?${qs}` : '/products');
  };

  // ── CLEAR CHAT ────────────────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([]);
    conversationHistory.current = [];
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 100);
  };

  // ── DRAGGING — MOUSE ──────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ── DRAGGING — TOUCH ──────────────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragOffset.current.x,
      y: touch.clientY - dragOffset.current.y,
    });
  };

  // ── IF HIDDEN ─────────────────────────────────────────────────────────────────
  if (isHidden) {
    return (
      <button className="chatbot-show-btn" onClick={() => setIsHidden(false)}>
        💬 Chat
      </button>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="chatbot-wrapper"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      ref={bubbleRef}
    >
      {/* CHAT BOX */}
      {isOpen && (
        <div className="chatbot-box">

          {/* HEADER — draggable */}
          <div
            className="chatbot-header"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">G</div>
              <div>
                <p className="chatbot-name">Glamora Assistant</p>
                <p className="chatbot-status">● Online</p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button onClick={clearChat} title="New chat">🔄</button>
              <button onClick={() => setIsHidden(true)} title="Hide">👁️</button>
              <button onClick={() => setIsOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>

                <div className="chat-bubble">
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                </div>

                {/* SMALL PRODUCT CARDS (up to 3 items) */}
                {msg.products && msg.products.length > 0 && (
                  <div className="chatbot-products-container">
                    <div className="chatbot-products-scroll">
                      {msg.products.map((prod) => (
                        <div
                          key={prod._id}
                          className="chatbot-product-card"
                          onClick={() => handleProductClick(prod._id)}
                          title={`Click to view ${prod.name}`}
                        >
                          <div className="chatbot-prod-img-wrap">
                            <img
                              src={prod.image || '/img/placeholder.png'}
                              alt={prod.name}
                              onError={(e) => { e.target.src = '/img/placeholder.png'; }}
                            />
                            {prod.discountPrice > 0 && (
                              <span className="chatbot-sale-badge">SALE</span>
                            )}
                          </div>
                          <div className="chatbot-prod-info">
                            <h4 className="chatbot-prod-name">{prod.name}</h4>
                            <div className="chatbot-prod-price">
                              {prod.discountPrice > 0 ? (
                                <>
                                  <span className="chatbot-new-price">Rs.{prod.discountPrice}</span>
                                  <span className="chatbot-old-price">Rs.{prod.price}</span>
                                </>
                              ) : (
                                <span className="chatbot-new-price">Rs.{prod.price}</span>
                              )}
                            </div>
                            {prod.rating > 0 && (
                              <div className="chatbot-prod-rating">
                                ⭐ {prod.rating.toFixed(1)} {prod.numReviews > 0 ? `(${prod.numReviews})` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* VIEW ALL BUTTON WITH SAME FILTERS */}
                    {msg.actionButton && (
                      <button
                        className="chatbot-view-all-btn"
                        onClick={() => handleViewProducts(msg.actionButton.filterParams)}
                      >
                        {msg.actionButton.label} →
                      </button>
                    )}
                  </div>
                )}

                {/* FALLBACK VIEW PRODUCTS BUTTON IF NO CARDS BUT ACTION SPECIFIED */}
                {(!msg.products || msg.products.length === 0) && msg.actionButton && i === messages.length - 1 && (
                  <button
                    className="view-products-btn"
                    onClick={() => handleViewProducts(msg.actionButton.filterParams)}
                  >
                    {msg.actionButton.label}
                  </button>
                )}

                {/* QUICK REPLIES — only show on last bot message */}
                {msg.role === 'bot' && msg.quickReplies && i === messages.length - 1 && (
                  <div className="quick-replies">
                    {msg.quickReplies.map((qr, j) => (
                      <button
                        key={j}
                        className="quick-reply-btn"
                        onClick={() => sendMessage(qr.value)}
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            ))}

            {/* TYPING INDICATOR */}
            {isTyping && (
              <div className="chat-msg bot">
                <div className="chat-bubble typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="chatbot-input-area">
            <input
              type="text"
              placeholder="Ask or search products (e.g. watches under 50)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputValue)}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
            >
              ➤
            </button>
          </div>

        </div>
      )}

      {/* BUBBLE BUTTON */}
      <button
        className={`chatbot-bubble ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        title="Chat with Glamora Assistant"
      >
        {isOpen ? '✕' : '💬'}
      </button>

    </div>
  );
};

export default ChatBot;
