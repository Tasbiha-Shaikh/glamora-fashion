import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/productCard.css';

// This component takes a "product" object and displays it
// Reusable everywhere: Home, Products page, Search results
const ProductCard = ({ product }) => {
  return (
    <div className="col-4">
      <Link to={`/products/${product._id}`}>
        <div className="col-5" data-category={product.category}>
          <img src={product.images?.[0]?.url || '/img/placeholder.png'} height="250" alt={product.name} />
          <h1>{product.name}</h1>
          <p className="price">
            {product.discountPrice > 0 ? (
              <>
                <span className="old-price">${product.price}</span>
                <span className="new-price">${product.discountPrice}</span>
              </>
            ) : (
              <span>${product.price}</span>
            )}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;