const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { isGeminiConfigured, generateText } = require('../config/gemini');

const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 1000;
const VALID_CATEGORIES = ['watches', 'rings', 'glasses', 'bracelets', 'earrings', 'necklaces'];

const CATEGORY_MAP = {
  'watch': 'watches',
  'watches': 'watches',
  'ring': 'rings',
  'rings': 'rings',
  'glass': 'glasses',
  'glasses': 'glasses',
  'sunglass': 'glasses',
  'sunglasses': 'glasses',
  'shade': 'glasses',
  'shades': 'glasses',
  'bracelet': 'bracelets',
  'bracelets': 'bracelets',
  'bangle': 'bracelets',
  'bangles': 'bracelets',
  'earring': 'earrings',
  'earrings': 'earrings',
  'stud': 'earrings',
  'studs': 'earrings',
  'hoop': 'earrings',
  'hoops': 'earrings',
  'necklace': 'necklaces',
  'necklaces': 'necklaces',
  'pendant': 'necklaces',
  'pendants': 'necklaces',
  'locket': 'necklaces',
  'choker': 'necklaces',
  'chain': 'necklaces',
  'chains': 'necklaces',
};

// Built on the server so the client can't inject its own instructions or read other users' data
const buildSystemPrompt = async (user) => {
  const products = await Product.find({})
    .select('name category price discountPrice stock description brand colors')
    .lean();
  const inStock = products.filter(p => p.stock > 0);
  const outOfStock = products.filter(p => p.stock === 0);

  const productList = inStock.map(p => {
    const desc = p.description ? ` | Description: ${p.description}` : '';
    const brand = p.brand ? ` | Brand: ${p.brand}` : '';
    const colors = p.colors && p.colors.length > 0 ? ` | Colors: ${p.colors.map(c => c.name).join(', ')}` : '';
    return `- [ID:${p._id}] ${p.name} | Category: ${p.category} | Price: Rs.${p.discountPrice > 0 ? p.discountPrice : p.price} | Stock: ${p.stock}${desc}${colors}${brand}`;
  }).join('\n');

  const outOfStockList = outOfStock.map(p => p.name).join(', ') || 'None';

  const latest3 = user
    ? await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(3).lean()
    : [];
  const orderCountMsg = latest3.length === 1
    ? 'Showing 1 latest order (user has 1 order total):'
    : `Showing ${latest3.length} latest orders (always show this count to user):`;

  const orderHistory = latest3.length > 0
    ? orderCountMsg + '\n' + latest3.map(o =>
        `- Order #${String(o._id).slice(-6).toUpperCase()} | Status: ${o.status.toUpperCase()} | Total: Rs.${o.total} | Date: ${new Date(o.createdAt).toLocaleDateString()} | Items: ${o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}`
      ).join('\n')
    : 'No orders found.';

  return `
You are an intelligent shopping assistant for Glamora Fashion Store — an accessories shop selling Watches, Rings, Glasses, Bracelets, Earrings, and Necklaces.

STRICT CONVERSATION RULES:
- NEVER introduce yourself or say your name again — user already knows who you are
- Keep responses SHORT and conversational — max 2-3 sentences, then use RECOMMENDED_IDS and SHOW_PRODUCTS
- NEVER use filler phrases like "I can help you with that!" or "Certainly!"
- For order tracking: show orders directly from data below — NEVER ask for order ID
- If not logged in and asks about orders: tell them to login first
- NEVER mention products that are out of stock

PRODUCT SEARCH & DESCRIPTION READING:
- CAREFULLY READ each product's Description, Name, Category and Colors from the list below.
- When user asks for specific styles, colors, materials or features (e.g. "black watch", "gold chain", "golde chain", "leather strap", "crystal ring", "cat-eye glasses", "pearl", etc.):
  * Find the products whose Description, Name, Brand or Colors best match.
  * For typos (e.g. "golde" -> gold, "shades" -> glasses), understand the user's intent.
  * Mention the best matching product names in your short message.
  * ALWAYS end your response with:
    RECOMMENDED_IDS:[id1, id2, id3]
    SHOW_PRODUCTS:[category]
    (where id1, id2, id3 are the exact [ID:...] values of up to 3 best matching products, and category is the product category or 'all')
- If user asks about a general category (e.g. "watches", "rings", "show products"):
  * Recommend top 3 in-stock items from that category with their IDs and end with SHOW_PRODUCTS:[category].

CURRENT USER:
- Name: ${user?.name || 'Guest'}
- Email: ${user?.email || 'Not logged in'}
- Logged in: ${user ? 'Yes' : 'No'}

USER ORDER HISTORY:
${orderHistory}

PRODUCTS IN STOCK (WITH DESCRIPTIONS & COLORS):
${productList || 'No products available'}

OUT OF STOCK:
${outOfStockList}

STORE POLICIES:
- Shipping: 3-5 business days, free on orders over Rs.50
- Returns: 7-day return policy
- Payment: Cash on Delivery (COD) only
- Categories we sell: Watches, Rings, Glasses, Bracelets, Earrings, Necklaces
- We do NOT sell shoes, clothes, bags, or anything else
  `;
};

// Helper: Format product object for UI
const formatProduct = (p) => ({
  _id: p._id,
  name: p.name,
  price: p.price,
  discountPrice: p.discountPrice || 0,
  category: p.category,
  image: p.images?.find(i => i.isMain)?.url || p.images?.[0]?.url || '/img/placeholder.png',
  rating: p.rating || 0,
  numReviews: p.numReviews || 0,
});

// Helper: Extract search intent, category, budget and keywords from query and AI response
const extractSearchFilters = (userText = '', aiReply = '') => {
  const userLower = userText.toLowerCase();

  // 1. Category extraction from AI response tag SHOW_PRODUCTS:[...]
  let category = null;
  const showMatch = aiReply.match(/SHOW_PRODUCTS:\[([^\]]+)\]/i);
  if (showMatch) {
    category = showMatch[1].toLowerCase().trim();
  }

  // Fallback category check from user text
  if (!category || category === 'all') {
    for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(userLower)) {
        category = cat;
        break;
      }
    }
  }

  // 2. Budget / Price Range extraction
  let minPrice = null;
  let maxPrice = null;

  const rangeMatch = userLower.match(/(?:between|\$|rs\.?)?\s*(\d+)\s*(?:to|and|-)\s*\$?(\d+)/i);
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    minPrice = Number(rangeMatch[1]);
    maxPrice = Number(rangeMatch[2]);
  } else {
    const maxMatch = userLower.match(/(?:under|below|less than|budget(?: of)?|within|max(?:imum)?)\s*\$?(?:rs\.?)?\s*(\d+)/i) ||
                     userLower.match(/(\d+)\s*(?:or less|and below|in price)/i);
    if (maxMatch && maxMatch[1]) {
      maxPrice = Number(maxMatch[1]);
    }

    const minMatch = userLower.match(/(?:over|above|more than|min(?:imum)?)\s*\$?(?:rs\.?)?\s*(\d+)/i) ||
                     userLower.match(/(\d+)\s*\+/i);
    if (minMatch && minMatch[1]) {
      minPrice = Number(minMatch[1]);
    }
  }

  // 3. Recommended IDs from AI response
  let recommendedIds = [];
  const recMatch = aiReply.match(/RECOMMENDED_IDS:\[([^\]]+)\]/i);
  if (recMatch) {
    recommendedIds = recMatch[1]
      .split(',')
      .map(id => id.trim())
      .filter(id => mongoose.isValidObjectId(id));
  }

  // 4. Intent check: Is user searching or asking about products?
  const productIntentKeywords = [
    'show', 'find', 'search', 'buy', 'get', 'browse', 'look', 'see', 'view',
    'watch', 'ring', 'glass', 'sunglass', 'bracelet', 'earring', 'necklace', 'chain',
    'gift', 'recommend', 'collection', 'product', 'products', 'price', 'budget', 'under',
    'black', 'gold', 'golden', 'silver', 'leather', 'analog', 'crystal', 'pearl'
  ];
  const hasProductIntent = Boolean(
    category ||
    showMatch ||
    maxPrice !== null ||
    minPrice !== null ||
    recommendedIds.length > 0 ||
    productIntentKeywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(userLower))
  );

  return {
    category: category || (hasProductIntent ? 'all' : null),
    minPrice,
    maxPrice,
    recommendedIds,
    hasProductIntent,
  };
};

// Helper: Query database for the top 3 most relevant in-stock products
const getTopProducts = async ({ category, minPrice, maxPrice, userText = '', recommendedIds = [] }) => {
  const query = { stock: { $gt: 0 } };

  if (category && category !== 'all' && VALID_CATEGORIES.includes(category)) {
    query.category = category;
  }

  if (maxPrice && !isNaN(maxPrice)) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { discountPrice: { $gt: 0, $lte: Number(maxPrice) } },
        { discountPrice: 0, price: { $lte: Number(maxPrice) } },
        { discountPrice: { $exists: false }, price: { $lte: Number(maxPrice) } }
      ]
    });
  }

  if (minPrice && !isNaN(minPrice)) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { discountPrice: { $gt: 0, $gte: Number(minPrice) } },
        { discountPrice: 0, price: { $gte: Number(minPrice) } },
        { discountPrice: { $exists: false }, price: { $gte: Number(minPrice) } }
      ]
    });
  }

  // 1. If Gemini recommended specific product IDs, fetch them first
  if (recommendedIds.length > 0) {
    const aiProducts = await Product.find({ _id: { $in: recommendedIds }, stock: { $gt: 0 } })
      .select('_id name price discountPrice category images rating numReviews stock description')
      .lean();

    if (aiProducts.length > 0) {
      // Preserve the order AI provided
      const ordered = recommendedIds
        .map(id => aiProducts.find(p => String(p._id) === String(id)))
        .filter(Boolean);

      if (ordered.length >= 3) {
        return ordered.slice(0, 3).map(formatProduct);
      }
      // If 1 or 2 found, use them as base
      let result = ordered.slice(0, 3);
      if (result.length < 3) {
        const excludeIds = result.map(p => p._id);
        const more = await Product.find({ ...query, _id: { $nin: excludeIds } })
          .select('_id name price discountPrice category images rating numReviews stock description')
          .sort({ rating: -1, isFeatured: -1, createdAt: -1 })
          .limit(3 - result.length)
          .lean();
        result = result.concat(more);
      }
      return result.map(formatProduct);
    }
  }

  // 2. Multi-word search across description, name, colors, and brand
  const stopWords = new Set([
    'show', 'me', 'find', 'looking', 'for', 'a', 'an', 'the', 'i', 'want', 'need',
    'any', 'please', 'can', 'you', 'give', 'recommend', 'some', 'good', 'best',
    'under', 'budget', 'price', 'product', 'products', 'store', 'items', 'item', 'have', 'do'
  ]);

  const rawWords = userText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const searchTerms = rawWords.filter(w => !stopWords.has(w) && w.length >= 3 && isNaN(w));

  let products = [];
  if (searchTerms.length > 0) {
    const searchConditions = searchTerms.map(term => {
      // Normalize common typos or plurals: "golde" -> "gold", "watches" -> "watch"
      const stem = term.replace(/e$/, '').replace(/es$/, '').replace(/s$/, '');
      const pattern = new RegExp(stem.length >= 3 ? stem : term, 'i');
      return [
        { description: pattern },
        { name: pattern },
        { brand: pattern },
        { 'colors.name': pattern },
      ];
    }).flat();

    products = await Product.find({ ...query, $or: searchConditions })
      .select('_id name price discountPrice category images rating numReviews stock description')
      .sort({ rating: -1, isFeatured: -1, createdAt: -1 })
      .limit(3)
      .lean();
  }

  // 3. Fallback: Fill remaining slots with top in-stock products
  if (products.length < 3) {
    const existingIds = products.map(p => p._id);
    const remaining = 3 - products.length;
    const fallback = await Product.find({ ...query, _id: { $nin: existingIds } })
      .select('_id name price discountPrice category images rating numReviews stock description')
      .sort({ rating: -1, isFeatured: -1, createdAt: -1 })
      .limit(remaining)
      .lean();

    products = products.concat(fallback);
  }

  return products.map(formatProduct);
};

// @desc   Chat with the store assistant
// @route  POST /api/chat
const chat = async (req, res) => {
  if (!isGeminiConfigured()) {
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

  const latestUserMsg = [...history].reverse().find(m => m.role === 'user')?.text || '';

  try {
    const systemPrompt = await buildSystemPrompt(req.user);
    const contents = history.slice(-MAX_HISTORY).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const rawReply = await generateText({ systemPrompt, contents });
    const replyText = rawReply || 'Sorry, I could not process that.';

    // Extract search intent, recommended IDs and category from user message + reply
    const { category, minPrice, maxPrice, recommendedIds, hasProductIntent } = extractSearchFilters(latestUserMsg, replyText);

    // Fetch top 3 relevant products
    let relevantProducts = [];
    if (hasProductIntent) {
      relevantProducts = await getTopProducts({
        category,
        minPrice,
        maxPrice,
        userText: latestUserMsg,
        recommendedIds,
      });
    }

    // Clean internal tags from reply text
    const cleanReply = replyText
      .replace(/RECOMMENDED_IDS:\[[^\]]+\]/gi, '')
      .replace(/SHOW_PRODUCTS:\[[^\]]+\]/gi, '')
      .trim();

    // Final category for navigation
    const finalCategory = category && category !== 'all' ? category : null;

    res.json({
      success: true,
      reply: cleanReply,
      products: relevantProducts,
      category: finalCategory || (hasProductIntent ? 'all' : null),
      filterParams: {
        ...(finalCategory ? { category: finalCategory } : {}),
        ...(maxPrice !== null && !isNaN(maxPrice) ? { maxPrice } : {}),
        ...(minPrice !== null && !isNaN(minPrice) ? { minPrice } : {}),
      },
    });
  } catch (error) {
    console.error('Gemini error:', error.message);
    const reply = error.isRateLimit
      ? "I'm a bit overwhelmed right now 😅 Please wait a moment and try again!"
      : 'Something went wrong on my end. Please try again shortly.';
    res.json({
      success: true,
      reply,
      products: [],
      category: null,
      filterParams: {},
    });
  }
};

module.exports = { chat };
