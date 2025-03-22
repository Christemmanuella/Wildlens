const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json()); // Middleware pour parser les requêtes JSON
app.use(cors()); // Middleware pour éviter les erreurs CORS

// Récupération des variables d'environnement pour la connexion MySQL
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

// Vérification des variables d'environnement
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT) {
  console.error('Erreur : Variables MySQL manquantes.');
  process.exit(1); // Arrête l'exécution si les variables sont manquantes
}

// Connexion à la base de données MySQL
const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT
});

// Vérification de la connexion MySQL
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion MySQL :', err.message);
    process.exit(1);
  }
  console.log('Connecté à MySQL');
});

// Route d'inscription
app.post('/signup', async (req, res) => {
  console.log('Requête reçue sur /signup :', req.body);

  // Récupération des données envoyées par le client
  const { surname, firstname, email, password, confirmpassword } = req.body;

  // Vérification des champs requis
  if (!surname || !firstname || !email || !password || !confirmpassword) {
    console.log("Champs requis manquants");
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  // Vérification si les mots de passe correspondent
  if (password !== confirmpassword) {
    console.log("Les mots de passe ne correspondent pas");
    return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
  }

  console.log("Vérification si l'email existe...");
  const checkUserQuery = 'SELECT id FROM signup WHERE email = ?';

  // Vérification si l'email est déjà utilisé
  db.query(checkUserQuery, [email], async (err, results) => {
    if (err) {
      console.error('Erreur MySQL (Vérif email) :', err.message);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length > 0) {
      console.log("Email déjà utilisé");
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    try {
      console.log("Hachage du mot de passe...");
      const hashedPassword = await bcrypt.hash(password, 10); // Hachage du mot de passe

      console.log("Insertion en base de données...");
      const query = 'INSERT INTO signup (surname, firstname, email, password) VALUES (?, ?, ?, ?)';

      // Insertion des données de l'utilisateur dans la base
      db.query(query, [surname, firstname, email, hashedPassword], (err) => {
        if (err) {
          console.error('Erreur MySQL (Insertion) :', err.message);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        console.log("Utilisateur enregistré !");
        res.status(201).json({ message: 'Utilisateur enregistré avec succès' });
      });
    } catch (error) {
      console.error('Erreur Bcrypt :', error.message);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }
  });
});

// Route de connexion
app.post('/login', (req, res) => {
  console.log('Requête reçue sur /login :', req.body);

  // Récupération des données envoyées
  const { email, password } = req.body;

  // Vérification des champs requis
  if (!email || !password) {
    console.log("Champs manquants");
    return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
  }

  const query = 'SELECT * FROM signup WHERE email = ?';

  // Recherche de l'utilisateur par email
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Erreur MySQL (Login) :', err.message);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length === 0) {
      console.log("Email introuvable");
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = results[0];

    try {
      // Vérification du mot de passe
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        console.log("Mot de passe incorrect");
        return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
      }

      console.log("Connexion réussie !");
      res.status(200).json({ message: 'Connexion réussie', user });
    } catch (error) {
      console.error('Erreur Bcrypt (Login) :', error.message);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
