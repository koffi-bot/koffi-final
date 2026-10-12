import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, getCartTotal, getCartCount, fetchCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="w-24 h-24 text-gray-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Votre panier est vide</h2>
          <p className="text-gray-400 mb-8">Ajoutez des produits pour commencer vos achats</p>
          <Link
            to="/shop"
            className="bg-primary text-dark font-bold px-8 py-3 rounded-lg hover:bg-primary-light transition inline-block"
          >
            Découvrir la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8 font-poppins">Panier</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => {
              const product = item.product || {};
              return (
                <div key={item.id} className="bg-dark-light rounded-xl p-4 flex gap-4" data-testid={`cart-item-${item.id}`}>
                  <img
                    src={product.images?.[0] || ''}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">{product.name}</h3>
                    {item.size && (
                      <p className="text-gray-400 text-sm">Taille: {item.size}</p>
                    )}
                    {item.color && (
                      <p className="text-gray-400 text-sm">Couleur: {item.color}</p>
                    )}
                    <p className="text-primary font-bold mt-2">${(product.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300"
                      data-testid={`remove-item-${item.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                        className="bg-dark text-white w-8 h-8 rounded hover:bg-dark-lighter"
                      >
                        <Minus className="w-4 h-4 mx-auto" />
                      </button>
                      <span className="text-white font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItem(item.id, item.quantity + 1)}
                        className="bg-dark text-white w-8 h-8 rounded hover:bg-dark-lighter"
                      >
                        <Plus className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-dark-light rounded-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-6">Résumé de la commande</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Sous-total ({getCartCount()} articles)</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Livraison</span>
                  <span>{getCartTotal() >= 100 ? 'Gratuite' : '$10.00'}</span>
                </div>
                <div className="border-t border-dark-lighter pt-3 flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    ${(getCartTotal() + (getCartTotal() >= 100 ? 0 : 10)).toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary text-dark font-bold py-3 rounded-lg hover:bg-primary-light transition mb-4"
                data-testid="checkout-btn"
              >
                Procéder au paiement
              </button>
              <Link
                to="/shop"
                className="block text-center text-primary hover:text-primary-light font-semibold"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
