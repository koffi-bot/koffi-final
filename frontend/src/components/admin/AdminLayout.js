import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Tags, ShoppingBag, Users, MessageSquare, LogOut } from 'lucide-react';
import NotificationBell from '../layout/NotificationBell';

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
    { path: '/admin/categories', icon: Tags, label: 'Catégories' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Commandes' },
    { path: '/admin/customers', icon: Users, label: 'Clients' },
    { path: '/admin/messages', icon: MessageSquare, label: 'Messages' },
  ];

  return (
    <div className="min-h-screen bg-dark md:flex">
      <aside className="w-full bg-dark-light border-b border-dark-lighter md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 border-b border-dark-lighter px-4 py-3 sm:px-6 md:block md:py-6">
          <Link
            to="/"
            aria-label="Retour à la page d'accueil KOFFI SHOP"
            className="text-xl font-bold font-poppins sm:text-2xl transition-opacity hover:opacity-80"
          >
            <span className="text-white">KOFFI</span>
            <span className="text-primary"> ADMIN</span>
          </Link>
          <div className="md:hidden"><NotificationBell /></div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-dark-lighter md:hidden"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>

        <div className="hidden px-4 pt-4 md:block"><NotificationBell /></div>

        <nav aria-label="Navigation administration" className="flex gap-2 overflow-x-auto overscroll-x-contain px-3 py-3 md:flex-1 md:flex-col md:overflow-x-visible md:overflow-y-auto md:px-4 md:py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition sm:min-w-[88px] sm:text-sm md:min-w-0 md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-base ${
                  isActive
                    ? 'bg-primary text-dark font-semibold'
                    : 'text-gray-400 hover:bg-dark-lighter hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden p-4 md:mt-auto md:block">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-400 transition hover:bg-dark-lighter"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="min-w-0 w-full overflow-x-hidden md:ml-64 md:w-[calc(100%-16rem)]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
