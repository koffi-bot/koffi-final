import React from 'react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-dark py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-5xl font-bold text-white mb-8 font-poppins">Conditions d'Utilisation</h1>
        <div className="bg-dark-light rounded-xl p-8 space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptation des conditions</h2>
            <p>
              En accédant et en utilisant KOFFI SHOP, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'êtes pas d'accord avec ces conditions, veuillez ne pas utiliser notre site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Utilisation du site</h2>
            <p>Vous acceptez d'utiliser notre site uniquement à des fins légales. Il est interdit de :</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li>Utiliser le site de manière frauduleuse ou illégale</li>
              <li>Tenter d'accéder à des zones non autorisées</li>
              <li>Transmettre des virus ou codes malveillants</li>
              <li>Collecter des données sans autorisation</li>
              <li>Usurper l'identité d'une autre personne</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Comptes utilisateurs</h2>
            <p>
              Pour passer des commandes, vous devez créer un compte. Vous êtes responsable de maintenir la confidentialité de votre mot de passe et de toutes les activités sous votre compte. Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Commandes et paiements</h2>
            <p>
              Toutes les commandes sont soumises à acceptation et disponibilité. Nous nous réservons le droit de refuser toute commande. Les prix sont indiqués en dollars américains et peuvent changer sans préavis. Le paiement doit être effectué au moment de la commande via les méthodes de paiement acceptées.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Livraison</h2>
            <p>
              Nous nous efforçons de livrer vos commandes dans les délais indiqués, mais nous ne pouvons garantir les dates de livraison exactes. Les risques de perte ou de dommage des produits vous sont transférés au moment de la livraison.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Retours et remboursements</h2>
            <p>
              Vous pouvez retourner la plupart des articles dans les 30 jours suivant la livraison pour un remboursement complet. Les articles doivent être dans leur état d'origine avec toutes les étiquettes attachées. Les frais de retour sont à la charge du client sauf en cas de produit défectueux ou d'erreur de notre part.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Propriété intellectuelle</h2>
            <p>
              Tout le contenu de ce site, y compris les textes, images, logos, et design, est la propriété de KOFFI SHOP et est protégé par les lois sur la propriété intellectuelle. Vous ne pouvez pas utiliser, reproduire ou distribuer ce contenu sans notre autorisation écrite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Limitation de responsabilité</h2>
            <p>
              KOFFI SHOP ne sera pas responsable des dommages indirects, accessoires ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser notre site ou nos produits. Notre responsabilité totale ne dépassera pas le montant payé pour le produit concerné.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Modifications des conditions</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur immédiatement après leur publication sur cette page. Votre utilisation continue du site après les modifications constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Loi applicable</h2>
            <p>
              Ces conditions sont régies par les lois de la République Démocratique du Congo. Tout litige sera soumis à la juridiction exclusive des tribunaux de Kinshasa.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
            <p>
              Pour toute question concernant ces conditions, veuillez nous contacter à :
              <br />
              Email: legal@koffishop.com
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

export default Terms;
