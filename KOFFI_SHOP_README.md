# 🛍️ KOFFI SHOP - E-commerce Premium

## 📦 Contenu du ZIP

Ce fichier ZIP contient l'application e-commerce complète KOFFI SHOP avec :
- **Backend** : FastAPI + MongoDB
- **Frontend** : React 19 + Tailwind CSS

---

## 🚀 Installation et Démarrage

### Prérequis

- **Python 3.8+**
- **Node.js 16+** et **Yarn**
- **MongoDB** (local ou Atlas)

---

### 📁 Structure du Projet

```
KOFFI_SHOP/
├── backend/
│   ├── server.py           # API principale FastAPI
│   ├── models.py           # Modèles Pydantic
│   ├── auth.py             # Authentification JWT
│   ├── utils.py            # Fonctions utilitaires
│   ├── seed_data.py        # Script de données de démo
│   ├── requirements.txt    # Dépendances Python
│   └── .env                # Variables d'environnement
└── frontend/
    ├── src/
    │   ├── components/     # Composants React
    │   ├── pages/          # Pages de l'application
    │   ├── context/        # Contextes React
    │   ├── services/       # Services API
    │   └── App.js          # Application principale
    ├── package.json        # Dépendances Node.js
    └── .env                # Variables d'environnement
```

---

## 🔧 Configuration Backend

### 1. Extraire le ZIP
```bash
unzip KOFFI_SHOP_COMPLET.zip
cd KOFFI_SHOP
```

### 2. Configuration MongoDB

Éditez `backend/.env` :
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=koffi_shop
SECRET_KEY=votre-cle-secrete-changez-moi-en-production
CORS_ORIGINS=http://localhost:3000
```

**Pour MongoDB Atlas :**
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
```

### 3. Installer les dépendances Python
```bash
cd backend
pip install -r requirements.txt
```

### 4. Initialiser la base de données
```bash
python seed_data.py
```

Ceci créera :
- 1 compte admin : `admin@koffishop.com` / `admin123`
- 6 catégories (Vêtements, Chaussures, Montres, Sacs, Casquettes, Accessoires)
- 6 produits de démonstration

### 5. Démarrer le backend
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Le backend sera accessible sur : **http://localhost:8001**

---

## 🎨 Configuration Frontend

### 1. Configuration de l'environnement

Éditez `frontend/.env` :
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 2. Installer les dépendances
```bash
cd frontend
yarn install
```

### 3. Démarrer le frontend
```bash
yarn start
```

Le frontend sera accessible sur : **http://localhost:3000**

---

## 👤 Comptes de Test

### Compte Admin
- **Email** : admin@koffishop.com
- **Mot de passe** : admin123

### Créer un compte client
Utilisez la page d'inscription sur le site.

---

## 📋 Fonctionnalités Principales

### Pages Publiques (16)
- ✅ Accueil avec hero, catégories, produits vedettes
- ✅ Boutique avec filtres et recherche
- ✅ Page produit détaillée avec avis
- ✅ Panier dynamique
- ✅ Checkout avec 4 modes de paiement
- ✅ Connexion / Inscription
- ✅ Profil utilisateur
- ✅ Historique des commandes
- ✅ Liste de souhaits
- ✅ Contact, À propos, FAQ
- ✅ Pages légales (Politique, Conditions)
- ✅ Page 404

### Dashboard Admin (6 pages)
- ✅ Statistiques et KPIs
- ✅ Gestion produits (CRUD complet)
- ✅ Gestion commandes (statuts)
- ✅ Liste des clients
- ✅ Messagerie

---

## 🔐 Sécurité

- ✅ JWT tokens pour l'authentification
- ✅ Passwords hashés avec bcrypt
- ✅ Validation Pydantic (backend)
- ✅ CORS configuré
- ✅ Protection des routes admin
- ✅ Sanitization des inputs

---

## 🎨 Design

**Thème :**
- Fond noir (#050505)
- Vert néon (#00ff66)
- Design inspiré de Nike, Apple, Balenciaga

**Technologies UI :**
- Tailwind CSS
- Swiper (carousels)
- SweetAlert2 (modals)
- AOS (animations)
- Lucide React (icons)

---

## 💳 Paiements

4 méthodes de paiement disponibles :
1. Orange Money
2. M-Pesa
3. Airtel Money
4. Carte bancaire

**Note :** Structure prête, intégration des APIs de paiement à configurer selon vos besoins.

---

## 📱 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil actuel
- `PUT /api/auth/profile` - Mise à jour profil

### Produits
- `GET /api/products` - Liste produits (avec filtres)
- `GET /api/products/{id}` - Détail produit
- `POST /api/products` - Créer produit (Admin)
- `PUT /api/products/{id}` - Modifier produit (Admin)
- `DELETE /api/products/{id}` - Supprimer produit (Admin)

### Catégories
- `GET /api/categories` - Liste catégories
- `POST /api/categories` - Créer catégorie (Admin)

### Panier
- `GET /api/cart` - Panier utilisateur
- `POST /api/cart` - Ajouter au panier
- `PUT /api/cart/{id}` - Modifier quantité
- `DELETE /api/cart/{id}` - Retirer du panier

### Commandes
- `POST /api/orders` - Créer commande
- `GET /api/orders` - Commandes utilisateur
- `GET /api/admin/orders` - Toutes les commandes (Admin)
- `PUT /api/admin/orders/{id}/status` - Modifier statut (Admin)

### Wishlist
- `GET /api/wishlist` - Liste favoris
- `POST /api/wishlist/{product_id}` - Ajouter aux favoris
- `DELETE /api/wishlist/{product_id}` - Retirer des favoris

### Reviews
- `GET /api/products/{id}/reviews` - Avis produit
- `POST /api/reviews` - Créer avis

### Admin
- `GET /api/admin/stats` - Statistiques dashboard
- `GET /api/admin/users` - Liste utilisateurs
- `GET /api/admin/messages` - Messages contact

---

## 🐛 Dépannage

### Backend ne démarre pas
```bash
# Vérifier MongoDB
mongosh

# Réinstaller les dépendances
pip install -r requirements.txt --force-reinstall
```

### Frontend ne compile pas
```bash
# Nettoyer le cache
rm -rf node_modules
yarn cache clean
yarn install
```

### Erreur de connexion MongoDB
- Vérifiez que MongoDB est démarré
- Vérifiez la chaîne de connexion dans `.env`
- Pour Atlas, autorisez votre IP

---

## 🚀 Déploiement Production

### Backend
**Recommandations :**
- Heroku, Railway, DigitalOcean
- MongoDB Atlas pour la base de données
- Changer SECRET_KEY dans .env
- Configurer CORS_ORIGINS

### Frontend
**Recommandations :**
- Vercel, Netlify, AWS Amplify
- Build : `yarn build`
- Mettre à jour REACT_APP_BACKEND_URL

---

## 📞 Support

Pour toute question sur l'installation ou l'utilisation :

**Compte Admin par défaut :**
- Email : admin@koffishop.com
- Mot de passe : admin123

**Important :** Changez ces identifiants en production !

---

## 📄 Licence

Ce projet a été créé pour KOFFI SHOP.
Tous droits réservés © 2025

---

## 🎉 Fonctionnalités Complètes

✅ 22 pages fonctionnelles
✅ Authentication JWT complète
✅ Dashboard admin complet
✅ Panier dynamique
✅ Système de commandes
✅ Reviews et notes
✅ Wishlist
✅ Recherche et filtres avancés
✅ Design responsive
✅ Animations fluides
✅ Code optimisé et sécurisé

**Prêt pour la production ! 🚀**
