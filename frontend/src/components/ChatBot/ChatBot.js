import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/chatbot.css';

// ── GEMINI API CONFIG ──────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── CALL GEMINI ────────────────────────────────────────────────────────────────
const callGemini = async (systemPrompt, userMessage) => {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nUser: ${userMessage}` }
          ]
        }
      ]
    })
  });
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not understand that.';
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
const ChatBot = () => {
  const navigate = useNavigate();

  // Chat state
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef(null);

  // Products from backend (fetched once)
  const [allProducts, setAllProducts] = useState([]);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        setAllProducts(res.data.data);
      } catch (err) {
        console.error('Chatbot: could not fetch products');
      }
    };
    fetchProducts();
  }, []);

  // Send welcome message when chat opens first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = {
        role: 'bot',
        text: "Hi! I'm Glamora Assistant 👋 How can I help you today?",
        quickReplies: [
          { label: '🎁 Find a Gift', value: 'I want to find a gift' },
          { label: '📦 Track Order', value: 'I want to track my order' },
          { label: '💬 Style Help', value: 'I need style suggestions' },
          { label: '❓ FAQ', value: 'I have a question about shipping or returns' },
        ],
      };
      setMessages([welcome]);
    }
  }, [isOpen]);

  // Auto scroll to bottom on new message
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── BUILD SYSTEM PROMPT WITH REAL PRODUCT DATA ────────────────────────────────
  const buildSystemPrompt = () => {
    const inStock = allProducts.filter(p => p.stock > 0);
    const outOfStock = allProducts.filter(p => p.stock === 0);

    const productList = inStock.map(p =>
      `- ${p.name} | Category: ${p.category} | Price: $${p.price} | Stock: ${p.stock}`
    ).join('\n');

    const outOfStockList = outOfStock.map(p => p.name).join(', ');

    return `
You are Glamora Assistant, a helpful AI for Glamora Fashion Store.

STORE INFO:
- Glamora sells fashion accessories only
- Categories: Watches, Rings, Glasses, Bracelets, Earrings, Necklaces
- We do NOT sell shoes, clothes, bags, or anything else
- If asked about something we don't sell, politely say so and suggest an accessory instead

CURRENT PRODUCTS IN STOCK:
${productList || 'No products currently available'}

OUT OF STOCK:
${outOfStockList || 'None'}

YOUR BEHAVIOR:
- Be friendly, helpful, and concise
- Keep responses short (2-4 sentences max)
- For gift finder: ask about budget, then category, then color preference
- For order tracking: ask for order ID, then say you'll pass it to the team
- For style help: suggest accessories based on what they describe
- For FAQ: answer shipping (3-5 days, free over $50), returns (7 days), payment (COD + online)
- Never make up products — only recommend from the IN STOCK list above
- If a product is out of stock, say so and suggest a similar in-stock alternative
- End gift finder responses with: SHOW_PRODUCTS:[category] so the app can filter products
    `;
  };

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const systemPrompt = buildSystemPrompt();
      const botReply = await callGemini(systemPrompt, text);

      // Check if bot wants to show products
      const showProductsMatch = botReply.match(/SHOW_PRODUCTS:\[([^\]]+)\]/);
      const cleanReply = botReply.replace(/SHOW_PRODUCTS:\[[^\]]+\]/, '').trim();

      const botMsg = {
        role: 'bot',
        text: cleanReply,
        quickReplies: getContextualReplies(cleanReply),
      };

      // If bot wants to show products, add a "View Results" button
      if (showProductsMatch) {
        const category = showProductsMatch[1].toLowerCase().trim();
        botMsg.actionButton = {
          label: '🛍️ View Products',
          category,
        };
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Sorry, something went wrong. Please try again! 😔',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── CONTEXTUAL QUICK REPLIES based on bot reply ───────────────────────────────
  const getContextualReplies = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('budget') || lower.includes('price')) {
      return [
        { label: 'Under $20', value: 'My budget is under $20' },
        { label: '$20 - $50', value: 'My budget is $20 to $50' },
        { label: '$50+', value: 'My budget is over $50' },
      ];
    }
    if (lower.includes('category') || lower.includes('type')) {
      return [
        { label: '⌚ Watches', value: 'Watches' },
        { label: '💍 Rings', value: 'Rings' },
        { label: '👓 Glasses', value: 'Glasses' },
        { label: '📿 Necklaces', value: 'Necklaces' },
        { label: '💎 Bracelets', value: 'Bracelets' },
        { label: '✨ Earrings', value: 'Earrings' },
      ];
    }
    if (lower.includes('color')) {
      return [
        { label: '🥇 Gold', value: 'Gold' },
        { label: '🥈 Silver', value: 'Silver' },
        { label: '🖤 Black', value: 'Black' },
        { label: '🌸 Rose Gold', value: 'Rose Gold' },
      ];
    }
    return null;
  };

  // ── HANDLE VIEW PRODUCTS BUTTON ───────────────────────────────────────────────
  const handleViewProducts = (category) => {
    setIsOpen(false); // minimize chat
    navigate(`/products?category=${category}`);
  };

  // ── TRACK ORDER ───────────────────────────────────────────────────────────────
  const handleTrackOrder = async (orderId) => {
    setIsTyping(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
      const order = res.data.data;
      const botMsg = {
        role: 'bot',
        text: `Found your order! 📦\n\nOrder #${order._id.slice(-6).toUpperCase()}\nStatus: ${order.status.toUpperCase()}\nTotal: $${order.total}\nPlaced: ${new Date(order.createdAt).toLocaleDateString()}`,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "I couldn't find that order ID. Please check and try again, or contact us at Glamora@gmail.com 📧",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Check if user message looks like an order ID and handle it
  const handleSend = async (text) => {
    const cleanText = text.trim();

    // If it looks like a MongoDB ObjectId (24 hex chars), try to track it
    if (/^[a-fA-F0-9]{24}$/.test(cleanText)) {
      setMessages(prev => [...prev, { role: 'user', text: cleanText }]);
      setInputValue('');
      await handleTrackOrder(cleanText);
      return;
    }

    await sendMessage(cleanText);
  };

  // ── DRAGGING LOGIC ────────────────────────────────────────────────────────────
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

  // Touch support for mobile dragging
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

  // ── CLEAR CHAT ────────────────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([]);
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 100);
  };

  // ── IF HIDDEN ─────────────────────────────────────────────────────────────────
  if (isHidden) {
    return (
      <button
        className="chatbot-show-btn"
        onClick={() => setIsHidden(false)}
      >
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

          {/* HEADER */}
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

                {/* MESSAGE BUBBLE */}
                <div className="chat-bubble">
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                </div>

                {/* QUICK REPLY BUTTONS */}
                {msg.quickReplies && i === messages.length - 1 && (
                  <div className="quick-replies">
                    {msg.quickReplies.map((qr, j) => (
                      <button
                        key={j}
                        className="quick-reply-btn"
                        onClick={() => handleSend(qr.value)}
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* VIEW PRODUCTS ACTION BUTTON */}
                {msg.actionButton && i === messages.length - 1 && (
                  <button
                    className="view-products-btn"
                    onClick={() => handleViewProducts(msg.actionButton.category)}
                  >
                    {msg.actionButton.label}
                  </button>
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
              placeholder="Type a message or enter order ID..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
            />
            <button
              className="send-btn"
              onClick={() => handleSend(inputValue)}
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