import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { isAdmin, logout, loading } = useAuth();
  const location = useLocation();

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
    <div className="min-h-screen bg-dark flex flex-col md:flex-row">
      <aside className="w-full md:w-64 md:min-h-screen bg-dark-light border-b md:border-b-0 md:border-r border-dark-lighter md:flex-shrink-0 md:flex md:flex-col">
        <div className="p-4 md:p-6 border-b border-dark-lighter">
          <h2 className="text-xl md:text-2xl font-bold font-poppins">
            <span className="text-white">KOFFI</span>
            <span className="text-primary"> ADMIN</span>
          </h2>
        </div>

        <nav className="p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col md:flex-row flex-shrink-0 items-center justify-center md:justify-start gap-1 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition text-xs md:text-base ${
                  isActive
                    ? 'bg-primary text-dark font-semibold'
                    : 'text-gray-400 hover:bg-dark-lighter hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 md:p-4 md:mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 md:px-4 py-3 text-red-400 hover:bg-dark-lighter rounded-lg transition text-sm md:text-base"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
