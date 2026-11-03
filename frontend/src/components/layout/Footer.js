import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => (
  <footer className="bg-dark border-t border-dark-light mt-16">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <a href="https://www.snapchat.com/" target="_blank" rel="noopener noreferrer" aria-label="Snapchat KOFFI SHOP" className="text-gray-400 hover:text-primary transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M12 2.2c-2.5 0-4.2 1.9-4.2 4.7 0 .8.1 1.6.2 2.3-.3.2-.8.3-1.3.1-.4-.2-.8-.1-1 .2-.2.3-.1.7.2 1 .5.5 1.2.7 1.8.7-.4 1.1-1.3 1.9-2.7 2.4-.4.1-.6.5-.5.9.1.3.4.5.8.5.7 0 1.2.2 1.5.6.3.4.4.9.5 1.4.1.4.4.6.8.5 1.1-.2 2.1-.6 3-1.2.4-.3.8-.4 1.2-.4s.8.1 1.2.4c.9.6 1.9 1 3 1.2.4.1.7-.1.8-.5.1-.5.2-1 .5-1.4.3-.4.8-.6 1.5-.6.4 0 .7-.2.8-.5.1-.4-.1-.8-.5-.9-1.4-.5-2.3-1.3-2.7-2.4.6 0 1.3-.2 1.8-.7.3-.3.4-.7.2-1-.2-.3-.6-.4-1-.2-.5.2-1 .1-1.3-.1.1-.7.2-1.5.2-2.3 0-2.8-1.7-4.7-4.2-4.7Z" />
              </svg>
            </a>
            <a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X KOFFI SHOP" className="text-gray-400 hover:text-primary transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-7.3L5.6 22H2.4l7.3-8.4L1.8 2h6.5l4.4 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram KOFFI SHOP" className="text-gray-400 hover:text-primary transition">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4 font-poppins">Liens Rapides</h4>
          <ul className="space-y-2">
            <li><Link to="/shop" className="text-gray-400 hover:text-primary transition">Boutique</Link></li>
            <li><Link to="/about" className="text-gray-400 hover:text-primary transition">À propos</Link></li>
            <li><Link to="/contact" className="text-gray-400 hover:text-primary transition">Contact</Link></li>
            <li><Link to="/faq" className="text-gray-400 hover:text-primary transition">FAQ</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="text-white font-semibold mb-4 font-poppins">Service Client</h4>
          <ul className="space-y-2">
            <li><Link to="/orders" className="text-gray-400 hover:text-primary transition">Mes Commandes</Link></li>
            <li><Link to="/privacy" className="text-gray-400 hover:text-primary transition">Politique de confidentialité</Link></li>
            <li><Link to="/terms" className="text-gray-400 hover:text-primary transition">Conditions d'utilisation</Link></li>
          </ul>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mt-8 pt-8 border-t border-dark-light">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <a href="mailto:hoodkoffi@gmail.com" className="flex items-center gap-2 text-gray-400 hover:text-primary transition">
            <Mail className="w-4 h-4 text-primary" />
            <span>hoodkoffi@gmail.com</span>
          </a>
          <a href="tel:+2438041274" className="flex items-center gap-2 text-gray-400 hover:text-primary transition">
            <Phone className="w-4 h-4 text-primary" />
            <span>+243 8041274</span>
          </a>
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Kinshasa, RDC</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-8 pt-8 border-t border-dark-light text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} KOFFI SHOP. Tous droits réservés.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
