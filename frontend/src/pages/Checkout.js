import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { CreditCard, Smartphone } from 'lucide-react';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_address: user?.address || '',
    shipping_city: user?.city || '',
    shipping_postal_code: user?.postal_code || '',
    shipping_country: user?.country || 'RDC',
    phone: user?.phone || '',
    payment_method: 'orange_money',
    payment_phone: '',
  });

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subtotal = getCartTotal();
      const shipping = subtotal >= 100 ? 0 : 10;
      const total = subtotal + shipping;

      const orderData = {
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        items: cart.map((item) => ({
          product_id: item.product_id,
          product_name: item.product?.name || '',
          product_image: item.product?.images?.[0] || '',
          quantity: item.quantity,
          price: item.product?.price || 0,
          size: item.size,
          color: item.color,
        })),
        subtotal,
        shipping,
        total,
        ...formData,
      };

      const response = await orderAPI.createOrder(orderData);
      
      await Swal.fire({
        title: 'Commande créée !',
        html: `
          <p>Votre commande <strong>#${response.data.order_number}</strong> a été créée avec succès.</p>
          <p class="mt-4">Vous allez recevoir un email de confirmation.</p>
        `,
        icon: 'success',
        confirmButtonColor: '#00ff66',
        confirmButtonText: 'Voir mes commandes',
      });

      clearCart();
      navigate('/orders');
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error(error.response?.data?.detail || 'Échec de la commande');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getCartTotal();
  const shipping = subtotal >= 100 ? 0 : 10;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8 font-poppins">Paiement</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <div className="bg-dark-light rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Informations de livraison</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-white mb-2">Adresse</label>
                    <input
                      type="text"
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleChange}
                      required
                      className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="shipping-address-input"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Ville</label>
                    <input
                      type="text"
                      name="shipping_city"
                      value={formData.shipping_city}
                      onChange={handleChange}
                      required
                      className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Code postal</label>
                    <input
                      type="text"
                      name="shipping_postal_code"
                      value={formData.shipping_postal_code}
                      onChange={handleChange}
                      required
                      className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Pays</label>
                    <input
                      type="text"
                      name="shipping_country"
                      value={formData.shipping_country}
                      onChange={handleChange}
                      required
                      className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-dark-light rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Méthode de paiement</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 bg-dark rounded-lg cursor-pointer hover:bg-dark-lighter transition">
                    <input
                      type="radio"
                      name="payment_method"
                      value="orange_money"
                      checked={formData.payment_method === 'orange_money'}
                      onChange={handleChange}
                      className="text-primary"
                    />
                    <Smartphone className="w-6 h-6 text-primary" />
                    <span className="text-white font-semibold">Orange Money</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-dark rounded-lg cursor-pointer hover:bg-dark-lighter transition">
                    <input
                      type="radio"
                      name="payment_method"
                      value="mpesa"
                      checked={formData.payment_method === 'mpesa'}
                      onChange={handleChange}
                      className="text-primary"
                    />
                    <Smartphone className="w-6 h-6 text-primary" />
                    <span className="text-white font-semibold">M-Pesa</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-dark rounded-lg cursor-pointer hover:bg-dark-lighter transition">
                    <input
                      type="radio"
                      name="payment_method"
                      value="airtel_money"
                      checked={formData.payment_method === 'airtel_money'}
                      onChange={handleChange}
                      className="text-primary"
                    />
                    <Smartphone className="w-6 h-6 text-primary" />
                    <span className="text-white font-semibold">Airtel Money</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-dark rounded-lg cursor-pointer hover:bg-dark-lighter transition">
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={formData.payment_method === 'card'}
                      onChange={handleChange}
                      className="text-primary"
                    />
                    <CreditCard className="w-6 h-6 text-primary" />
                    <span className="text-white font-semibold">Carte bancaire</span>
                  </label>
                </div>
                {formData.payment_method !== 'card' && (
                  <div className="mt-4">
                    <label className="block text-white mb-2">Numéro de téléphone</label>
                    <input
                      type="tel"
                      name="payment_phone"
                      value={formData.payment_phone}
                      onChange={handleChange}
                      placeholder="+243 999 999 999"
                      className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-dark-light rounded-xl p-6 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-4">Résumé de la commande</h3>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-gray-300">
                      <span className="flex-1 line-clamp-1">
                        {item.product?.name} x {item.quantity}
                      </span>
                      <span>${((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-dark-lighter pt-3">
                    <div className="flex justify-between text-gray-300 mb-2">
                      <span>Sous-total</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300 mb-2">
                      <span>Livraison</span>
                      <span>{shipping === 0 ? 'Gratuite' : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-dark-lighter">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-dark font-bold py-3 rounded-lg hover:bg-primary-light transition disabled:opacity-50"
                  data-testid="place-order-btn"
                >
                  {loading ? 'Traitement...' : 'Passer la commande'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
