// Imports
const express = require('express');
const {createServer} = require('node:http');
const {join} = require('node:path');
const {Server} = require('socket.io');

// Initialisierung d. Servers
const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 8080;

let playerList = [];

// Filepath für Html-Datei.
app.use(express.static(join(__dirname, '/../public')));

// Test-Seite unter 'localhost:8080/test' aufrufbar.
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '/../public/index.html'));
});
app.get('/test', (req, res) => {
    res.sendFile(join(__dirname, '/../public/dummy.html'));
});

// Responses auf Aktionen der User.
io.on('connection', (socket) => {
    //console.log('User \'' + socket.id + '\' connected.');
    console.log(socket);

    socket.on('playerName', (data) => {
        playerList.push({
            playerID: socket.id,
            playerName: data
        });

        console.log('playerlist: ' + playerList);
    });

    socket.on('debug', (data) => {
        socket.emit('emitDebug');
        console.log('data: ' + data);
    });

    socket.on('disconnect', () => {
        // TODO Spieler disconnected -> aus 'playerlist' entfernen + Event an restliche Spieler senden.
        const otherPlayerConnections = socket.server.sockets.sockets;

        otherPlayerConnections.forEach((socket) => {
            // TODO Für jeden Socket eine Info senden, dass Spieler X disconnected ist.
            //
        });

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

    const sql = "SELECT * FROM Card";

    connection.query(sql, (error, result) => {
        if (error) throw error;
        console.log(result[0]);
    })
});