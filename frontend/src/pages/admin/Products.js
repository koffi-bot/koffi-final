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

  const initialFormData = {
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
  };

  const [formData, setFormData] = useState(initialFormData);

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
      toast.error('Impossible de charger les produits');
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
        name: product.name || '',
        description: product.description || '',
        price: product.price ?? 0,
        compare_price: product.compare_price || 0,
        category_id: product.category_id || '',
        stock: product.stock ?? 0,
        discount_percentage: product.discount_percentage || 0,
        is_featured: Boolean(product.is_featured),
        is_new: Boolean(product.is_new),
        sizes: product.sizes?.join(', ') || '',
        colors: product.colors?.join(', ') || '',
        images: product.images?.join('\n') || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        ...initialFormData,
        category_id: categories[0]?.id || '',
      });
    }
    setShowModal(true);
  };

  const extractErrorMessage = (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    if (status === 401) return 'Session expirée : reconnectez-vous en tant qu’administrateur';
    if (status === 403) return 'Accès refusé : ce compte n’est pas administrateur';
    if (Array.isArray(detail)) {
      return detail
        .map((d) => `${d.loc?.[d.loc.length - 1] ?? 'champ'} : ${d.msg}`)
        .join(' | ');
    }
    if (typeof detail === 'string') return detail;
    if (!error.response) return 'Serveur injoignable (backend arrêté, mauvaise URL ou CORS)';
    return 'Erreur lors de l’enregistrement';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const categoryId = formData.category_id || categories[0]?.id || '';
    if (!categoryId) {
      toast.error('Aucune catégorie disponible : créez d’abord une catégorie');
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
        sizes: formData.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: formData.colors.split(',').map((c) => c.trim()).filter(Boolean),
        images: formData.images.split('\n').map((i) => i.trim()).filter(Boolean),
      };

      if (editingProduct) {
        await productAPI.update(editingProduct.id, data);
      } else {
        await productAPI.create(data);
      }

      toast.success(editingProduct ? 'Produit mis à jour' : 'Produit créé');
      setShowModal(false);
      await fetchProducts();
    } catch (error) {
      console.error(
        'Enregistrement du produit échoué :',
        error.response?.status,
        error.response?.data || error.message
      );
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
        await fetchProducts();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    (product.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const inputClass =
    'w-full min-w-0 rounded-lg bg-dark px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary';

  const labelClass = 'mb-2 block text-sm font-medium text-white';

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-stretch justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="mb-2 font-poppins text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Produits
          </h1>
          <p className="text-sm text-gray-400 sm:text-base">
            Gérez votre catalogue de produits
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-dark transition hover:bg-primary-light sm:w-auto sm:shrink-0"
          data-testid="add-product-btn"
        >
          <Plus className="h-5 w-5 shrink-0" />
          Ajouter un produit
        </button>
      </div>

      <div className="mb-5">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} bg-dark-light pl-10`}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {filteredProducts.length} produit(s)
        </p>
      </div>

      {/* Affichage mobile : une carte par produit */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
        {filteredProducts.map((product) => (
          <article
            key={product.id}
            data-testid={`product-row-${product.id}`}
            className="min-w-0 overflow-hidden rounded-xl border border-dark-lighter bg-dark-light p-4"
          >
            <div className="flex min-w-0 items-start gap-3">
              <img
                src={product.images?.[0] || undefined}
                alt={product.name}
                className="h-16 w-16 shrink-0 rounded-lg bg-dark object-cover sm:h-20 sm:w-20"
              />
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-semibold text-white">
                  {product.name}
                </h2>
                <p className="mt-1 break-words text-sm text-gray-400">
                  {categories.find((c) => c.id === product.category_id)?.name || 'Sans catégorie'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {product.sold_count ?? 0} vendu(s)
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-dark-lighter py-3">
              <div>
                <p className="text-xs text-gray-400">Prix</p>
                <p className="mt-1 font-bold text-primary">
                  ${Number(product.price || 0).toFixed(2)}
                </p>
                {product.compare_price > 0 && (
                  <p className="text-sm text-gray-400 line-through">
                    ${Number(product.compare_price).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Stock</p>
                <p className={`mt-1 font-semibold ${getStockColor(product.stock)}`}>
                  {product.stock ?? 0}
                </p>
              </div>
            </div>

            <div className="flex min-h-10 flex-wrap gap-2 py-3">
              {product.is_featured && (
                <span className="rounded bg-primary px-2 py-1 text-xs font-bold text-dark">
                  Vedette
                </span>
              )}
              {product.is_new && (
                <span className="rounded bg-blue-500 px-2 py-1 text-xs font-bold text-white">
                  Nouveau
                </span>
              )}
              {!product.is_featured && !product.is_new && (
                <span className="text-xs text-gray-400">Produit standard</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-dark-lighter pt-3">
              <button
                type="button"
                onClick={() => handleOpenModal(product)}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-500/10 px-3 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-500/20"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </button>
              <button
                type="button"
                onClick={() => handleDelete(product.id)}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </article>
        ))}

        {!loading && filteredProducts.length === 0 && (
          <p className="col-span-full rounded-xl bg-dark-light p-6 text-center text-gray-400">
            Aucun produit trouvé.
          </p>
        )}
      </div>

      {/* Tableau pour ordinateur et tablette */}
      <div className="hidden min-w-0 overflow-hidden rounded-xl bg-dark-light md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-dark">
              <tr>
                <th className="p-4 text-left font-semibold text-white">Produit</th>
                <th className="p-4 text-left font-semibold text-white">Catégorie</th>
                <th className="p-4 text-left font-semibold text-white">Prix</th>
                <th className="p-4 text-left font-semibold text-white">Stock</th>
                <th className="p-4 text-left font-semibold text-white">Statut</th>
                <th className="p-4 text-right font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  data-testid={`product-row-${product.id}`}
                  className="border-t border-dark-lighter"
                >
                  <td className="p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={product.images?.[0] || undefined}
                        alt={product.name}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-white">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {product.sold_count ?? 0} vendus
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">
                    {categories.find((c) => c.id === product.category_id)?.name || '-'}
                  </td>
                  <td className="whitespace-nowrap p-4">
                    <p className="font-bold text-primary">
                      ${Number(product.price || 0).toFixed(2)}
                    </p>
                    {product.compare_price > 0 && (
                      <p className="text-sm text-gray-400 line-through">
                        ${Number(product.compare_price).toFixed(2)}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`font-semibold ${getStockColor(product.stock)}`}>
                      {product.stock ?? 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {product.is_featured && (
                        <span className="rounded bg-primary px-2 py-1 text-xs font-bold text-dark">
                          Vedette
                        </span>
                      )}
                      {product.is_new && (
                        <span className="rounded bg-blue-500 px-2 py-1 text-xs font-bold text-white">
                          Nouveau
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(product)}
                        aria-label={`Modifier ${product.name}`}
                        className="rounded-lg p-2 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        aria-label={`Supprimer ${product.name}`}
                        className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    Aucun produit trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <p className="py-6 text-center text-gray-400">Chargement des produits...</p>
      )}

      {/* Formulaire adaptatif */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 sm:items-center sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setShowModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="my-3 w-full max-w-3xl min-w-0 rounded-xl bg-dark-light p-4 shadow-2xl sm:my-8 sm:p-6 lg:p-8"
          >
            <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
              <h2
                id="product-modal-title"
                className="text-xl font-bold text-white sm:text-2xl"
              >
                {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
              </h2>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowModal(false)}
                aria-label="Fermer le formulaire"
                className="shrink-0 px-2 text-3xl leading-none text-gray-400 hover:text-white disabled:opacity-50"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nom</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Prix</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Prix comparé</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Catégorie</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    className={inputClass}
                  >
                    {categories.length === 0 && (
                      <option value="">Aucune catégorie disponible</option>
                    )}
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Réduction (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Tailles (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="S, M, L, XL"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Couleurs (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="Noir, Blanc, Bleu"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>URLs des images (une par ligne)</label>
                  <textarea
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    rows={4}
                    placeholder={'https://exemple.com/image1.jpg\nhttps://exemple.com/image2.jpg'}
                    className={inputClass}
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-dark p-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-5 w-5 shrink-0 accent-green-500"
                  />
                  Produit vedette
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-dark p-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={formData.is_new}
                    onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    className="h-5 w-5 shrink-0 accent-green-500"
                  />
                  Nouveau produit
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-dark-lighter pt-4 sm:flex-row">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-lg bg-dark px-5 py-3 font-semibold text-white transition hover:bg-dark-lighter disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-primary px-5 py-3 font-bold text-dark transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                >
                  {submitting
                    ? 'Enregistrement...'
                    : editingProduct
                      ? 'Mettre à jour'
                      : 'Créer le produit'}
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
