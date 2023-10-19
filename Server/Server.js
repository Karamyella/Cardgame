// Imports
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

// Initialisierung d. Servers
const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 8080;

// Filepath für Html-Datei.
const filepath = join(join(__dirname, '/../public'));
app.use(express.static(filepath));

// Test-Seite unter 'localhost:8080/test' aufrufbar.
app.get('/test', (req, res) => {
    res.sendFile(join(__dirname, '/../public/dummy.html'));
});

// Responses auf Aktionen der User.
io.on('connection', (socket) => {
    console.log('User \'' + socket.id + '\' connected.');
    socket.on('work', () => {
        console.log('User \'' + socket.id + '\': So Multiplayer works?');
    });
    socket.on('yes', () => {
        console.log('User \'' + socket.id + '\': Apparently!');
    });

    socket.on('disconnect', () => {
        console.log('User \'' + socket.id + '\' disconnected.');
    });
});

// DEBUG-Stuff
server.listen(port, () => {
    console.log(`Server is up on port ${port}.`);
});


// Baut Verbindung zur Datenbank auf.
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'me',
    password: 'yes',
    database: 'cardgamedb'
});

// DEBUG-Stuff
connection.connect((error) => {
    if (error) throw error;
    console.log('Database-Connection works.');

    const sql = "SELECT * FROM card";

    connection.query(sql, (error, result) => {
        if (error) throw error;
        console.log(result[0]);
    })
});