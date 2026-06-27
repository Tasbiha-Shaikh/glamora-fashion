import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

// Pages
import Home from './pages/Home/Home';
import Products from './pages/Products/Products';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import About from './pages/About/About';
import Profile from './pages/Profile/Profile';
import AdminLogin from './pages/Admin/AdminLogin/AdminLogin';
import AdminRoute from './components/AdminRoute/AdminRoute';
import Dashboard from './pages/Admin/Dashboard/Dashboard';
import AdminProducts from './pages/Admin/Products/AdminProducts';
import AdminOrders from './pages/Admin/Orders/AdminOrders';
import AdminUsers from './pages/Admin/Users/AdminUsers';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminLogin />} />

        <Route path="/admin/dashboard" element={
          <AdminRoute><Dashboard /></AdminRoute>
        } />
        <Route path="/admin/products" element={
          <AdminRoute><AdminProducts /></AdminRoute>
        } />
        <Route path="/admin/orders" element={
          <AdminRoute><AdminOrders /></AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute><AdminUsers /></AdminRoute>
        } />

      </Routes>
      <Footer />
    </Router>
  );
}

export default App;


