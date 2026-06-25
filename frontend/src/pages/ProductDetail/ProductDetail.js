import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/productDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Fetch the single product by ID from URL
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(res.data.data);

        // Fetch related products from same category
        const allRes = await axios.get('http://localhost:5000/api/products');
        const related = allRes.data.data
          .filter((p) => p.category === res.data.data.category && p._id !== id)
          .slice(0, 3);
        setRelatedProducts(related);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]); 

  const handleAddToCart = () => {
    if (qty <= 0) {
      alert('Quantity must be greater than 0 to add to cart.');
      return;
    }

    // use localStorage
    let cart = JSON.parse(localStorage.getItem('glamoraCart')) || [];
    const existingIndex = cart.findIndex((item) => item.id === product._id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity = qty;
    } else {
      cart.push({
        id: product._id,
        name: product.name,
        price: product.discountPrice > 0 ? product.discountPrice : product.price,
        quantity: qty,
        img: product.images?.[0]?.url || '/img/logo.png',
      });
    }

    localStorage.setItem('glamoraCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    alert(`${qty}x ${product.name} added to the cart!`);
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '100px' }}>Loading...</p>;
  if (!product) return <p style={{ textAlign: 'center', padding: '100px' }}>Product not found.</p>;

  return (
    <>
      <div id="pd-wrapper">
        <div className="pd-inner-row">

          {/* IMAGE SIDE */}
          <div className="pd-image-side">
            <img
              id="productImg"
              src={product.images?.[0]?.url || '/img/logo.png'}
              alt={product.name}
              onError={(e) => { e.target.src = '/img/logo.png'; }}
            />
          </div>

          {/* CONTENT SIDE */}
          <div className="pd-content-side">
            <p className="pd-breadcrumb">
              Home / {product.category} / {product.name}
            </p>
            <h1 id="productName">{product.name}</h1>

            <div className="pd-rating-stars">
              <img src="/img/star.png" style={{ width: '100px' }} alt="rating" />
              <span>({product.rating || '4.8'}/5 Reviews)</span>
            </div>

            <h3 id="productPrice">
              {product.discountPrice > 0 ? (
                <>
                  <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '22px', marginRight: '10px' }}>
                    ${product.price}
                  </span>
                  ${product.discountPrice}
                </>
              ) : (
                <>${product.price.toFixed(2)}</>
              )}
            </h3>

            <div className="pd-meta-info">
              <p><strong>SKU:</strong> GLM-{product._id.slice(-6).toUpperCase()}</p>
              <p>
                <strong>Stock:</strong>{' '}
                {product.stock > 0 ? (
                  <span style={{ color: 'green' }}>Available ({product.stock})</span>
                ) : (
                  <span style={{ color: 'red' }}>Out of Stock</span>
                )}
              </p>
            </div>

            <div className="pd-qty-section">
              <h4 className="pd-label">Quantity</h4>
              <div className="pd-action-box">
                <input
                  type="number"
                  value={qty}
                  min="1"
                  max={product.stock}
                  id="qtyInput"
                  onChange={(e) => setQty(Number(e.target.value))}
                />
                <button
                  className="pd-add-btn"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add To Cart'}
                </button>
              </div>
            </div>

            <div className="pd-desc-box">
              <h4>Description</h4>
              <p>{product.description}</p>
            </div>

            <div className="pd-shipping-info">
              <p><strong>Shipping:</strong> Free standard shipping on orders over $50.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="small-container">
          <h2 className="title">Related Products</h2>
          <div className="row" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            {relatedProducts.map((rp) => (
              <div className="col-4" key={rp._id} style={{ flex: 1, maxWidth: '250px' }}>
                <Link to={`/products/${rp._id}`} className="related-link">
                  <img
                    src={rp.images?.[0]?.url || '/img/logo.png'}
                    style={{ width: '100%' }}
                    alt={rp.name}
                    onError={(e) => { e.target.src = '/img/logo.png'; }}
                  />
                  <h4>{rp.name}</h4>
                  <p>${rp.price.toFixed(2)}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;