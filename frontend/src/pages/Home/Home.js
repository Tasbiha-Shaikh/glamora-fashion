import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../../components/ProductCard/ProductCard';
import '../../styles/home.css';

const categories = [
  { name: 'Watches', img: '/img/both.webp', slug: 'watches' },
  { name: 'Glasses', img: '/img/1.webp', slug: 'glasses' },
  { name: 'Rings', img: '/img/3.png', slug: 'rings' },
  { name: 'Bracelets', img: '/img/4.jpg', slug: 'bracelets' },
  { name: 'Earrings', img: '/img/5.png', slug: 'earrings' },
  { name: 'Necklaces', img: '/img/6.webp', slug: 'necklaces' },
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest products from backend when page loads
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        // Just show latest 6 products on home page
        setProducts(res.data.data.slice(0, 6));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []); // Empty array = run once when page loads (like Django's view on GET)

  return (
    <>
      {/* BANNER */}
      <div className="banner">
        <div className="row">
          <div className="col-2">
            <h1>Give Your Style<br /> A New Glow</h1>
            <p>
              Success isn't always about greatness. It's about consistency. <br />
              Consistent hard work gain success. Greatness will come.
            </p>
            <Link to="/products" className="btn">Explore Now &#8594;</Link>
          </div>
          <div className="col-2">
            <img src="/img/pic.png" alt="Glamora Banner" />
          </div>
        </div>
      </div>

      {/* FEATURED CATEGORIES */}
      <div className="categories">
        <div className="small-container">
          <h2 className="title">Shop by Category</h2>
          <div className="row">
            {categories.map((cat) => (
              <div className="col-3" key={cat.slug}>
                <Link to={`/products?category=${cat.slug}`}>
                  <img src={cat.img} alt={cat.name} />
                  <h1>{cat.name}</h1>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LATEST PRODUCTS */}
      <div className="small-container">
        <h2 className="title">Latest Products</h2>
        <div className="row">
          {loading ? (
            <p>Loading products...</p>
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <p>No products found. Add some from the backend!</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;