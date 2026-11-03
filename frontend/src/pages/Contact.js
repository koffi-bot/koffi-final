import React, { useState } from 'react';
import { contactAPI, newsletterAPI } from '../services/api';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactAPI.sendMessage(formData);
      toast.success('Message envoyé avec succès !');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error('Veuillez entrer votre email');
      return;
    }
    setNewsletterLoading(true);
    try {
      await newsletterAPI.subscribe(newsletterEmail.trim());
      toast.success('Inscription réussie à la newsletter !');
      setNewsletterEmail('');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Échec de l'inscription");
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 font-poppins">Contactez-nous</h1>
          <p className="text-gray-400 text-lg">Nous sommes là pour vous aider</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-dark-light rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-dark" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Email</h3>
                  <a href="mailto:hoodkoffi@gmail.com" className="text-gray-400 hover:text-primary transition">hoodkoffi@gmail.com</a>
                </div>
              </div>
            </div>

            <div className="bg-dark-light rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-dark" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Téléphone</h3>
                  <a href="tel:+243838041274" className="text-gray-400 hover:text-primary transition">+243 838041274</a>
                  <p className="text-gray-400">7/7: 24/24</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-light rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-dark" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Adresse</h3>
                  <p className="text-gray-400">123 Avenue du Commerce</p>
                  <p className="text-gray-400">Kinshasa, RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-dark-light rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Envoyez-nous un message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Nom</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" data-testid="contact-name-input" />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" data-testid="contact-email-input" />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Sujet</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" data-testid="contact-subject-input" />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Message</label>
                <textarea name="message" value={formData.message} onChange={handleChange} required rows="5" className="w-full bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" data-testid="contact-message-input" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary text-dark font-bold py-3 rounded-lg hover:bg-primary-light transition disabled:opacity-50 flex items-center justify-center gap-2" data-testid="contact-submit-btn">
                <Send className="w-5 h-5" />
                {loading ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          </div>
        </div>

        {/* Newsletter: uniquement sur la page Contact */}
        <section className="max-w-3xl mx-auto mt-12 bg-dark-light rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3 font-poppins">Newsletter KOFFI SHOP</h2>
          <p className="text-gray-400 mb-6">Recevez nos actualités et nos offres directement par email.</p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Votre adresse email"
              aria-label="Votre adresse email pour la newsletter"
              required
              disabled={newsletterLoading}
              className="flex-1 min-w-0 bg-dark text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" disabled={newsletterLoading} className="bg-primary text-dark font-semibold px-6 py-3 rounded-lg hover:bg-primary-light transition disabled:opacity-50">
              {newsletterLoading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Contact;
