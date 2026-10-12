import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Comment passer une commande ?',
      answer: 'Pour passer une commande, parcourez notre boutique, ajoutez les produits souhaités à votre panier, puis procédez au paiement. Vous recevrez une confirmation par email.'
    },
    {
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons Orange Money, M-Pesa, Airtel Money et les cartes bancaires. Tous les paiements sont 100% sécurisés.'
    },
    {
      question: 'Quels sont les délais de livraison ?',
      answer: 'Les délais de livraison varient selon votre localisation. En général, comptez 3-5 jours ouvrables pour Kinshasa et 5-10 jours pour les autres régions.'
    },
    {
      question: 'Puis-je retourner un produit ?',
      answer: 'Oui, vous avez 30 jours pour retourner un produit dans son état d\'origine avec l\'emballage. Les frais de retour sont à votre charge sauf en cas de produit défectueux.'
    },
    {
      question: 'Comment suivre ma commande ?',
      answer: 'Après avoir passé votre commande, connectez-vous à votre compte et accédez à "Mes Commandes" pour suivre l\'état de votre commande en temps réel.'
    },
    {
      question: 'Les frais de livraison sont-ils inclus ?',
      answer: 'Les frais de livraison sont de $10. Cependant, la livraison est gratuite pour toute commande supérieure à $100.'
    },
    {
      question: 'Comment contacter le service client ?',
      answer: 'Vous pouvez nous contacter par email à contact@koffishop.com, par téléphone au +243 999 999 999 ou via notre formulaire de contact. Nous répondons du lundi au vendredi de 9h à 18h.'
    },
    {
      question: 'Les produits sont-ils authentiques ?',
      answer: 'Absolument. Tous nos produits sont 100% authentiques et proviennent directement de nos fournisseurs officiels. Nous garantissons la qualité de chaque article.'
    },
    {
      question: 'Puis-je modifier ma commande ?',
      answer: 'Vous pouvez modifier votre commande dans les 2 heures suivant sa validation en contactant notre service client. Après ce délai, la commande est en préparation et ne peut plus être modifiée.'
    },
    {
      question: 'Proposez-vous des réductions ?',
      answer: 'Oui ! Nous offrons régulièrement des promotions et réductions. Inscrivez-vous à notre newsletter pour recevoir nos offres exclusives.'
    }
  ];

  const toggleFAQ = (question) => {
    setOpenIndex(openIndex === question ? null : question);
  };

  return (
    <div className="min-h-screen bg-dark py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 font-poppins">FAQ</h1>
          <p className="text-gray-400 text-lg">Questions Fréquemment Posées</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="bg-dark-light rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFAQ(faq.question)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-dark-lighter transition"
              >
                <h3 className="text-white font-semibold text-lg pr-4">{faq.question}</h3>
                {openIndex === faq.question ? (
                  <ChevronUp className="w-6 h-6 text-primary flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-primary flex-shrink-0" />
                )}
              </button>
              {openIndex === faq.question && (
                <div className="px-6 pb-6">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-dark-light rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Vous ne trouvez pas votre réponse ?</h2>
          <p className="text-gray-400 mb-6">Notre équipe est là pour vous aider</p>
          <a
            href="/contact"
            className="bg-primary text-dark font-bold px-8 py-3 rounded-lg hover:bg-primary-light transition inline-block"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
