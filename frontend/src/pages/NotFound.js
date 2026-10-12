import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary mb-4 font-poppins">404</h1>
        <h2 className="text-4xl font-bold text-white mb-4">Page non trouvée</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-primary text-dark font-bold px-8 py-3 rounded-lg hover:bg-primary-light transition inline-flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          <Link
            to="/shop"
            className="bg-dark-light text-white font-bold px-8 py-3 rounded-lg hover:bg-dark-lighter transition inline-flex items-center justify-center gap-2 border border-dark-lighter"
          >
            <Search className="w-5 h-5" />
            Parcourir la boutique
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
