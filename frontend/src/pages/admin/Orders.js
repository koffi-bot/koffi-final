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
      toast.error('Impossible de charger les commandes');
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
        setSelectedOrder({
          ...selectedOrder,
          status,
          payment_status: paymentStatus || selectedOrder.payment_status,
        });
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

  const getPaymentStatusBg = (status) => {
    if (status === 'paid') return 'bg-green-500';
    if (status === 'failed') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const filteredOrders = orders.filter((order) =>
    (order.order_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (order.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-w-0 p-4 sm:p-6 lg:p-8">
        <p className="text-gray-400">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 font-poppins text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
          Commandes
        </h1>
        <p className="text-sm text-gray-400 sm:text-base">
          Gérez toutes les commandes
        </p>
      </div>

      <div className="mb-5">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une commande ou un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-dark-light py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {filteredOrders.length} commande(s)
        </p>
      </div>

      {/* Cartes adaptées aux petits écrans */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredOrders.map((order) => (
          <article
            key={order.id}
            data-testid={`order-row-${order.id}`}
            className="min-w-0 rounded-xl border border-dark-lighter bg-dark-light p-4"
          >
            <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all text-sm font-bold text-white">
                  #{order.order_number}
                </p>
                <p className="mt-1 break-words text-sm text-gray-300">
                  {order.user_name}
                </p>
                <p className="break-all text-xs text-gray-400">
                  {order.user_email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(order)}
                aria-label={`Voir la commande ${order.order_number}`}
                className="shrink-0 rounded-lg p-2 text-primary hover:bg-dark focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3 border-y border-dark-lighter py-3">
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="mt-1 text-sm text-gray-300">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total</p>
                <p className="mt-1 font-bold text-primary">
                  ${Number(order.total || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1 block text-xs text-gray-400">Statut</label>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                  className={`w-full rounded px-2 py-2 text-sm font-semibold text-white ${getStatusColor(order.status)} focus:outline-none focus:ring-2 focus:ring-primary`}
                >
                  <option value="pending">En attente</option>
                  <option value="processing">En traitement</option>
                  <option value="shipped">Expédiée</option>
                  <option value="delivered">Livrée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-1 block text-xs text-gray-400">Paiement</label>
                <select
                  value={order.payment_status}
                  onChange={(e) =>
                    handleStatusUpdate(order.id, order.status, e.target.value)
                  }
                  className={`w-full rounded px-2 py-2 text-sm font-semibold text-white ${getPaymentStatusBg(order.payment_status)} focus:outline-none focus:ring-2 focus:ring-primary`}
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="failed">Échoué</option>
                </select>
              </div>
            </div>
          </article>
        ))}

        {filteredOrders.length === 0 && (
          <p className="rounded-xl bg-dark-light p-6 text-center text-gray-400">
            Aucune commande trouvée.
          </p>
        )}
      </div>

      {/* Tableau conservé pour les écrans moyens et grands */}
      <div className="hidden min-w-0 overflow-hidden rounded-xl bg-dark-light md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-dark">
              <tr>
                <th className="p-4 text-left font-semibold text-white">Numéro</th>
                <th className="p-4 text-left font-semibold text-white">Client</th>
                <th className="p-4 text-left font-semibold text-white">Date</th>
                <th className="p-4 text-left font-semibold text-white">Total</th>
                <th className="p-4 text-left font-semibold text-white">Statut</th>
                <th className="p-4 text-left font-semibold text-white">Paiement</th>
                <th className="p-4 text-right font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  data-testid={`order-row-${order.id}`}
                  className="border-t border-dark-lighter"
                >
                  <td className="p-4">
                    <p className="break-all font-semibold text-white">
                      #{order.order_number}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-white">{order.user_name}</p>
                    <p className="break-all text-sm text-gray-400">
                      {order.user_email}
                    </p>
                  </td>
                  <td className="whitespace-nowrap p-4 text-gray-300">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap p-4">
                    <p className="font-bold text-primary">
                      ${Number(order.total || 0).toFixed(2)}
                    </p>
                  </td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className={`${getStatusColor(order.status)} rounded px-3 py-2 text-sm font-semibold text-white focus:outline-none`}
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
                      onChange={(e) =>
                        handleStatusUpdate(order.id, order.status, e.target.value)
                      }
                      className={`${getPaymentStatusBg(order.payment_status)} rounded px-3 py-2 text-sm font-semibold text-white focus:outline-none`}
                    >
                      <option value="pending">En attente</option>
                      <option value="paid">Payé</option>
                      <option value="failed">Échoué</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      aria-label={`Voir la commande ${order.order_number}`}
                      className="rounded-lg p-2 text-primary hover:bg-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    Aucune commande trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détails de la commande */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 sm:items-center sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="my-3 w-full max-w-3xl min-w-0 rounded-xl bg-dark-light p-4 sm:my-8 sm:p-6 lg:p-8"
          >
            <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
              <h2
                id="order-detail-title"
                className="break-words text-xl font-bold text-white sm:text-2xl"
              >
                Commande #{selectedOrder.order_number}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Fermer les détails"
                className="shrink-0 px-2 text-3xl leading-none text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <section className="rounded-lg bg-dark p-4">
                <h3 className="mb-3 font-semibold text-white">Informations client</h3>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-gray-400">Nom</p>
                    <p className="break-words text-white">{selectedOrder.user_name}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400">Email</p>
                    <p className="break-all text-white">{selectedOrder.user_email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400">Téléphone</p>
                    <p className="break-words text-white">{selectedOrder.phone || 'Non renseigné'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400">Adresse</p>
                    <p className="break-words text-white">
                      {[selectedOrder.shipping_address, selectedOrder.shipping_city, selectedOrder.shipping_postal_code]
                        .filter(Boolean)
                        .join(', ') || 'Non renseignée'}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-white">Articles</h3>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={`${item.product_id}-${idx}`}
                      className="flex min-w-0 flex-col gap-3 rounded-lg bg-dark p-3 sm:flex-row sm:items-center sm:p-4"
                    >
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold text-white">{item.product_name}</p>
                        <p className="text-sm text-gray-400">
                          Qté : {item.quantity}
                          {item.size && ` - ${item.size}`}
                          {item.color && ` - ${item.color}`}
                        </p>
                      </div>
                      <p className="font-bold text-primary sm:text-right">
                        ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg bg-dark p-4">
                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex justify-between gap-3 text-gray-300">
                    <span>Sous-total</span>
                    <span>${Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-gray-300">
                    <span>Livraison</span>
                    <span>${Number(selectedOrder.shipping || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-dark-lighter pt-3 text-lg font-bold text-white">
                    <span>Total</span>
                    <span className="text-primary">
                      ${Number(selectedOrder.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-black transition hover:opacity-90 sm:w-auto"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
