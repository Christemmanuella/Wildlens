const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialisation de l'application Express
const app = express();

// Configuration de body-parser pour gérer les requêtes JSON volumineuses (images incluses)
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
console.log('Limite de taille des requêtes configurée à 500mb');

// Configuration de CORS pour permettre les requêtes du frontend
const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001'  
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`Origine non autorisée : ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware pour logger les requêtes entrantes et gérer les en-têtes CORS
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Requête reçue : ${req.method} ${req.url} - Origin: ${req.headers.origin} - Headers:`, req.headers);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Chargement des variables d'environnement
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET } = process.env;

// Vérification des variables d'environnement
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT || !JWT_SECRET) {
    console.error('Erreur : Variables d’environnement manquantes.');
    process.exit(1);
}

// Configuration de la connexion à MySQL
const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT
});

// Connexion à MySQL
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion MySQL :', err.message);
        process.exit(1);
    }
    console.log('Connecté à MySQL');
});

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log('Token manquant');
        return res.status(401).json({ message: 'Accès non autorisé' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token invalide :', err.message);
            return res.status(403).json({ message: 'Token invalide' });
        }
        req.user = user;
        next();
    });
};

// Route pour l'inscription d'un nouvel utilisateur
app.post('/signup', async (req, res) => {
    const { surname, firstname, email, password, confirmpassword } = req.body;

    // Validation des champs requis
    if (!surname || !firstname || !email || !password || !confirmpassword) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    if (password !== confirmpassword) {
        return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    // Vérification si l'email existe déjà
    const checkUserQuery = 'SELECT id FROM signup WHERE email = ?';
    db.query(checkUserQuery, [email], async (err, results) => {
        if (err) {
            console.error('Erreur MySQL (Signup) :', err.message);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hachage du mot de passe et insertion de l'utilisateur
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO signup (surname, firstname, email, password) VALUES (?, ?, ?, ?)';
        db.query(query, [surname, firstname, email, hashedPassword], (err) => {
            if (err) {
                console.error('Erreur MySQL (Signup Insert) :', err.message);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            res.status(201).json({ message: 'Utilisateur enregistré avec succès' });
        });
    });
});

// Route pour la connexion d'un utilisateur
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Requête reçue sur /login :`, { email, password });

    // Validation des champs requis
    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    // Vérification des identifiants
    const query = 'SELECT * FROM signup WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Erreur MySQL (Login) :', err.message);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.log('Mot de passe incorrect');
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Génération du token JWT
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Connexion réussie !');
        res.status(200).json({ message: 'Connexion réussie', token });
    });
});

// Route pour enregistrer un scan
app.post('/scans', authenticateToken, (req, res) => {
    const { species, timestamp, imageCount, averageTime, image, latitude, longitude } = req.body;
    const userId = req.user.id;

    // Log des données reçues
    console.log('Requête /scans reçue avec données :', { species, timestamp, imageCount, averageTime, image: image ? 'Image présente' : 'Image absente', latitude, longitude, userId });

    // Validation des champs requis
    if (!species || !timestamp || !imageCount || !averageTime) {
        console.log('Champs manquants dans la requête /scans');
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Insertion du scan dans la base de données
    const query = 'INSERT INTO scans (species, timestamp, image_count, average_time, image, latitude, longitude, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [species, timestamp, imageCount, averageTime, image || null, latitude || null, longitude || null, userId], (err) => {
        if (err) {
            console.error('Erreur MySQL (Scan) :', err.message);
            return res.status(500).json({ message: `Erreur lors de l’enregistrement du scan : ${err.message}` });
        }
        console.log('Scan enregistré dans la base de données');
        res.status(201).json({ message: 'Scan enregistré avec succès' });
    });
});

// Route pour récupérer tous les scans (filtrée par utilisateur connecté)
app.get('/scans', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const query = 'SELECT * FROM scans WHERE user_id = ? ORDER BY timestamp DESC';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur MySQL (Get Scans) :', err.message);
            return res.status(500).json({ message: `Erreur lors de la récupération des scans : ${err.message}` });
        }
        res.status(200).json(results);
    });
});

// Route pour récupérer les infos d'une espèce spécifique
app.get('/species-info/:species', (req, res) => {
    const species = req.params.species;
    const query = 'SELECT * FROM infos_especes WHERE espece = ?';
    db.query(query, [species], (err, results) => {
        if (err) {
            console.error('Erreur MySQL (Species Info) :', err.message);
            return res.status(500).json({ message: `Erreur lors de la récupération des infos de l’espèce : ${err.message}` });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Espèce non trouvée' });
        }
        res.status(200).json(results[0]);
    });
});

// Route de test pour vérifier que le backend répond
app.get('/', (req, res) => {
    console.log('Requête / reçue');
    res.status(200).json({ message: 'Backend fonctionnel' });
});

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error(`Erreur serveur [${req.method} ${req.url}]:`, err.message, err.stack);
    res.status(500).json({ message: 'Erreur serveur' });
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
    console.log(`Route non trouvée : ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route non trouvée' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});