import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { newsletterAPI } from '../../services/api';
import { toast } from 'sonner';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }
    setLoading(true);
    try {
      await newsletterAPI.subscribe(email);
      toast.success('Inscription réussie à la newsletter !');
      setEmail('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-dark border-t border-dark-light mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4 font-poppins">
              <span className="text-white">KOFFI</span>
              <span className="text-primary"> SHOP</span>
            </h3>
            <p className="text-gray-400 mb-4">
              Votre destination pour la mode moderne et élégante. Qualité premium, style incomparable.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-poppins">Liens Rapides</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="text-gray-400 hover:text-primary transition">
                  Boutique
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-primary transition">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-primary transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-primary transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-poppins">Service Client</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/orders" className="text-gray-400 hover:text-primary transition">
                  Mes Commandes
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-primary transition">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-primary transition">
                  Conditions d'utilisation
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-poppins">Newsletter</h4>
            <p className="text-gray-400 mb-4 text-sm">
              Inscrivez-vous pour recevoir nos offres exclusives
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-light text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-dark font-semibold py-2 rounded-lg hover:bg-primary-light transition disabled:opacity-50"
                data-testid="newsletter-subscribe-btn"
              >
                {loading ? 'Inscription...' : "S'inscrire"}
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 pt-8 border-t border-dark-light">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="w-4 h-4 text-primary" />
              <span>contact@koffishop.com</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Phone className="w-4 h-4 text-primary" />
              <span>+243 999 999 999</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Kinshasa, RDC</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-dark-light text-center text-gray-400 text-sm">
          <p>&copy; 2025 KOFFI SHOP. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
