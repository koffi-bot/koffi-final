import React, { useState, useEffect } from 'react';
import { adminOrderAPI } from '../../services/api';
import { toast } from 'sonner';
import { Eye, Search } from 'lucide-react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminOrderAPI.getAllOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status, paymentStatus = null) => {
    try {
      await adminOrderAPI.updateOrderStatus(orderId, status, paymentStatus);
      toast.success('Statut mis à jour');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status, payment_status: paymentStatus || selectedOrder.payment_status });
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      shipped: 'bg-purple-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
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

  const getPaymentStatusBg = (status) => {
    if (status === 'paid') return 'bg-green-500';
    if (status === 'failed') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const filteredOrders = orders.filter((order) =>
    order.order_number.toLowerCase().includes(search.toLowerCase()) ||
    order.user_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-poppins">Commandes</h1>
        <p className="text-gray-400">Gérez toutes les commandes</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-light text-white px-4 py-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-dark-light rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark">
            <tr>
              <th className="text-left text-white font-semibold p-4">Numéro</th>
              <th className="text-left text-white font-semibold p-4">Client</th>
              <th className="text-left text-white font-semibold p-4">Date</th>
              <th className="text-left text-white font-semibold p-4">Total</th>
              <th className="text-left text-white font-semibold p-4">Statut</th>
              <th className="text-left text-white font-semibold p-4">Paiement</th>
              <th className="text-right text-white font-semibold p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-t border-dark-lighter" data-testid={`order-row-${order.id}`}>
                <td className="p-4">
                  <p className="text-white font-semibold">#{order.order_number}</p>
                </td>
                <td className="p-4">
                  <p className="text-white">{order.user_name}</p>
                  <p className="text-gray-400 text-sm">{order.user_email}</p>
                </td>
                <td className="p-4 text-gray-300">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <p className="text-primary font-bold">${order.total.toFixed(2)}</p>
                </td>
                <td className="p-4">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className={`${getStatusColor(order.status)} text-white font-semibold px-3 py-1 rounded text-sm focus:outline-none`}
                  >
                    <option value="pending">En attente</option>
                    <option value="processing">En traitement</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </td>
                <td className="p-4">
                  <select
                    value={order.payment_status}
                    onChange={(e) => handleStatusUpdate(order.id, order.status, e.target.value)}
                    className={`${getPaymentStatusBg(order.payment_status)} text-white font-semibold px-3 py-1 rounded text-sm focus:outline-none`}
                  >
                    <option value="pending">En attente</option>
                    <option value="paid">Payé</option>
                    <option value="failed">Échoué</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-primary hover:text-primary-light p-2"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-dark-light rounded-xl p-8 max-w-3xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Commande #{selectedOrder.order_number}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white text-3xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-dark rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Informations client</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Nom</p>
                    <p className="text-white">{selectedOrder.user_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="text-white">{selectedOrder.user_email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Téléphone</p>
                    <p className="text-white">{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Adresse</p>
                    <p className="text-white">
                      {selectedOrder.shipping_address}, {selectedOrder.shipping_city} {selectedOrder.shipping_postal_code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-white font-semibold mb-3">Articles</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={`${item.product_id}-${idx}`} className="bg-dark rounded-lg p-4 flex gap-4">
                      <img src={item.product_image} alt={item.product_name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="text-white font-semibold">{item.product_name}</p>
                        <p className="text-gray-400 text-sm">
                          Qté: {item.quantity}
                          {item.size && ` - ${item.size}`}
                          {item.color && ` - ${item.color}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-dark rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Sous-total</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Livraison</span>
                    <span>${selectedOrder.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-dark-lighter">
                    <span>Total</span>
                    <span className="text-primary">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
