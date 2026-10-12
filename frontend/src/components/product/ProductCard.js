import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { wishlistAPI } from '../../services/api';
import { toast } from 'sonner';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter');
      return;
    }
    try {
      await wishlistAPI.addToWishlist(product.id);
      toast.success('Ajouté aux favoris');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  return (
    <div className="bg-dark-light rounded-xl overflow-hidden group hover:shadow-glow transition" data-testid={`product-card-${product.id}`}>
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
        {product.is_new && (
          <span className="absolute top-4 left-4 bg-white text-dark font-bold px-3 py-1 rounded-full text-sm">
            NOUVEAU
          </span>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleAddToCart}
            className="bg-primary text-dark p-3 rounded-full hover:bg-primary-light transition"
            data-testid={`add-to-cart-${product.id}`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
          <button
            onClick={handleAddToWishlist}
            className="bg-white text-dark p-3 rounded-full hover:bg-gray-200 transition"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-white font-semibold mb-2 line-clamp-1 group-hover:text-primary transition">
            {product.name}
          </h3>
        </Link>
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
        {product.stock < 10 && product.stock > 0 && (
          <p className="text-orange-400 text-xs mt-2">Seulement {product.stock} en stock !</p>
        )}
        {product.stock === 0 && (
          <p className="text-red-400 text-xs mt-2">Rupture de stock</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
