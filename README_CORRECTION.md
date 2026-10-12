# KOFFI SHOP — Correction de l'ajout de produits (admin)

## Ce qui a été réellement vérifié (et ce qui ne l'a pas été)

Cette correction a été préparée **par analyse statique du code**. L'environnement de travail n'avait
ni MongoDB, ni FastAPI, ni accès réseau : **le backend et le frontend n'ont pas pu être lancés**,
et le défaut exact n'a donc **pas pu être reproduit à l'exécution**.

Ce qui a été confirmé par lecture du code :

- La route `POST /api/products`, le modèle `ProductCreate` et l'insertion MongoDB sont cohérents
  avec ce qu'envoie `productAPI.create` (URL, méthode, token Bearer, format JSON).
- Tous les imports frontend et backend existent et sont déclarés dans `package.json` / `requirements.txt`.

Défauts réels trouvés qui font échouer l'ajout **ou le font échouer en silence** :

1. `pages/admin/Products.js` (`handleSubmit`) : le `catch` affichait toujours « Erreur lors de
   l'enregistrement », sans jamais montrer la vraie cause (401, 403, 422, serveur injoignable, CORS).
2. `components/admin/AdminLayout.js` : `loading` n'était pas pris en compte. Au rechargement de
   `/admin/products`, `isAdmin` est faux le temps que `getMe()` réponde, et l'admin était renvoyé vers `/`.
3. Catégorie vide : si le seed n'a pas été lancé, la liste est vide, `category_id` reste `''` et le
   formulaire ne peut pas aboutir. Le backend n'acceptait d'ailleurs pas de vérifier la catégorie.
4. CORS : `CORS_ORIGINS` n'autorise que `localhost:3000/5173/8000`. Avec `127.0.0.1:3000` ou une IP
   locale, le navigateur bloque la requête (« Network Error »).
5. Seul `admin@koffishop.com` (créé par `seed_data.py`) a le rôle admin. Un compte créé via
   « Inscription » est `customer` et reçoit un 403 sur la création.

Pour identifier lequel s'applique chez vous : DevTools > Réseau > requête `products`, voir le code
HTTP. Avec cette version, le message d'erreur affiché dans l'interface le dit directement.

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `frontend/src/pages/admin/Products.js` | Vraies erreurs affichées (401/403/422/réseau) + `console.error`; confirmation uniquement après succès; liste rechargée depuis le serveur; validation prix/stock; `compare_price` vide envoyé en `null`; anti double-clic; message si aucune catégorie; image absente sans erreur |
| `frontend/src/components/admin/AdminLayout.js` | Attend la fin de la vérification du token avant de rediriger |
| `frontend/src/services/api.js` | URL backend par défaut `http://localhost:8001` si `.env` absent |
| `backend/server.py` | Création refusée avec message clair si la catégorie n'existe pas; `MONGO_URL` avec valeur par défaut; CORS autorise aussi `localhost`/`127.0.0.1` sur tout port |
| `backend/models.py` | `ProductCreate` valide nom non vide, prix >= 0, stock >= 0, réduction 0-100 (le modèle de réponse `Product` reste inchangé) |

Authentification, rôles, routes, design et dépendances : **inchangés**.

## Tests

Exécutés :
- `python -m py_compile` sur tous les fichiers backend : OK.
- Analyse de syntaxe JSX (esbuild) des 3 fichiers frontend modifiés : OK.
- Vérification que tous les imports (npm et locaux) se résolvent : OK.

**Non exécutés (à faire sur Windows)** : démarrage backend/frontend, création, modification et
suppression d'un produit, persistance après rechargement.

## Lancement sous Windows

Prérequis : MongoDB démarré (service Windows ou `mongod`), Python 3.10+, Node 16+.

Backend (PowerShell) :
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      (seulement si vous n'avez pas déjà un .env)
python seed_data.py         (une seule fois : crée l'admin et les catégories, n'écrase rien d'existant)
python server.py
```

Frontend (second terminal) :
```
cd frontend
copy .env.example .env      (seulement si vous n'avez pas déjà un .env)
npm install
npm start
```

Ouvrir http://localhost:3000, se connecter avec `admin@koffishop.com` / `admin123` (compte du seed,
à changer en production), puis Admin > Produits > Ajouter un produit.

## Points non corrigés volontairement

- `backend/auth.py` lit `SECRET_KEY` avant que `server.py` n'appelle `load_dotenv()` : la valeur du
  `.env` est donc ignorée (la valeur par défaut du code est utilisée). Cela ne bloque pas l'ajout de
  produits. Pour y remédier, ajouter `from dotenv import load_dotenv; load_dotenv()` en haut de
  `auth.py` ; les utilisateurs devront alors se reconnecter si votre clé diffère de la valeur par défaut.
- Les images se saisissent toujours par URL. La route `/api/upload` existe mais n'est pas branchée dans
  le formulaire, et elle renvoie une URL relative (`/uploads/...`) qu'il faudrait préfixer par l'URL du backend.
- Les fichiers `.env` réels ne sont pas dans cette archive : conservez les vôtres.
