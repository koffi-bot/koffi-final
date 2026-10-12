import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Load cart from localStorage for non-authenticated users
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        setCart(JSON.parse(localCart));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1, size = null, color = null) => {
    try {
      if (isAuthenticated) {
        await cartAPI.addToCart({
          product_id: product.id,
          quantity,
          size,
          color,
        });
        await fetchCart();
      } else {
        // Add to local cart
        const newItem = {
          id: Date.now().toString(),
          product_id: product.id,
          product,
          quantity,
          size,
          color,
        };
        const updatedCart = [...cart, newItem];
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
      toast.success('Produit ajouté au panier');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Échec de l\'ajout au panier');
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      if (isAuthenticated) {
        await cartAPI.updateItem(itemId, quantity);
        await fetchCart();
      } else {
        const updatedCart = cart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
      toast.error('Échec de la mise à jour');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      if (isAuthenticated) {
        await cartAPI.removeItem(itemId);
        await fetchCart();
      } else {
        const updatedCart = cart.filter(item => item.id !== itemId);
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
      toast.success('Produit retiré du panier');
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast.error('Échec de la suppression');
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        await cartAPI.clearCart();
      } else {
        localStorage.removeItem('cart');
      }
      setCart([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = item.product || {};
      const price = product.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
