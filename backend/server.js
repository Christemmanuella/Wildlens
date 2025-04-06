const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Augmente la limite de taille des requêtes JSON à 500 Mo
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
console.log('Limite de taille des requêtes configurée à 500mb');

app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Log des requêtes entrantes
app.use((req, res, next) => {
    console.log(`Requête reçue : ${req.method} ${req.url} - Headers:`, req.headers);
    next();
});

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT || !JWT_SECRET) {
    console.error('Erreur : Variables d’environnement manquantes.');
    process.exit(1);
}

const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion MySQL :', err.message);
        process.exit(1);
    }
    console.log('Connecté à MySQL');
});

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

app.post('/signup', async (req, res) => {
    const { surname, firstname, email, password, confirmpassword } = req.body;
    if (!surname || !firstname || !email || !password || !confirmpassword) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    if (password !== confirmpassword) {
        return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    const checkUserQuery = 'SELECT id FROM signup WHERE email = ?';
    db.query(checkUserQuery, [email], async (err, results) => {
        if (err) {
            console.error('Erreur MySQL (Signup) :', err.message);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length > 0) return res.status(400).json({ message: 'Cet email est déjà utilisé' });

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

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Requête reçue sur /login :`, { email, password });
    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    const query = 'SELECT * FROM signup WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Erreur MySQL (Login) :', err.message);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length === 0) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.log('Mot de passe incorrect');
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Connexion réussie !');
        res.status(200).json({ message: 'Connexion réussie', token });
    });
});

app.post('/scans', authenticateToken, (req, res) => {
    const { species, timestamp, imageCount, averageTime, image } = req.body;
    const userId = req.user.id;
    console.log('Données reçues pour /scans :', { species, timestamp, imageCount, averageTime, userId });

    // Convertir le format de la date pour MySQL
    const mysqlTimestamp = new Date(timestamp).toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
    console.log('Timestamp converti pour MySQL :', mysqlTimestamp);

    const query = 'INSERT INTO scans (species, timestamp, image_count, average_time, image, user_id) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [species, mysqlTimestamp, imageCount, averageTime, image, userId], (err) => {
        if (err) {
            console.error('Erreur MySQL (Scan) :', err.message);
            return res.status(500).json({ message: `Erreur lors de l’enregistrement du scan : ${err.message}` });
        }
        console.log('Scan enregistré dans la base de données');
        res.status(201).json({ message: 'Scan enregistré avec succès' });
    });
});

app.get('/scans', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM scans WHERE user_id = ?';
    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            console.error('Erreur MySQL (Get Scans) :', err.message);
            return res.status(500).json({ message: `Erreur lors de la récupération des scans : ${err.message}` });
        }
        res.status(200).json(results);
    });
});

app.use((err, req, res, next) => {
    console.error('Erreur serveur :', err.message);
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(500).json({ message: 'Erreur serveur' });
});

app.use((req, res) => {
    console.log(`Route non trouvée : ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});