import React, { useState, useEffect } from 'react';
import { wishlistAPI, productAPI } from '../services/api';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistAPI.getWishlist();
      setWishlist(response.data);

      // Fetch product details for each wishlist item
      const productPromises = response.data.map((item) =>
        productAPI.getOne(item.product_id)
      );
      const productResponses = await Promise.all(productPromises);
      setProducts(productResponses.map((res) => res.data));
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlist(wishlist.filter((item) => item.product_id !== productId));
      setProducts(products.filter((product) => product.id !== productId));
      toast.success('Retiré des favoris');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <Heart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Votre liste de favoris est vide</h2>
          <p className="text-gray-400 mb-8">Ajoutez des produits à vos favoris pour les retrouver facilement</p>
          <Link
            to="/shop"
            className="bg-primary text-dark font-bold px-8 py-3 rounded-lg hover:bg-primary-light transition inline-block"
          >
            Découvrir la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8 font-poppins">Mes Favoris</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-dark-light rounded-xl overflow-hidden group" data-testid={`wishlist-item-${product.id}`}>
              <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-square">
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
              </Link>
              <div className="p-4">
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-white font-semibold mb-2 line-clamp-1 group-hover:text-primary transition">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-bold text-xl">${product.price.toFixed(2)}</span>
                  {product.compare_price && (
                    <span className="text-gray-400 text-sm line-through">${product.compare_price.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-primary text-dark font-semibold py-2 rounded-lg hover:bg-primary-light transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Ajouter
                  </button>
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
