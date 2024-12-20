// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database'); // Import de la configuration de la base de données

const app = express();
const PORT = 3300;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route pour la création de compte
app.post('/signup', (req, res) => {
    const { username, age, photo, missions } = req.body;

    console.log('Requête de signup reçue:', req.body);

    if (!username || !age || !photo || !missions || missions.length === 0) {
        console.log('Validation échouée: Tous les champs sont obligatoires.');
        return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    if (age < 18) {
        console.log('Validation échouée: Âge inférieur à 18 ans.');
        return res.status(400).json({ message: 'Vous devez avoir au moins 18 ans.' });
    }

    // Convertir missions en chaîne de caractères JSON
    const missionsStr = JSON.stringify(missions);

    const query = `INSERT INTO users (username, age, photo, missions) VALUES (?, ?, ?, ?)`;
    db.run(query, [username, age, photo, missionsStr], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                console.log('Erreur de création de l\'utilisateur: Nom d\'utilisateur déjà pris.');
                return res.status(400).json({ message: 'Le nom d\'utilisateur est déjà pris.' });
            }
            console.error('Erreur lors de la création de l\'utilisateur:', err.message);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }

        const newUser = {
            id: this.lastID,
            username,
            age,
            photo,
            missions
        };

        console.log('Utilisateur créé avec succès:', newUser);
        res.json({ message: `Bienvenue ${username}! Votre compte a été créé avec succès.`, user: newUser });
    });
});

// Route pour récupérer tous les utilisateurs (Exemple basique)
app.get('/users', (req, res) => {
    const query = `SELECT id, username, age, photo, missions FROM users`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs:', err.message);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }

        // Convertir missions de chaîne de caractères JSON en tableau
        const users = rows.map(user => ({
            ...user,
            missions: JSON.parse(user.missions)
        }));

        res.json(users);
    });
});

// Route pour enregistrer une sélection de film (match)
app.post('/matches', (req, res) => {
    const { user_id, matched_user_id } = req.body;

    console.log('Requête de match reçue:', req.body);

    if (!user_id || !matched_user_id) {
        console.log('Validation échouée: Tous les champs sont requis.');
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    if (user_id === matched_user_id) {
        console.log('Validation échouée: L\'utilisateur essaie de se matcher lui-même.');
        return res.status(400).json({ message: 'Vous ne pouvez pas vous matcher vous-même.' });
    }

    const query = `INSERT INTO matches (user_id, matched_user_id) VALUES (?, ?)`;
    db.run(query, [user_id, matched_user_id], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                console.log('Erreur de création du match: Match déjà existant.');
                return res.status(400).json({ message: 'Match déjà existant.' });
            }
            console.error('Erreur lors de la création du match:', err.message);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }

        const newMatch = {
            id: this.lastID,
            user_id,
            matched_user_id,
            created_at: new Date().toISOString()
        };

        console.log('Match créé avec succès:', newMatch);
        res.json({ message: 'Match enregistré avec succès.', match: newMatch });
    });
});

// Route pour récupérer les matches (sélections de films) d'un utilisateur
app.get('/matches/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        console.error('ID utilisateur invalide.');
        return res.status(400).json({ message: 'ID utilisateur invalide.' });
    }

    // Modification de la requête SQL pour correspondre exactement à votre schéma
    const query = `
        SELECT DISTINCT u.id, u.username, u.photo, m.created_at
        FROM matches m
        JOIN users u ON u.id = m.matched_user_id
        WHERE m.user_id = ?
        ORDER BY m.created_at DESC
    `;

    // Ajout de logs pour le debugging
    console.log('Requête matches pour userId:', userId);

    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error('Erreur SQL lors de la récupération des matches:', err.message);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }

        console.log('Matches trouvés:', rows);
        res.json(rows);
    });
});
// Routes pour la gestion des messages (inchangées)
app.post('/messages', (req, res) => {
    const { sender_id, receiver_id, content } = req.body;

    console.log('Requête d\'envoi de message reçue:', req.body);

    if (!sender_id || !receiver_id || !content) {
        console.log('Validation échouée: Tous les champs sont requis.');
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const query = `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`;
    db.run(query, [sender_id, receiver_id, content], function(err) {
        if (err) {
            console.error('Erreur lors de l\'envoi du message:', err.message);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }

        console.log('Message envoyé avec succès. ID:', this.lastID);
        res.json({ message: 'Message envoyé avec succès.', messageId: this.lastID });
    });
});

app.get('/messages/:userId1/:userId2', (req, res) => {
    const userId1 = parseInt(req.params.userId1, 10);
    const userId2 = parseInt(req.params.userId2, 10);

    console.log(`Requête de récupération des messages entre l'utilisateur ${userId1} et ${userId2}`);

    if (isNaN(userId1) || isNaN(userId2)) {
        console.log('IDs utilisateurs invalides.');
        return res.status(400).json({ message: 'IDs utilisateurs invalides.' });
    }

    const query = `
        SELECT m.id, m.sender_id, m.receiver_id, m.content, m.timestamp, u.username AS sender_username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.timestamp ASC
    `;

    db.all(query, [userId1, userId2, userId2, userId1], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des messages:', err.message);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }

        console.log('Messages récupérés:', rows);
        res.json(rows);
    });
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});




