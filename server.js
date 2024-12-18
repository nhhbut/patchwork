const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Stockage temporaire des utilisateurs
let users = [];

// Route pour la création de compte
app.post('/signup', (req, res) => {
    const { username, age, photo, missions } = req.body;

    if (!username || !age || !photo || missions.length === 0) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    if (age < 18) {
        return res.status(400).json({ message: 'Vous devez avoir au moins 18 ans.' });
    }

    const newUser = { username, age, photo, missions };
    users.push(newUser);

    res.json({ message: `Bienvenue ${username}! Votre compte a été créé avec succès.`, user: newUser });
});

// Route pour récupérer tous les utilisateurs
app.get('/users', (req, res) => {
    res.json(users);
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
