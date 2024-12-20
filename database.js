// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Création ou ouverture de la base de données SQLite
const db = new sqlite3.Database(path.resolve(__dirname, 'matchquest.db'), (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
    }
});

// Initialisation des tables
db.serialize(() => {
    // Table des utilisateurs
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            age INTEGER NOT NULL,
            photo TEXT NOT NULL,
            missions TEXT NOT NULL
        )
    `);

    // Table des matches
    // Modifier le nom de la table de 'matche' à 'matches'
db.run(`
 CREATE TABLE IF NOT EXISTS matches (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 matched_user_id INTEGER NOT NULL,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id),
 FOREIGN KEY (matched_user_id) REFERENCES users(id),
 UNIQUE(user_id, matched_user_id) -- Empêche les doublons de match
 )
`);

    // Table des messages
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        )
    `);
});

module.exports = db;
