# WildLens Frontend

Front-end pour l'application WildLens. Interface web pour identifier les empreintes d'animaux.

## Prérequis
- Node.js 16+
- npm

## Installation
1. Clonez le repository : `git clone https://github.com/Christemmanuella/wildlens-frontend.git`
2. Installez les dépendances : `npm install`
3. Lancez l’application : `npm start`

## Structure du Projet
- `src/App.js` : Point d’entrée avec les routes principales.
- `src/Login.js` : Page de connexion.
- `src/Signup.js` : Page d’inscription.
- `src/Dashboard.js` : Page principale pour capturer/uploader et analyser les empreintes.
- `src/Admin.js` : Interface admin pour le monitoring.
- `src/components/` : Composants réutilisables (CookieConsent, LocationPermission).
- `src/LoginValidation.js` : Validation des champs de connexion.
- `src/SignupValidation.js` : Validation des champs d’inscription.

## API Utilisées
- **Back-End Express** (http://localhost:3000) :
  - `POST /login` : Connexion utilisateur (email, password).
  - `POST /signup` : Inscription utilisateur (surname, firstname, email, password).
  - `POST /scans` : Enregistrement des scans (species, timestamp, imageCount, averageTime, image, location).
  - `GET /scans` : Récupération des scans d’un utilisateur.
  - `GET /logs` : Récupération des logs (simulés).
- **Back-End FastAPI** (http://localhost:8000) :
  - `POST /predict` : Prédiction de l’empreinte (file, source, location).

## Fonctionnalités
- Authentification et inscription des utilisateurs.
- Capture ou upload d’une photo d’empreinte.
- Consentement pour les cookies et RGPD.
- Demande d’accès à la localisation.
- Gestion de la provenance des photos (métadonnées ignorées si téléchargées).
- Affichage des résultats (espèce, date, localisation).
- Interface admin pour monitoring (nombre de scans, dernier scan).

## Lancement en Docker (Optionnel)
1. Construisez l’image : `docker build -t wildlens-frontend .`
2. Lancez le conteneur : `docker run -p 3001:3001 wildlens-frontend`