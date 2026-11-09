import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Tags, Image as ImageIcon, Upload, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { categoryAPI, uploadAPI } from '../../services/api';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '');

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', image: '', icon: '' });

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Chargement des catégories impossible :', error);
      toast.error('Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setSelectedImage(null);
    setForm({ name: '', description: '', image: '', icon: '' });
    setShowForm(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setSelectedImage(null);
    setForm({
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      icon: category.icon || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingCategory(null);
    setSelectedImage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const name = form.name.trim();
    if (!name) {
      toast.error('Le nom de la catégorie est obligatoire');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.image.trim();
      if (selectedImage) {
        const uploadResponse = await uploadAPI.uploadFile(selectedImage);
        const uploadedPath = uploadResponse.data?.url;
        if (!uploadedPath) throw new Error("Le serveur n'a pas retourné l'adresse de l'image");
        imageUrl = /^https?:\/\//i.test(uploadedPath)
          ? uploadedPath
          : `${BACKEND_URL}${uploadedPath.startsWith('/') ? '' : '/'}${uploadedPath}`;
      }

      const payload = {
        name,
        description: form.description.trim() || null,
        image: imageUrl || null,
        icon: form.icon.trim() || null,
      };

      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, payload);
        toast.success('Catégorie modifiée');
      } else {
        await categoryAPI.create(payload);
        toast.success('Catégorie créée');
      }
      setShowForm(false);
      setEditingCategory(null);
      setSelectedImage(null);
      await loadCategories();
    } catch (error) {
      console.error('Enregistrement de la catégorie impossible :', error);
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : error.message || 'Erreur lors de l’enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const count = Number(category.products_count || 0);
    if (count > 0) {
      toast.error('Cette catégorie contient encore des produits. Déplacez-les ou supprimez-les avant de la retirer.');
      return;
    }

    const result = await Swal.fire({
      title: 'Supprimer cette catégorie ?',
      text: `La catégorie « ${category.name} » sera supprimée. Cette action est irréversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00ff66',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      background: '#171717',
      color: '#ffffff',
    });
    if (!result.isConfirmed) return;

    try {
      await categoryAPI.delete(category.id);
      toast.success('Catégorie supprimée');
      await loadCategories();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Impossible de supprimer cette catégorie');
      await loadCategories();
    }
  };

  const inputClass = 'w-full rounded-lg border border-dark-lighter bg-dark px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Tags className="h-7 w-7 text-primary" />
            <h1 className="font-poppins text-2xl font-bold text-white sm:text-3xl">Catégories</h1>
          </div>
          <p className="text-sm text-gray-400">Organisez les collections de votre boutique KOFFI SHOP.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-dark transition hover:bg-primary-light sm:w-auto">
          <Plus className="h-5 w-5" /> Ajouter une catégorie
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-dark-lighter bg-dark-light p-4">
        <p className="text-sm text-gray-300"><span className="font-bold text-primary">{categories.length}</span> catégorie(s)</p>
        <p className="mt-1 text-xs text-gray-500">Le nombre de produits est calculé à partir du catalogue réel.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Chargement des catégories...</div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-dark-lighter bg-dark-light px-6 py-12 text-center">
          <Tags className="mx-auto mb-3 h-10 w-10 text-gray-500" />
          <p className="font-semibold text-white">Aucune catégorie pour le moment</p>
          <p className="mt-1 text-sm text-gray-400">Créez votre première catégorie pour organiser les produits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const count = Number(category.products_count || 0);
            return (
              <article key={category.id} className="overflow-hidden rounded-xl border border-dark-lighter bg-dark-light">
                <div className="flex h-40 items-center justify-center bg-dark">
                  {category.image ? (
                    <img src={category.image.startsWith('/') ? `${BACKEND_URL}${category.image}` : category.image} alt={category.name} className="h-full w-full object-contain p-3" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      {category.icon ? <span className="text-5xl">{category.icon}</span> : <ImageIcon className="h-10 w-10" />}
                      <span className="text-xs">Aucune image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-bold text-white">{category.name}</h2>
                      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-400">{category.description || 'Aucune description'}</p>
                    </div>
                    {category.icon && <span className="text-2xl" aria-label="Icône">{category.icon}</span>}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                    <Package className="h-4 w-4 text-primary" />
                    <span><strong className="text-primary">{count}</strong> produit(s)</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-dark-lighter pt-4">
                    <button type="button" onClick={() => openEdit(category)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2.5 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/20">
                      <Edit className="h-4 w-4" /> Modifier
                    </button>
                    <button type="button" onClick={() => handleDelete(category)} disabled={count > 0} title={count > 0 ? 'Cette catégorie contient des produits' : 'Supprimer la catégorie'} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                      <Trash2 className="h-4 w-4" /> Retirer
                    </button>
                  </div>
                  {count > 0 && <p className="mt-2 text-xs text-gray-500">Pour la retirer, déplacez ou supprimez d’abord ses produits.</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="category-form-title" className="my-3 w-full max-w-xl rounded-xl border border-dark-lighter bg-dark-light p-4 shadow-2xl sm:my-8 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="category-form-title" className="text-xl font-bold text-white">{editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</h2>
              <button type="button" onClick={closeForm} disabled={saving} aria-label="Fermer" className="rounded-lg p-2 text-gray-400 hover:bg-dark hover:text-white disabled:opacity-50"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="category-name" className="mb-2 block text-sm font-medium text-white">Nom *</label>
                <input id="category-name" required maxLength={80} value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} placeholder="Ex. Sneakers" />
              </div>
              <div>
                <label htmlFor="category-description" className="mb-2 block text-sm font-medium text-white">Description</label>
                <textarea id="category-description" rows={3} maxLength={500} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className={inputClass} placeholder="Décrivez cette collection..." />
              </div>
              <div>
                <label htmlFor="category-icon" className="mb-2 block text-sm font-medium text-white">Icône ou emoji (facultatif)</label>
                <input id="category-icon" maxLength={12} value={form.icon} onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))} className={inputClass} placeholder="Ex. 👟" />
              </div>
              <div>
                <label htmlFor="category-image" className="mb-2 block text-sm font-medium text-white">Image de la catégorie</label>
                <input id="category-image" type="url" value={form.image} onChange={(e) => { setSelectedImage(null); setForm((prev) => ({ ...prev, image: e.target.value })); }} className={inputClass} placeholder="https://..." />
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-dark-lighter px-4 py-3 text-sm text-gray-300 transition hover:border-primary hover:text-primary">
                  <Upload className="h-4 w-4" /> Choisir une image depuis l’appareil
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setSelectedImage(file); setForm((prev) => ({ ...prev, image: '' })); } }} />
                </label>
                {selectedImage && <p className="mt-2 break-all text-xs text-primary">{selectedImage.name}</p>}
                {form.image && <p className="mt-2 break-all text-xs text-gray-500">Image liée par URL</p>}
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-dark-lighter pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeForm} disabled={saving} className="rounded-lg border border-dark-lighter px-5 py-3 font-semibold text-gray-300 hover:bg-dark disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-dark hover:bg-primary-light disabled:cursor-wait disabled:opacity-60">
                  {saving ? 'Enregistrement...' : editingCategory ? 'Enregistrer les modifications' : 'Créer la catégorie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
