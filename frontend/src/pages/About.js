import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Truck, Shield, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <section className="bg-gradient-to-br from-dark via-dark-light to-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-poppins">
            À Propos de <span className="text-primary">KOFFI SHOP</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Votre destination pour la mode moderne et élégante depuis 2025
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-dark">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-8 text-center font-poppins">Notre Histoire</h2>
            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
              <p>
                KOFFI SHOP est né d'une passion pour la mode et d'un désir de rendre les vêtements de qualité premium accessibles à tous. Depuis notre lancement, nous nous sommes engagés à offrir une expérience d'achat exceptionnelle.
              </p>
              <p>
                Notre équipe sélectionne soigneusement chaque produit pour garantir la meilleure qualité, le meilleur style et le meilleur rapport qualité-prix. Nous croyons que chacun mérite de se sentir bien dans ses vêtements.
              </p>
              <p>
                Aujourd'hui, nous sommes fiers de servir des milliers de clients satisfaits à travers le monde, et nous continuons à évoluer pour mieux répondre à vos besoins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-dark-light">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white mb-12 text-center font-poppins">Nos Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-dark" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Qualité</h3>
              <p className="text-gray-400">
                Nous sélectionnons uniquement des produits de la plus haute qualité
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-dark" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Livraison</h3>
              <p className="text-gray-400">
                Livraison rapide et fiable dans le monde entier
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-dark" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Sécurité</h3>
              <p className="text-gray-400">
                Paiements sécurisés et protection de vos données
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-dark" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Excellence</h3>
              <p className="text-gray-400">
                Service client exceptionnel et satisfaction garantie
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 font-poppins">
            Prêt à commencer ?
          </h2>
          <p className="text-gray-300 text-xl mb-8">
            Découvrez notre collection exclusive dès maintenant
          </p>
          <Link
            to="/shop"
            className="bg-primary text-dark font-bold px-8 py-4 rounded-lg hover:bg-primary-light transition inline-block shadow-glow"
          >
            Explorer la boutique
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
