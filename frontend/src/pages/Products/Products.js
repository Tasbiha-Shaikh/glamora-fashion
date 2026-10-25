import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/products.css';
import { trackProductClick } from '../../hooks/useAnalytics';
import StarRating, { NewItemBadge } from '../../components/StarRating/StarRating';
import { API_URL } from '../../config/api';

const allCategories = ['watches', 'rings', 'glasses', 'bracelets', 'earrings', 'necklaces'];

// ── SEARCH HELPERS ────────────────────────────────────────────────────────────
// "watches", "watchs" and "watch" should all find the same products
const singularForms = (word) =>
  [word, word.replace(/es$/, ''), word.replace(/s$/, '')].filter((w) => w.length >= 2);

// True if a and b differ by at most one inserted, deleted or changed letter
const withinOneEdit = (a, b) => {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};

// Every search word must match in product's name, category, brand, description or colors
const matchesSearch = (product, query) => {
  const searchWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const colorWords = (product.colors || []).map(c => c.name || '').join(' ');
  const productWords = [product.name, product.category, product.brand, product.description, colorWords]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const wordMatches = (searchWord) =>
    singularForms(searchWord).some((term) =>
      productWords.some((pWord) =>
        pWord.startsWith(term) ||
        (term.length >= 3 && pWord.includes(term)) ||
        (term.length >= 4 && singularForms(pWord).some((form) => withinOneEdit(term, form))) ||
        (pWord.length >= 4 && withinOneEdit(term, pWord))
      )
    );

  // If every word matches, exact match
  if (searchWords.every(wordMatches)) return true;

  // Otherwise, match if at least one meaningful search word matches
  const significant = searchWords.filter(w => !['a', 'an', 'the', 'for', 'in', 'of', 'and', 'with', 'to'].includes(w));
  return significant.length > 0 && significant.some(wordMatches);
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false); // mobile toggle

  // Filters
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch all products once
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/products`);
        setProducts(res.data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Re-sync filters when URL changes (e.g. clicked from Navbar dropdown or ChatBot)
  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setSearch(searchParams.get('search') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
  }, [searchParams]);

  // Apply filters + search + sort on the frontend
  const filteredProducts = products
    .filter((p) => (category ? p.category === category : true))
    .filter((p) => (search.trim() ? matchesSearch(p, search) : true))
    .filter((p) => {
      const price = p.discountPrice > 0 ? p.discountPrice : p.price;
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const handleCategoryClick = (cat) => {
    setCategory(cat);
    setSearchParams(cat ? { category: cat } : {});
  };

  const clearFilters = () => {
    setCategory('');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams({});
  };

  return (
    <div className="small-container">
      <h2 className="title">
        {category ? category.toUpperCase() : 'PRODUCTS'}
      </h2>

      {/* TOP BAR — search result info + view toggle + mobile filter toggle */}
      <div className="products-topbar">
        <p className="results-count">
          {loading ? 'Loading...' : `${filteredProducts.length} products found`}
          {search && <span> for "{search}"</span>}
        </p>

        <div className="topbar-actions">
          <button
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {showFilters ? '✕ Close Filters' : '☰ Filters'}
          </button>

          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ▦
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="products-layout">

        {/* SIDEBAR FILTERS — toggled via "show" class on mobile */}
        <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
          <h3>Filters</h3>

          <div className="filter-group">
            <h4>Category</h4>
            <ul className="filter-categories">
              <li
                className={category === '' ? 'active' : ''}
                onClick={() => handleCategoryClick('')}
              >
                All
              </li>
              {allCategories.map((cat) => (
                <li
                  key={cat}
                  className={category === cat ? 'active' : ''}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </li>
              ))}
            </ul>
          </div>

          <div className="filter-group">
            <h4>Price Range</h4>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <h4>Sort By</h4>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          <button className="btn clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </aside>

        {/* PRODUCT GRID / LIST — independently scrollable on desktop */}
        <div className="products-scroll-area">
          <div className={viewMode === 'grid' ? 'row-5' : 'list-view'}>

            {!loading && filteredProducts.length === 0 && (
              <div id="no-product-found">
                <h1 id="not-found-text">No products found 😔</h1>
              </div>
            )}

            {filteredProducts.map((product) => (
              <Link
                to={`/products/${product._id}`}
                key={product._id}
                className={viewMode === 'grid' ? 'col-5' : 'list-item'}
                data-category={product.category}
                onClick={() => trackProductClick(product._id)} 

              >
                <img
                  src={product.images?.[0]?.url || '/img/logo.png'}
                  alt={product.name}
                  onError={(e) => { e.target.src = '/img/logo.png'; }}
                />
                <div className="product-info">
                  <h4>{product.name}</h4>
                  {viewMode === 'list' && (
                    <p className="list-description">{product.description}</p>
                  )}
                  <div className="rating">
                    {product.numReviews > 0 ? (
                      <>
                        <StarRating value={product.rating} size={14} />
                        <span className="rating-count">({product.numReviews})</span>
                      </>
                    ) : (
                      <NewItemBadge />
                    )}
                  </div>
                  <p className="price">Rs.{product.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;