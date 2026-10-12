import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Search, ShoppingCart, User, Menu, X, Heart, LogOut } from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-dark border-b border-dark-light sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold font-poppins">
            <span className="text-white">KOFFI</span>
            <span className="text-primary"> SHOP</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Rechercher des produits..."
                className="w-full bg-dark-light text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="search-input"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Search Icon - Mobile */}
            <button
              className="md:hidden text-white hover:text-primary transition"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="w-6 h-6" />
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="text-white hover:text-primary transition relative"
                data-testid="wishlist-icon"
              >
                <Heart className="w-6 h-6" />
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="text-white hover:text-primary transition relative"
              data-testid="cart-icon"
            >
              <ShoppingCart className="w-6 h-6" />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-dark text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative group">
              <button className="text-white hover:text-primary transition" data-testid="user-menu-btn">
                <User className="w-6 h-6" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-dark-light rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-white hover:bg-dark-lighter hover:text-primary transition"
                    >
                      Mon Profil
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-white hover:bg-dark-lighter hover:text-primary transition"
                    >
                      Mes Commandes
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-white hover:bg-dark-lighter hover:text-primary transition"
                      >
                        Dashboard Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-white hover:bg-dark-lighter hover:text-primary transition flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-white hover:bg-dark-lighter hover:text-primary transition"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-2 text-white hover:bg-dark-lighter hover:text-primary transition"
                    >
                      Inscription
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-white hover:text-primary transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        {searchOpen && (
          <div className="md:hidden pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-dark-light text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 py-4 border-t border-dark-light">
          <Link to="/" className="text-white hover:text-primary transition font-medium">
            Accueil
          </Link>
          <Link to="/shop" className="text-white hover:text-primary transition font-medium">
            Boutique
          </Link>
          <Link to="/about" className="text-white hover:text-primary transition font-medium">
            À propos
          </Link>
          <Link to="/contact" className="text-white hover:text-primary transition font-medium">
            Contact
          </Link>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-light border-t border-dark-lighter">
          <nav className="flex flex-col py-4">
            <Link
              to="/"
              className="px-4 py-3 text-white hover:bg-dark-lighter hover:text-primary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link
              to="/shop"
              className="px-4 py-3 text-white hover:bg-dark-lighter hover:text-primary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Boutique
            </Link>
            <Link
              to="/about"
              className="px-4 py-3 text-white hover:bg-dark-lighter hover:text-primary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              À propos
            </Link>
            <Link
              to="/contact"
              className="px-4 py-3 text-white hover:bg-dark-lighter hover:text-primary transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
