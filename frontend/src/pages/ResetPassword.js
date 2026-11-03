import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Impossible de réinitialiser le mot de passe. Demandez un nouveau lien.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-poppins mb-2">
            <span className="text-white">KOFFI</span><span className="text-primary"> SHOP</span>
          </h1>
          <p className="text-gray-400">Choisissez un nouveau mot de passe</p>
        </div>
        <div className="bg-dark-light rounded-xl p-8 shadow-glow">
          {success ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-primary">Mot de passe modifié</h2>
              <p className="text-gray-300">Votre mot de passe a été changé. Redirection vers la connexion...</p>
              <Link to="/login" className="text-primary font-semibold">Se connecter</Link>
            </div>
          ) : !token ? (
            <div className="text-center space-y-4">
              <p className="text-gray-300">Le lien de réinitialisation est incomplet ou invalide.</p>
              <Link to="/forgot-password" className="text-primary font-semibold">Demander un nouveau lien</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white font-medium mb-2">Nouveau mot de passe</label>
                <div className="relative">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" className="w-full bg-dark text-white px-4 py-3 pl-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Confirmer le mot de passe</label>
                <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-primary text-dark font-bold py-3 rounded-lg hover:bg-primary-light transition disabled:opacity-50">
                {loading ? 'Modification...' : 'Modifier mon mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
