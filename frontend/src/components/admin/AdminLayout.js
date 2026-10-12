import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { isAdmin, logout, loading } = useAuth();
  const location = useLocation();

  // Attendre la vérification du token (sinon un rechargement de page éjecte l'admin vers "/")
  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center text-gray-400">
        Chargement...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Produits' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Commandes' },
    { path: '/admin/customers', icon: Users, label: 'Clients' },
    { path: '/admin/messages', icon: MessageSquare, label: 'Messages' },
  ];

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-light border-r border-dark-lighter flex-shrink-0">
        <div className="p-6 border-b border-dark-lighter">
          <h2 className="text-2xl font-bold font-poppins">
            <span className="text-white">KOFFI</span>
            <span className="text-primary"> ADMIN</span>
          </h2>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-primary text-dark font-semibold'
                    : 'text-gray-400 hover:bg-dark-lighter hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-dark-lighter rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
