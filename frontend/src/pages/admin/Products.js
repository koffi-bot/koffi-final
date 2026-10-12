import React, { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../../services/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    compare_price: 0,
    category_id: '',
    stock: 0,
    discount_percentage: 0,
    is_featured: false,
    is_new: false,
    sizes: '',
    colors: '',
    images: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ limit: 100 });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        compare_price: product.compare_price || 0,
        category_id: product.category_id,
        stock: product.stock,
        discount_percentage: product.discount_percentage || 0,
        is_featured: product.is_featured,
        is_new: product.is_new,
        sizes: product.sizes?.join(', ') || '',
        colors: product.colors?.join(', ') || '',
        images: product.images?.join('\n') || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        compare_price: 0,
        category_id: categories[0]?.id || '',
        stock: 0,
        discount_percentage: 0,
        is_featured: false,
        is_new: false,
        sizes: '',
        colors: '',
        images: '',
      });
    }
    setShowModal(true);
  };

  const extractErrorMessage = (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    if (status === 401) return 'Session expirée : reconnectez-vous en tant qu\'administrateur';
    if (status === 403) return 'Accès refusé : ce compte n\'est pas administrateur';
    if (Array.isArray(detail)) {
      return detail
        .map((d) => `${d.loc?.[d.loc.length - 1] ?? 'champ'} : ${d.msg}`)
        .join(' | ');
    }
    if (typeof detail === 'string') return detail;
    if (!error.response) return 'Serveur injoignable (backend arrêté, mauvaise URL ou CORS)';
    return 'Erreur lors de l\'enregistrement';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const categoryId = formData.category_id || categories[0]?.id || '';
    if (!categoryId) {
      toast.error('Aucune catégorie disponible : créez d\'abord une catégorie (ou lancez seed_data.py)');
      return;
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock, 10);
    if (Number.isNaN(price) || price < 0) {
      toast.error('Prix invalide');
      return;
    }
    if (Number.isNaN(stock) || stock < 0) {
      toast.error('Stock invalide');
      return;
    }
    const comparePrice = parseFloat(formData.compare_price);
    const discount = parseInt(formData.discount_percentage, 10);

    setSubmitting(true);
    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price,
        compare_price: Number.isNaN(comparePrice) || comparePrice <= 0 ? null : comparePrice,
        category_id: categoryId,
        stock,
        discount_percentage: Number.isNaN(discount) ? 0 : discount,
        is_featured: formData.is_featured,
        is_new: formData.is_new,
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(s => s),
        colors: formData.colors.split(',').map(c => c.trim()).filter(c => c),
        images: formData.images.split('\n').map(i => i.trim()).filter(i => i),
      };

      if (editingProduct) {
        await productAPI.update(editingProduct.id, data);
      } else {
        await productAPI.create(data);
      }

      // Confirmation uniquement après succès, puis rechargement de la liste depuis le serveur
      toast.success(editingProduct ? 'Produit mis à jour' : 'Produit créé');
      setShowModal(false);
      await fetchProducts();
    } catch (error) {
      console.error('Enregistrement du produit échoué :', error.response?.status, error.response?.data || error.message);
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-400';
    if (stock < 10) return 'text-yellow-400';
    return 'text-green-400';
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action est irréversible',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00ff66',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (result.isConfirmed) {
      try {
        await productAPI.delete(id);
        toast.success('Produit supprimé');
        fetchProducts();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 font-poppins">Produits</h1>
          <p className="text-gray-400">Gérez votre catalogue de produits</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-dark font-bold px-6 py-3 rounded-lg hover:bg-primary-light transition flex items-center gap-2"
          data-testid="add-product-btn"
        >
          <Plus className="w-5 h-5" />
          Ajouter un produit
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-light text-white px-4 py-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-dark-light rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark">
            <tr>
              <th className="text-left text-white font-semibold p-4">Produit</th>
              <th className="text-left text-white font-semibold p-4">Catégorie</th>
              <th className="text-left text-white font-semibold p-4">Prix</th>
              <th className="text-left text-white font-semibold p-4">Stock</th>
              <th className="text-left text-white font-semibold p-4">Statut</th>
              <th className="text-right text-white font-semibold p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-t border-dark-lighter" data-testid={`product-row-${product.id}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images?.[0] || undefined}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <p className="text-white font-semibold">{product.name}</p>
                      <p className="text-gray-400 text-sm">{product.sold_count} vendus</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-300">
                  {categories.find(c => c.id === product.category_id)?.name || '-'}
                </td>
                <td className="p-4">
                  <p className="text-primary font-bold">${product.price.toFixed(2)}</p>
                  {product.compare_price && (
                    <p className="text-gray-400 text-sm line-through">${product.compare_price.toFixed(2)}</p>
                  )}
                </td>
                <td className="p-4">
                  <span className={`font-semibold ${getStockColor(product.stock)}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {product.is_featured && (
                      <span className="bg-primary text-dark text-xs font-bold px-2 py-1 rounded">Vedette</span>
                    )}
                    {product.is_new && (
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">Nouveau</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="text-blue-400 hover:text-blue-300 p-2"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-dark-light rounded-xl p-8 max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-white mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-white mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows="3"
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Prix</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Prix comparé</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Catégorie</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categories.length === 0 && (
                      <option value="">Aucune catégorie disponible</option>
                    )}
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Réduction (%)</label>
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-white mb-2">Tailles (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="S, M, L, XL"
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-white mb-2">Couleurs (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="Noir, Blanc, Bleu"
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-white mb-2">URLs des images (une par ligne)</label>
                  <textarea
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    rows="3"
                    className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-5 h-5"
                    />
                    Produit vedette
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_new}
                      onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                      className="w-5 h-5"
                    />
                    Nouveau produit
                  </label>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-dark font-bold py-3 rounded-lg hover:bg-primary-light transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : (editingProduct ? 'Mettre à jour' : 'Créer')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-dark text-white font-semibold py-3 rounded-lg hover:bg-dark-lighter transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
