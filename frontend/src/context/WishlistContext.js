import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast/ToastContext';
import { API_URL } from '../config/api';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const toast = useToast();
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('glamoraWishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Sync wishlist with backend when authenticated
  const loadBackendWishlist = useCallback(async () => {
    const token = localStorage.getItem('glamoraToken');
    if (!token) return;

    setLoading(true);
    try {
      // If we have guest items stored locally, sync them to backend first
      const localItems = JSON.parse(localStorage.getItem('glamoraWishlist') || '[]');
      const localIds = localItems.map((item) => (typeof item === 'string' ? item : item._id)).filter(Boolean);

      if (localIds.length > 0) {
        try {
          await axios.post(
            `${API_URL}/api/users/wishlist/sync`,
            { productIds: localIds },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (syncErr) {
          console.warn('Could not sync guest wishlist to backend:', syncErr);
        }
      }

      // Fetch the full populated user wishlist
      const res = await axios.get(`${API_URL}/api/users/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        setWishlist(res.data.data);
        localStorage.setItem('glamoraWishlist', JSON.stringify(res.data.data));
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (err) {
      console.error('Failed to fetch wishlist from backend:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run on mount and listen to user login/logout events
  useEffect(() => {
    loadBackendWishlist();

    const handleUserChange = () => {
      const token = localStorage.getItem('glamoraToken');
      if (token) {
        loadBackendWishlist();
      } else {
        // User logged out: keep whatever is in local storage or clear
        try {
          const saved = localStorage.getItem('glamoraWishlist');
          setWishlist(saved ? JSON.parse(saved) : []);
        } catch (e) {
          setWishlist([]);
        }
      }
    };

    window.addEventListener('userUpdated', handleUserChange);
    window.addEventListener('storage', handleUserChange);

    return () => {
      window.removeEventListener('userUpdated', handleUserChange);
      window.removeEventListener('storage', handleUserChange);
    };
  }, [loadBackendWishlist]);

  // Save to local storage whenever wishlist state changes
  const saveWishlistLocally = (items) => {
    setWishlist(items);
    localStorage.setItem('glamoraWishlist', JSON.stringify(items));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  // Check if a product is in wishlist
  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false;
      return wishlist.some((item) => {
        const itemId = typeof item === 'string' ? item : item._id;
        return itemId === productId;
      });
    },
    [wishlist]
  );

  // Toggle wishlist item
  const toggleWishlist = async (product) => {
    if (!product || (!product._id && !product.id)) return;
    const productId = product._id || product.id;
    const exists = isInWishlist(productId);

    let updatedWishlist;
    if (exists) {
      // Remove
      updatedWishlist = wishlist.filter((item) => {
        const id = typeof item === 'string' ? item : item._id;
        return id !== productId;
      });
      saveWishlistLocally(updatedWishlist);
      toast.info(`Removed "${product.name || 'Item'}" from your wishlist.`, 'Wishlist Updated');
    } else {
      // Add
      const itemToSave = {
        _id: productId,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice || 0,
        images: product.images || (product.img ? [{ url: product.img }] : []),
        stock: product.stock !== undefined ? product.stock : 1,
        rating: product.rating || 0,
        numReviews: product.numReviews || 0,
        category: product.category || '',
        brand: product.brand || '',
      };
      updatedWishlist = [itemToSave, ...wishlist.filter((i) => (i._id || i) !== productId)];
      saveWishlistLocally(updatedWishlist);
      toast.success(`Saved "${product.name || 'Item'}" to your wishlist ❤️`, 'Added to Wishlist');
    }

    // If authenticated, sync with server
    const token = localStorage.getItem('glamoraToken');
    if (token) {
      try {
        const res = await axios.post(
          `${API_URL}/api/users/wishlist/${productId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success && Array.isArray(res.data.data)) {
          setWishlist(res.data.data);
          localStorage.setItem('glamoraWishlist', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.warn('Backend wishlist toggle failed:', err);
      }
    }
  };

  // Remove directly
  const removeFromWishlist = async (productId) => {
    if (!productId) return;
    const itemToRemove = wishlist.find((i) => (i._id || i) === productId);
    const updated = wishlist.filter((item) => {
      const id = typeof item === 'string' ? item : item._id;
      return id !== productId;
    });
    saveWishlistLocally(updated);

    if (itemToRemove?.name) {
      toast.info(`Removed "${itemToRemove.name}" from wishlist.`, 'Wishlist Updated');
    }

    const token = localStorage.getItem('glamoraToken');
    if (token) {
      try {
        const res = await axios.post(
          `${API_URL}/api/users/wishlist/${productId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success && Array.isArray(res.data.data)) {
          setWishlist(res.data.data);
          localStorage.setItem('glamoraWishlist', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.warn('Backend wishlist remove failed:', err);
      }
    }
  };

  // Clear all
  const clearWishlist = () => {
    saveWishlistLocally([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        refreshWishlist: loadBackendWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

