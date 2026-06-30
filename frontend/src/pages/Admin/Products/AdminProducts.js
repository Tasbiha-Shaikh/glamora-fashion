import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/admin.css';

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const emptyForm = {
    name: '', description: '', price: '', discountPrice: '',
    category: 'watches', brand: 'Glamora', stock: '',
    imageUrl: '', isDeal: false, isLatest: false,
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const openAddForm = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || '',
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      imageUrl: product.images?.[0]?.url || '',
      isDeal: product.isDeal || false,
      isLatest: product.isLatest || false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditProduct(null);
  };

  const handleClear = () => {
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('glamoraAdminToken');
    const headers = { Authorization: `Bearer ${token}` };

    const productData = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      discountPrice: Number(form.discountPrice) || 0,
      category: form.category,
      brand: form.brand,
      stock: Number(form.stock),
      isDeal: form.isDeal,
      isLatest: form.isLatest,
      images: form.imageUrl ? [{ url: form.imageUrl, isMain: true }] : [],
    };

    try {
      if (editProduct) {
        await axios.put(`http://localhost:5000/api/products/${editProduct._id}`, productData, { headers });
        alert('Product updated!');
      } else {
        await axios.post('http://localhost:5000/api/products', productData, { headers });
        alert('Product added!');
      }
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      alert('Error saving product.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const token = localStorage.getItem('glamoraAdminToken');
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      alert('Error deleting product.');
    }
  };

  // Quick toggle for "isLatest" directly from the table, without opening the form
  const handleToggleLatest = async (product) => {
    const token = localStorage.getItem('glamoraAdminToken');
    const headers = { Authorization: `Bearer ${token}` };
    const newValue = !product.isLatest;

    // Optimistically update the UI first
    setProducts((prev) =>
      prev.map((p) => (p._id === product._id ? { ...p, isLatest: newValue } : p))
    );

    try {
      await axios.put(
        `http://localhost:5000/api/products/${product._id}`,
        { isLatest: newValue },
        { headers }
      );
    } catch (error) {
      alert('Error updating product.');
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isLatest: product.isLatest } : p))
      );
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="admin-logo">Glamora<span>Admin</span></h2>
        <ul className="admin-menu">
          <li><Link to="/admin">📊 Dashboard</Link></li>
          <li className="active"><Link to="/admin/products">📦 Products</Link></li>
          <li><Link to="/admin/orders">🧾 Orders</Link></li>
          <li><Link to="/admin/users">👥 Users</Link></li>
          <li><Link to="/">🏠 Back to Store</Link></li>
          <li onClick={() => {
            localStorage.removeItem('glamoraAdminToken');
            localStorage.removeItem('glamoraAdminUser');
            window.location.href = '/admin';
          }} style={{ cursor: 'pointer' }}>
            <a>🚪 Logout</a>
          </li>
        </ul>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1>Products</h1>
          <button className="btn" onClick={openAddForm}>+ Add Product</button>
        </div>

        {/* ADD/EDIT MODAL */}
        {showForm && (
          <div
            onClick={closeForm}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <div
              className="admin-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div className="admin-card-header">
                <h3>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button
                  onClick={closeForm}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input name="name" value={form.name} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={handleFormChange}>
                      <option value="watches">Watches</option>
                      <option value="rings">Rings</option>
                      <option value="glasses">Glasses</option>
                      <option value="bracelets">Bracelets</option>
                      <option value="earrings">Earrings</option>
                      <option value="necklaces">Necklaces</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input type="number" name="price" value={form.price} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Discount Price ($)</label>
                    <input type="number" name="discountPrice" value={form.discountPrice} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input type="number" name="stock" value={form.stock} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Brand</label>
                    <input name="brand" value={form.brand} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Image URL (e.g. /img/watch1.jpg)</label>
                    <input name="imageUrl" value={form.imageUrl} onChange={handleFormChange} placeholder="/img/watch1.jpg" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea name="description" value={form.description} onChange={handleFormChange} rows="3" required />
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" name="isDeal" checked={form.isDeal} onChange={handleFormChange} />
                      {' '}Mark as Deal
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" name="isLatest" checked={form.isLatest} onChange={handleFormChange} />
                      {' '}Show in Latest Products
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="btn">
                    {editProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleClear}
                    style={{ background: '#888' }}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRODUCTS TABLE */}
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Latest</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <img
                      src={product.images?.[0]?.url || '/img/logo.png'}
                      alt={product.name}
                      className="admin-product-img"
                      onError={(e) => { e.target.src = '/img/logo.png'; }}
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price}</td>
                  <td>{product.stock}</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!product.isLatest}
                      onChange={() => handleToggleLatest(product)}
                    />
                  </td>
                  <td>
                    <button className="edit-btn" onClick={() => openEditForm(product)}>✏️ Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(product._id)}>🗑️ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminProducts;