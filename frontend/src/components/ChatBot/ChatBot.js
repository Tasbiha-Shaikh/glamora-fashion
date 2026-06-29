import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/chatbot.css';

// ── GEMINI API CONFIG ──────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

// ── CALL GEMINI ────────────────────────────────────────────────────────────────
const callGemini = async (systemPrompt, conversationHistory) => {
  try {
    // Send full conversation history so AI remembers context
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Prepend system prompt as first user message
    contents.unshift({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({ contents }),
    });

    const data = await response.json();
    console.log('Gemini response:', data);

    if (data.error) {
      console.error('Gemini API error:', data.error.message);
      const errMsg = data.error.message || '';
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate')) {
        return "I'm a bit overwhelmed right now 😅 Please wait a moment and try again!";
      }
      return 'Something went wrong on my end. Please try again shortly.';
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process that.';
  } catch (err) {
    console.error('Gemini fetch error:', err);
    return 'Sorry, connection error. Please try again.';
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

  // Data
  const [allProducts, setAllProducts] = useState([]);
  const [userOrders, setUserOrders] = useState([]);

  // Conversation history for context memory
  const conversationHistory = useRef([]);

  // ── FETCH PRODUCTS ───────────────────────────────────────────────────────────
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

  // ── FETCH USER ORDERS — callable anytime for fresh data ─────────────────────
  const fetchUserOrders = async () => {
    const user = JSON.parse(localStorage.getItem('glamoraUser'));
    if (!user?.email) return [];
    try {
      const res = await axios.get('http://localhost:5000/api/orders');
      const myOrders = res.data.data
        .filter(o => o.email === user.email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
      setUserOrders(myOrders);
      return myOrders;
    } catch (err) {
      console.error('Chatbot: could not fetch orders');
      return [];
    }
  };

  useEffect(() => { fetchUserOrders(); }, []);

  // ── WELCOME MESSAGE ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const user = JSON.parse(localStorage.getItem('glamoraUser'));
      const greeting = user
        ? `Hi ${user.name}! 👋 How can I help you today?`
        : `Hi! 👋 How can I help you today?`;

      setMessages([{
        role: 'bot',
        text: greeting,
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

  // ── BUILD SYSTEM PROMPT ──────────────────────────────────────────────────────
  const buildSystemPrompt = () => {
    const user = JSON.parse(localStorage.getItem('glamoraUser'));

    const inStock = allProducts.filter(p => p.stock > 0);
    const outOfStock = allProducts.filter(p => p.stock === 0);

    const productList = inStock.map(p =>
      `- ${p.name} | Category: ${p.category} | Price: $${p.price} | Stock: ${p.stock}`
    ).join('\n');

    const outOfStockList = outOfStock.map(p => p.name).join(', ') || 'None';

    const latest3 = userOrders.slice(0, 3); // already sorted newest first
    const orderCountMsg = latest3.length === 0
      ? 'No orders found.'
      : latest3.length === 1
        ? 'Showing 1 latest order (user has 1 order total):'
        : `Showing ${latest3.length} latest orders (always show this count to user):`;

    const orderHistory = latest3.length > 0
      ? orderCountMsg + '\n' + latest3.map(o =>
          `- Order #${o._id.slice(-6).toUpperCase()} | Status: ${o.status.toUpperCase()} | Total: $${o.total} | Date: ${new Date(o.createdAt).toLocaleDateString()} | Items: ${o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}`
        ).join('\n')
      : 'No orders found.';

    return `
You are a helpful assistant for Glamora Fashion Store — a fashion accessories shop.

STRICT RULES:
- NEVER introduce yourself or say your name again — user already knows who you are
- Keep responses SHORT — max 2-3 sentences, then use SHOW_PRODUCTS
- Be natural and conversational
- NEVER use filler phrases like "I can help you with that!"
- ALWAYS end with SHOW_PRODUCTS:[category] when:
  * User mentions any product category (watches, rings, glasses, bracelets, earrings, necklaces)
  * User mentions a budget (under $20, $50, etc.) — use SHOW_PRODUCTS for the most relevant category
  * User asks to see, show, find, or browse products
  * Gift finder has enough info (category known) — use SHOW_PRODUCTS for that category
  * User asks "show me all" or "show me products" — use SHOW_PRODUCTS:[all]
- For order tracking: show orders directly from data below — NEVER ask for order ID
- If not logged in and asks about orders: tell them to login first
- NEVER say you cannot show products — always use SHOW_PRODUCTS instead
- Never mention products that are out of stock

CURRENT USER:
- Name: ${user?.name || 'Guest'}
- Email: ${user?.email || 'Not logged in'}
- Logged in: ${user ? 'Yes' : 'No'}

USER ORDER HISTORY:
${orderHistory}

PRODUCTS IN STOCK:
${productList || 'No products available'}

OUT OF STOCK:
${outOfStockList}

STORE POLICIES:
- Shipping: 3-5 business days, free on orders over $50
- Returns: 7-day return policy
- Payment: Cash on Delivery (COD) and Online (Visa/Debit)
- Categories we sell: Watches, Rings, Glasses, Bracelets, Earrings, Necklaces
- We do NOT sell shoes, clothes, bags, or anything else

SHOW_PRODUCTS INSTRUCTION:
When user wants to see any category, end your reply with exactly: SHOW_PRODUCTS:[categoryname]
Examples:
- User asks about watches → end with SHOW_PRODUCTS:[watches]
- User asks about rings → end with SHOW_PRODUCTS:[rings]
- Gift finder completes → end with SHOW_PRODUCTS:[chosen_category]
- User asks to "show me products" without category → end with SHOW_PRODUCTS:[all]
    `;
  };

  // ── DETECT PRODUCT INTENT from user message (client-side safety net) ─────────
  const detectProductIntent = (text) => {
    const lower = text.toLowerCase();

    // Map of keywords to category
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

    // If user mentions budget but no specific category → show all
    const budgetKeywords = ['under', 'budget', 'dollar', '$', 'price', 'cheap', 'afford'];
    const hasBudget = budgetKeywords.some(k => lower.includes(k));
    if (hasBudget) return 'all';

    // If user says show/find/browse without category → show all
    const showKeywords = ['show', 'find', 'browse', 'see', 'look', 'view', 'display'];
    const hasShow = showKeywords.some(k => lower.includes(k));
    if (hasShow) return 'all';

    return null;
  };

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Add to conversation history for context
    conversationHistory.current.push({ role: 'user', text });

    try {
      // If user is asking about orders, fetch fresh data first
      const orderKeywords = ['order', 'orders', 'track', 'delivery', 'purchase', 'bought'];
      if (orderKeywords.some(k => text.toLowerCase().includes(k))) {
        await fetchUserOrders(); // re-fetch latest orders before building prompt
      }

      const systemPrompt = buildSystemPrompt();

      // Client-side product intent detection (backup if AI misses it)
      const detectedCategory = detectProductIntent(text);

      let botReply = await callGemini(systemPrompt, conversationHistory.current);

      // If AI didn't include SHOW_PRODUCTS but user clearly asked for a category
      if (detectedCategory && !botReply.includes('SHOW_PRODUCTS')) {
        botReply += ` SHOW_PRODUCTS:[${detectedCategory}]`;
      }

      // Parse SHOW_PRODUCTS tag
      const showProductsMatch = botReply.match(/SHOW_PRODUCTS:\[([^\]]+)\]/);
      const cleanReply = botReply.replace(/SHOW_PRODUCTS:\[[^\]]+\]/g, '').trim();

      // Add bot reply to history
      conversationHistory.current.push({ role: 'bot', text: cleanReply });

      const botMsg = {
        role: 'bot',
        text: cleanReply,
        quickReplies: getContextualReplies(text, cleanReply),
      };

      // Add view products button if needed
      if (showProductsMatch) {
        const category = showProductsMatch[1].toLowerCase().trim();
        botMsg.actionButton = {
          label: category === 'all' ? '🛍️ View All Products' : `🛍️ View ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          category: category === 'all' ? '' : category,
        };
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Something went wrong. Please try again.',
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
        { label: 'Under $20', value: 'My budget is under $20' },
        { label: '$20 - $50', value: 'My budget is $20 to $50' },
        { label: '$50+', value: 'My budget is over $50' },
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
    // Default suggestions after any reply
    return [
      { label: '🎁 Find a Gift', value: 'I want to find a gift' },
      { label: '📦 My Orders', value: 'Show me my orders' },
      { label: '🛍️ All Products', value: 'Show me all products' },
    ];
  };

  // ── VIEW PRODUCTS ─────────────────────────────────────────────────────────────
  const handleViewProducts = (category) => {
    setIsOpen(false);
    const path = category ? `/products?category=${category}` : '/products';

    // If already on products page, force a hard navigation so filters re-apply
    if (window.location.pathname === '/products') {
      window.location.href = path; // hard reload to reset filter state
    } else {
      navigate(path);
    }
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

                {/* VIEW PRODUCTS BUTTON — only on last message */}
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
              placeholder="Ask anything about our store..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
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