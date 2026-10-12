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
      <div className="flex items-center justify-center h-screen">
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-poppins">Dashboard</h1>
        <p className="text-gray-400">Vue d'ensemble de votre boutique</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-dark-light rounded-xl p-6">"
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-white text-3xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Orders & Pending Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Orders Alert */}
        {stats?.pending_orders > 0 && (
          <div className="lg:col-span-2 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-white font-bold text-lg">Commandes en attente</h3>
                <p className="text-yellow-200">
                  Vous avez {stats.pending_orders} commande(s) en attente de traitement
                </p>
              </div>
              <Link
                to="/admin/orders"
                className="ml-auto bg-yellow-400 text-dark font-semibold px-6 py-2 rounded-lg hover:bg-yellow-300 transition"
              >
                Voir les commandes
              </Link>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-dark-light rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Commandes récentes</h2>
            <Link to="/admin/orders" className="text-primary hover:text-primary-light font-semibold">
              Voir tout
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.recent_orders?.slice(0, 5).map((order) => (
              <div key={order.id} className="bg-dark rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">#{order.order_number}</p>
                  <p className="text-gray-400 text-sm">{order.user_name}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold text-lg">${order.total.toFixed(2)}</p>
                  <p className={`text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.recent_orders || stats.recent_orders.length === 0) && (
              <p className="text-gray-400 text-center py-8">Aucune commande récente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
