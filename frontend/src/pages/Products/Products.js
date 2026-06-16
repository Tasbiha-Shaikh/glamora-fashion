import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/products.css';

const allCategories = ['watches', 'rings', 'glasses', 'bracelets', 'earrings', 'necklaces'];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false); // mobile toggle

  // Filters
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch all products once
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        setProducts(res.data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Re-sync filters when URL changes (e.g. clicked from Navbar dropdown)
  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  // Apply filters + search + sort on the frontend
  const filteredProducts = products
    .filter((p) => (category ? p.category === category : true))
    .filter((p) =>
      search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
    )
    .filter((p) => (minPrice ? p.price >= Number(minPrice) : true))
    .filter((p) => (maxPrice ? p.price <= Number(maxPrice) : true))
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
                    <img src="/img/star.png" alt="rating" />
                  </div>
                  <p className="price">${product.price.toFixed(2)}</p>
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