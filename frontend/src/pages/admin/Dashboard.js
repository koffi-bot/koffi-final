import React, { useEffect, useState } from 'react';
import { adminStatsAPI } from '../../services/api';
import { DollarSign, Package, ShoppingBag, Users, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminStatsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Revenus totaux',
      value: `$${stats?.total_revenue?.toFixed(2) || 0}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Commandes totales',
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'Produits',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: 'Clients',
      value: stats?.total_customers || 0,
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

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

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 font-poppins">
          Dashboard
        </h1>
        <p className="text-gray-400">Vue d'ensemble de votre boutique</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.title} className="min-w-0 bg-dark-light rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className={`w-12 h-12 flex-shrink-0 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-white text-2xl sm:text-3xl font-bold break-words">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:gap-8">
        {stats?.pending_orders > 0 && (
          <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-bold text-lg">Commandes en attente</h3>
                <p className="text-yellow-200">
                  Vous avez {stats.pending_orders} commande(s) en attente de traitement
                </p>
              </div>
              <Link
                to="/admin/orders"
                className="w-full sm:w-auto text-center bg-yellow-400 text-dark font-semibold px-5 py-3 rounded-lg hover:bg-yellow-300 transition"
              >
                Voir les commandes
              </Link>
            </div>
          </div>
        )}

        <div className="min-w-0 bg-dark-light rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Commandes récentes
            </h2>
            <Link
              to="/admin/orders"
              className="text-primary hover:text-primary-light font-semibold"
            >
              Voir tout
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.recent_orders?.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="bg-dark rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-white font-semibold break-words">#{order.order_number}</p>
                  <p className="text-gray-400 text-sm break-words">{order.user_name}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-primary font-bold text-lg">
                    ${Number(order.total || 0).toFixed(2)}
                  </p>
                  <p className={`text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </p>
                </div>
              </div>
            ))}

            {(!stats?.recent_orders || stats.recent_orders.length === 0) && (
              <p className="text-gray-400 text-center py-8">
                Aucune commande récente
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
