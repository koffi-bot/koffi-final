import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (error) {
      // Keep the same public message for privacy; do not reveal whether an account exists.
      setSubmitted(true);
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
          <p className="text-gray-400">Récupération de votre compte</p>
        </div>
        <div className="bg-dark-light rounded-xl p-8 shadow-glow">
          {submitted ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-white">Vérifiez votre boîte e-mail</h2>
              <p className="text-gray-300">Si cette adresse correspond à un compte KOFFI SHOP, un lien de réinitialisation vous sera envoyé. Pensez à vérifier vos courriers indésirables.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-gray-300">Saisissez l'adresse e-mail utilisée lors de votre inscription. Nous vous enverrons un lien sécurisé.</p>
              <div>
                <label className="block text-white font-medium mb-2">Adresse e-mail</label>
                <div className="relative">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="votre@email.com" className="w-full bg-dark text-white px-4 py-3 pl-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary text-dark font-bold py-3 rounded-lg hover:bg-primary-light transition disabled:opacity-50">
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary hover:text-primary-light font-semibold">Retour à la connexion</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
