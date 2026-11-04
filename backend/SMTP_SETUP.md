# Configuration SMTP — KOFFI SHOP

Le parcours « Mot de passe oublié » est déjà relié au backend. Cette configuration active l'envoi réel des e-mails. Aucun mot de passe SMTP ne doit être enregistré dans GitHub, dans le dépôt ou dans le fichier `.env.example`.

## 1. Choisir le fournisseur

Utiliser le service e-mail du domaine professionnel de KOFFI SHOP ou un fournisseur SMTP transactionnel. Il doit autoriser l'envoi depuis l'adresse qui sera indiquée dans `SMTP_FROM`.

Si une boîte Gmail est choisie, utiliser le serveur `smtp.gmail.com`, le port `587` avec STARTTLS, et un mot de passe d'application Google (pas le mot de passe normal du compte). La validation en deux étapes Google doit être activée pour créer un mot de passe d'application.

## 2. Variables à ajouter dans Render

Dans le service backend `koffi-final-backend`, ouvrir **Environment** et ajouter les variables suivantes. Les valeurs ci-dessous sont des exemples de configuration Gmail uniquement :

| Variable | Valeur Gmail |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USERNAME` | l'adresse Gmail complète |
| `SMTP_PASSWORD` | le mot de passe d'application Google |
| `SMTP_FROM` | la même adresse Gmail, ou un expéditeur autorisé |
| `SMTP_USE_SSL` | `false` |
| `FRONTEND_URL` | l'URL HTTPS réelle du site KOFFI SHOP |

Pour un fournisseur différent, remplacer l'hôte, le port, le mode TLS et l'expéditeur par les valeurs données par ce fournisseur. Le code utilise STARTTLS lorsque `SMTP_USE_SSL=false`, et SMTP sur SSL lorsque `SMTP_USE_SSL=true` (généralement port 465).

## 3. Déploiement et vérification

1. Enregistrer les variables dans Render. Ne pas les ajouter au dépôt GitHub.
2. Redémarrer ou redéployer le backend pour charger les nouvelles variables.
3. Depuis le site, demander un lien via « Mot de passe oublié ? » avec une adresse client existante.
4. Vérifier la boîte de réception et les courriers indésirables.
5. Ouvrir le lien reçu et confirmer que le mot de passe peut être changé. Vérifier ensuite qu'une ancienne session est refusée.

Le backend renvoie volontairement le même message public même si l'adresse n'existe pas ou si l'envoi échoue, afin de ne pas révéler quelles adresses possèdent un compte. En cas d'échec SMTP, consulter les logs du service Render.

## 4. Sécurité

- Ne jamais partager le mot de passe d'application dans une conversation ou un ticket.
- Ne jamais committer de vrais identifiants dans Git.
- Utiliser uniquement une URL HTTPS dans `FRONTEND_URL`.
- Si le secret SMTP a été exposé, le révoquer chez le fournisseur et en générer un nouveau.
