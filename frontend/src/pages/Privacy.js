import React from 'react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-dark py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-5xl font-bold text-white mb-8 font-poppins">Politique de Confidentialité</h1>
        <div className="bg-dark-light rounded-xl p-8 space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Collecte des informations</h2>
            <p>
              Nous collectons les informations que vous nous fournissez directement lorsque vous créez un compte, passez une commande, ou nous contactez. Ces informations peuvent inclure votre nom, adresse email, adresse de livraison, numéro de téléphone et informations de paiement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Utilisation des informations</h2>
            <p>Nous utilisons vos informations pour :</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li>Traiter et livrer vos commandes</li>
              <li>Communiquer avec vous concernant vos commandes</li>
              <li>Améliorer nos services et notre site web</li>
              <li>Vous envoyer des informations marketing (avec votre consentement)</li>
              <li>Prévenir la fraude et assurer la sécurité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Protection des données</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles contre tout accès non autorisé, modification, divulgation ou destruction. Toutes les transactions de paiement sont cryptées.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Partage des informations</h2>
            <p>
              Nous ne vendons ni ne louons vos informations personnelles à des tiers. Nous pouvons partager vos informations avec des prestataires de services tiers qui nous aident à exploiter notre site web et à traiter vos commandes (par exemple, services de livraison, processeurs de paiement).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Cookies</h2>
            <p>
              Nous utilisons des cookies pour améliorer votre expérience sur notre site. Les cookies nous aident à comprendre comment vous utilisez notre site et à personnaliser votre expérience. Vous pouvez désactiver les cookies dans les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Vos droits</h2>
            <p>Vous avez le droit de :</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li>Accéder à vos informations personnelles</li>
              <li>Corriger vos informations inexactes</li>
              <li>Demander la suppression de vos informations</li>
              <li>Vous opposer au traitement de vos informations</li>
              <li>Retirer votre consentement à tout moment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Modifications</h2>
            <p>
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page avec une date de mise à jour révisée.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à :
              <br />
              Email: privacy@koffishop.com
              <br />
              Téléphone: +243 999 999 999
            </p>
          </section>

          <div className="pt-6 border-t border-dark-lighter">
            <p className="text-sm text-gray-400">Dernière mise à jour : Janvier 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
