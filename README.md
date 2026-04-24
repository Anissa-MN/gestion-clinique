# GestionClinique Mada

Application de gestion clinique (backend Express + frontend React + Vite).

## Objectif
Projet pour gérer patients, rendez‑vous, consultations et utilisateurs.

## Quick start (local)
Prérequis: Node.js (>= 18), npm, MySQL.

1. Backend

```powershell
cd backend
npm install
# configurer .env (voir .env.example si fourni)
npm run dev
```

Le backend écoute par défaut sur `http://localhost:5000` et expose `/api`.

2. Frontend

```powershell
cd frontend
npm install
# pour Tailwind (optionnel si vous souhaitez utiliser les utilitaires):
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss
npx tailwindcss init -p
npm run dev
```

Le frontend Vite écoute par défaut sur `http://localhost:5173`.

## Comptes de démonstration
Le fichier `backend/schema.sql` contient seeds utiles pour le développement :
- Admin : `admin@clinique.mg` / `Admin1234!`
- Médecin : `dr.rakoto@clinique.mg` / `Medecin1234!`
- Secrétaire : `secretaire@clinique.mg` / `Secr1234!`

Gardez ces comptes pour test local; supprimez-les ou changez les mots de passe en production.

## Variables d'environnement (backend)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — configuration MySQL
- `PORT` — port du backend (défaut 5000)
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `FRONTEND_URL` (optionnel) — pour restreindre CORS en production

## Déploiement
- Utilisez GitHub (ou autre) puis déployez frontend sur Vercel/Netlify et backend sur Render/Heroku/Render.
- Ajoutez les variables d'environnement sur la plateforme cible.

## Notes
- Ce dépôt contient des pages déjà fonctionnelles : Dashboard, Patients, Consultations, Rendez‑vous, Utilisateurs.
- Par défaut le frontend consomme `/api` (proxy). En production, configurez `FRONTEND_URL` et le `baseURL` si besoin.

