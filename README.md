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
- `src/App.css` : Styles globaux avec design responsive et animations.

## Architecture Technique
- **Front-end** : React pour la construction de l’interface, `react-router-dom` pour la navigation, `react-feather` pour les icônes.
- **Back-end** : API REST avec Express (port 3000) pour l’authentification et la gestion des scans, FastAPI (port 8000) pour la prédiction des empreintes.
- **Base de données** : MySQL (présumé) pour stocker les utilisateurs et les scans.
- **Sécurité** : Authentification via JWT (JSON Web Token), gestion des consentements RGPD et cookies.
- **Accessibilité** : Efforts initiaux pour respecter WCAG 2.1 A/AA (attributs `alt`, étiquettes ARIA, navigation au clavier).

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
- Consentement pour les cookies et RGPD avec modales accessibles.
- Demande d’accès à la localisation avec gestion des erreurs.
- Gestion de la provenance des photos (métadonnées ignorées si téléchargées).
- Affichage des résultats (espèce, date, localisation) avec animation de fade-in.
- Interface admin pour monitoring (nombre de scans, dernier scan).

## Accessibilité (WCAG 2.1 A/AA)
- Ajout d’attributs `alt` pour les images.
- Utilisation d’étiquettes ARIA pour les modales et boutons.
- Navigation au clavier possible (tabulation).
- Contraste suffisant (par exemple, texte blanc sur fond vert #31C48D avec un contraste de 4.54:1).
- **Limites** : Compatibilité complète avec les lecteurs d’écran à améliorer, navigation au clavier à optimiser pour les modales.

## Limites
- L’analyse des empreintes est simulée (choix aléatoire d’espèces). L’intégration d’une IA réelle via FastAPI est prévue.
- Accessibilité : Bien que des bases soient posées (ARIA, contraste), des améliorations sont nécessaires pour une conformité totale à WCAG 2.1 AA.
- Documentation : Documentation technique succincte, à compléter avec des diagrammes (architecture, flux de données).

## Lancement en Docker (Optionnel)
1. Construisez l’image : `docker build -t wildlens-frontend .`
2. Lancez le conteneur : `docker run -p 3001:3001 wildlens-frontend`

## Auteurs
- Christemmanuella