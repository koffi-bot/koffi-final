import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI, productAPI } from '../services/api';
import { ArrowRight, TrendingUp, Star } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        categoryAPI.getAll(),
        productAPI.getAll({ is_featured: true, limit: 8 }),
      ]);
      setCategories(categoriesRes.data);
      setFeaturedProducts(productsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dark via-dark-light to-dark py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center" data-aos="fade-up">
            <h1 className="text-5xl md:text-7xl font-bold font-poppins mb-6 leading-tight">
              <span className="text-white">L’ami de l’homme,</span>
              <br />
              <span className="text-primary">c’est les habits.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 font-roboto">
              Découvrez une collection exclusive de vêtements, chaussures et accessoires premium
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/shop"
                className="bg-primary text-dark font-bold px-8 py-4 rounded-lg hover:bg-primary-light transition shadow-glow inline-flex items-center justify-center gap-2"
                data-testid="home-shop-now-btn"
              >
                Découvrir la boutique
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/about"
                className="bg-transparent border-2 border-primary text-primary font-bold px-8 py-4 rounded-lg hover:bg-primary hover:text-dark transition"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-dark-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-4xl font-bold font-poppins text-white mb-4">
              Catégories
            </h2>
            <p className="text-gray-400 font-roboto">
              Explorez nos collections par catégorie
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/shop?category=${category.id}`}
                  className="bg-dark rounded-xl p-6 hover:bg-dark-lighter transition group"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  data-testid={`category-card-${category.slug}`}
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="text-white font-semibold text-center group-hover:text-primary transition">
                    {category.name}
                  </h3>
                  <p className="text-gray-400 text-xs text-center mt-1">
                    {category.products_count} produits
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-dark">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12" data-aos="fade-up">
            <div>
              <h2 className="text-4xl font-bold font-poppins text-white mb-2 flex items-center gap-2">
                <TrendingUp className="text-primary" />
                Produits Vedettes
              </h2>
              <p className="text-gray-400 font-roboto">
                Nos meilleures ventes et nouveautés
              </p>
            </div>
            <Link
              to="/shop"
              className="text-primary hover:text-primary-light font-semibold flex items-center gap-2"
            >
              Voir tout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="bg-dark-light rounded-xl overflow-hidden group hover:shadow-glow transition"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  data-testid={`product-card-${product.slug}`}
                >
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {product.discount_percentage > 0 && (
                      <span className="absolute top-4 right-4 bg-primary text-dark font-bold px-3 py-1 rounded-full text-sm">
                        -{product.discount_percentage}%
                      </span>
                    )}
                    {product.is_new && (
                      <span className="absolute top-4 left-4 bg-white text-dark font-bold px-3 py-1 rounded-full text-sm">
                        NOUVEAU
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2 line-clamp-1 group-hover:text-primary transition">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="text-white text-sm font-medium">{product.rating}</span>
                      </div>
                      <span className="text-gray-400 text-sm">({product.reviews_count})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-bold text-xl">${product.price.toFixed(2)}</span>
                      {product.compare_price && (
                        <span className="text-gray-400 text-sm line-through">${product.compare_price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-dark-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center" data-aos="fade-up">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Qualité Premium</h3>
              <p className="text-gray-400">
                Des produits soigneusement sélectionnés pour vous
              </p>
            </div>
            <div className="text-center" data-aos="fade-up" data-aos-delay="100">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Livraison Rapide</h3>
              <p className="text-gray-400">
                Recevez vos commandes rapidement
              </p>
            </div>
            <div className="text-center" data-aos="fade-up" data-aos-delay="200">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Paiement Sécurisé</h3>
              <p className="text-gray-400">
                Vos transactions sont 100% sécurisées
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
