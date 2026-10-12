import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, reviewAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Star, ShoppingCart, Heart, Truck, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { wishlistAPI } from '../services/api';
import Swal from 'sweetalert2';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.getOne(id);
      setProduct(response.data);
      if (response.data.sizes?.length > 0) {
        setSelectedSize(response.data.sizes[0]);
      }
      if (response.data.colors?.length > 0) {
        setSelectedColor(response.data.colors[0]);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Produit non trouvé');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getProductReviews(id);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('Produit en rupture de stock');
      return;
    }
    addToCart(product, quantity, selectedSize, selectedColor);
  };

  const handleAddToWishlist = async () => {
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter');
      return;
    }
    try {
      await reviewAPI.create({
        product_id: product.id,
        user_id: user.id,
        user_name: user.full_name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success('Avis publié avec succès');
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-primary hover:text-primary-light mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="bg-dark-light rounded-xl overflow-hidden mb-4 aspect-square">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <button
                    key={`${product.id}-img-${idx}`}
                    onClick={() => setSelectedImage(idx)}
                    className={`rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full aspect-square object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-4 font-poppins" data-testid="product-title">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-primary text-primary'
                        : 'text-gray-400'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white">{product.rating}</span>
              <span className="text-gray-400">({product.reviews_count} avis)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</span>
              {product.compare_price && (
                <span className="text-2xl text-gray-400 line-through">${product.compare_price.toFixed(2)}</span>
              )}
              {product.discount_percentage > 0 && (
                <span className="bg-primary text-dark font-bold px-3 py-1 rounded-full">
                  -{product.discount_percentage}%
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-300 mb-6 leading-relaxed">{product.description}</p>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Taille</label>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        selectedSize === size
                          ? 'bg-primary text-dark'
                          : 'bg-dark-light text-white hover:bg-dark-lighter'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Couleur</label>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        selectedColor === color
                          ? 'bg-primary text-dark'
                          : 'bg-dark-light text-white hover:bg-dark-lighter'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">Quantité</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-dark-light text-white w-10 h-10 rounded-lg hover:bg-dark-lighter transition"
                >
                  -
                </button>
                <span className="text-white font-bold text-xl">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="bg-dark-light text-white w-10 h-10 rounded-lg hover:bg-dark-lighter transition"
                >
                  +
                </button>
                <span className="text-gray-400">({product.stock} disponibles)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-primary text-dark font-bold py-4 rounded-lg hover:bg-primary-light transition disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
              </button>
              <button
                onClick={handleAddToWishlist}
                className="bg-dark-light text-white p-4 rounded-lg hover:bg-dark-lighter transition"
              >
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Features */}
            <div className="bg-dark-light rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Truck className="text-primary w-6 h-6" />
                <span className="text-white">Livraison gratuite dès $100</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="text-primary w-6 h-6" />
                <span className="text-white">Garantie 30 jours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8 font-poppins">Avis clients</h2>

          {/* Review Form */}
          {isAuthenticated && (
            <div className="bg-dark-light rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Laisser un avis</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="block text-white mb-2">Note</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      >
                        <Star
                          className={`w-8 h-8 cursor-pointer ${
                            star <= reviewForm.rating
                              ? 'fill-primary text-primary'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-white mb-2">Commentaire</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    rows="4"
                    required
                    className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary text-dark font-bold px-6 py-3 rounded-lg hover:bg-primary-light transition"
                >
                  Publier l'avis
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-dark-light rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">{review.user_name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'fill-primary text-primary' : 'text-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
