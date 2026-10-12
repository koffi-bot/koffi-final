import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { Package, Eye } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getUserOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-400',
      processing: 'text-blue-400',
      shipped: 'text-purple-400',
      delivered: 'text-green-400',
      cancelled: 'text-red-400',
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const getPaymentStatusClass = (status) => {
    if (status === 'paid') return 'text-green-400';
    if (status === 'failed') return 'text-red-400';
    return 'text-yellow-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <Package className="w-24 h-24 text-gray-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Aucune commande</h2>
          <p className="text-gray-400 mb-8">Vous n'avez pas encore passé de commande</p>
          <Link
            to="/shop"
            className="bg-primary text-dark font-bold px-8 py-3 rounded-lg hover:bg-primary-light transition inline-block"
          >
            Commencer mes achats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8 font-poppins">Mes Commandes</h1>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-dark-light rounded-xl p-6" data-testid={`order-${order.id}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b border-dark-lighter">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Commande #{order.order_number}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end gap-2">
                  <span className={`font-bold text-lg ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <span className="text-primary font-bold text-2xl">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{item.product_name}</h4>
                      <p className="text-gray-400 text-sm">
                        Quantité: {item.quantity}
                        {item.size && ` - Taille: ${item.size}`}
                        {item.color && ` - Couleur: ${item.color}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Info */}
              <div className="bg-dark rounded-lg p-4 mb-4">
                <h4 className="text-white font-semibold mb-2">Adresse de livraison</h4>
                <p className="text-gray-400 text-sm">
                  {order.shipping_address}, {order.shipping_city} {order.shipping_postal_code}, {order.shipping_country}
                </p>
                <p className="text-gray-400 text-sm mt-1">Tél: {order.phone}</p>
              </div>

              {/* Payment Info */}
              <div className="bg-dark rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Méthode de paiement:</span>
                  <span className="text-white font-semibold">
                    {order.payment_method === 'orange_money' && 'Orange Money'}
                    {order.payment_method === 'mpesa' && 'M-Pesa'}
                    {order.payment_method === 'airtel_money' && 'Airtel Money'}
                    {order.payment_method === 'card' && 'Carte bancaire'}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">État du paiement:</span>
                  <span className={`font-semibold ${getPaymentStatusClass(order.payment_status)}`}>
                    {order.payment_status === 'paid' && 'Payé'}
                    {order.payment_status === 'pending' && 'En attente'}
                    {order.payment_status === 'failed' && 'Échoué'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;
