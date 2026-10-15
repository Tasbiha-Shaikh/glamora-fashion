const Product = require('../models/Product');
const Order = require('../models/Order');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 1000;

// Built on the server so the client can't inject its own instructions or read other users' data
const buildSystemPrompt = async (user) => {
  const products = await Product.find({}).select('name category price discountPrice stock');
  const inStock = products.filter(p => p.stock > 0);
  const outOfStock = products.filter(p => p.stock === 0);

  const productList = inStock.map(p =>
    `- ${p.name} | Category: ${p.category} | Price: $${p.discountPrice > 0 ? p.discountPrice : p.price} | Stock: ${p.stock}`
  ).join('\n');

  const outOfStockList = outOfStock.map(p => p.name).join(', ') || 'None';

  const latest3 = user
    ? await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(3)
    : [];
  const orderCountMsg = latest3.length === 1
    ? 'Showing 1 latest order (user has 1 order total):'
    : `Showing ${latest3.length} latest orders (always show this count to user):`;

  const orderHistory = latest3.length > 0
    ? orderCountMsg + '\n' + latest3.map(o =>
        `- Order #${String(o._id).slice(-6).toUpperCase()} | Status: ${o.status.toUpperCase()} | Total: $${o.total} | Date: ${o.createdAt.toLocaleDateString()} | Items: ${o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}`
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
- Only talk about this store, its products and the user's own orders

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
- Payment: Cash on Delivery (COD) only
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

// @desc   Chat with the store assistant
// @route  POST /api/chat
const chat = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ success: false, message: 'Chat is not configured' });
  }

  const { history } = req.body;
  const validHistory = Array.isArray(history) && history.length > 0 && history.every(m =>
    (m?.role === 'user' || m?.role === 'bot') &&
    typeof m.text === 'string' && m.text.length <= MAX_MESSAGE_LENGTH
  );
  if (!validHistory) {
    return res.status(400).json({ success: false, message: 'Invalid chat history' });
  }

  try {
    const systemPrompt = await buildSystemPrompt(req.user);
    const contents = history.slice(-MAX_HISTORY).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
      }),
    });
    const data = await response.json();

    if (data.error) {
      console.error('Gemini API error:', data.error.message);
      const errMsg = (data.error.message || '').toLowerCase();
      const reply = errMsg.includes('quota') || errMsg.includes('rate')
        ? "I'm a bit overwhelmed right now 😅 Please wait a moment and try again!"
        : 'Something went wrong on my end. Please try again shortly.';
      return res.json({ success: true, reply });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process that.';
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Gemini fetch error:', error.message);
    res.status(502).json({ success: false, message: 'Chat service unavailable' });
  }
};

module.exports = { chat };
