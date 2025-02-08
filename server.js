const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const QRCode = require("qrcode");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

const GameState = Object.freeze({
    JOIN_SCREEN: "time to join",
    LIMBO_SCREEN: "waiting for host to start",
    QUESTION_SCREEN: "answer question",
    ANSWER_SCREEN: "show answer",
    GAME_OVER: "game over"
});

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Default route to serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "game-show.html"));
});

let gameCode = Math.floor(100000 + Math.random() * 900000).toString();
questionNumber = 1;
let players = [];

// Generate QR Code
app.get("/qr", async (req, res) => {
    try {
        const ip = require("ip").address(); // Get local IP address
        const qrData = `http://${ip}:3000/join?code=${gameCode}`;
        const qrImage = await QRCode.toDataURL(qrData);
        res.json({ qr: qrImage });
    } catch (error) {
        console.error("Error generating QR Code:", error);
        res.status(500).json({ error: "QR generation failed" });
    }
});

app.get("/join", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "join.html"));
});

// Function to update the game state and notify clients
function setGameState(state, data = {}, clientId = null) {
    if (clientId) {
        io.to(clientId).emit("newState", state, data); // Send to specific client
    }
    else {
        io.emit("newState", state, data); // Send state to all clients
    }
}

// Handels connected players
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.emit("gameCode", gameCode);
    // socket.emit("updatePlayers", players);

    // Send JOIN_SRCEEN when player connect
    socket.emit("newState", GameState.JOIN_SCREEN);

    socket.on("hostStarted", () => {
        console.log("setGameState - Host Started");
        setGameState(GameState.JOIN_SCREEN);
    });

    socket.on("joinGame", (playerName) => {
        const player = { id: socket.id, name: playerName, score: 0 };
        players.push(player);
        io.emit("updatePlayers", players);
        setGameState(GameState.LIMBO_SCREEN, {}, player.id);
    });

    // Update player score on server
    socket.on("updateScore", ({ id, score }) => {
        let player = players.find(p => p.id === id);
        if (player) {
            player.score = score;
            io.emit("updatePlayers", players);
        }
    });

    socket.on("startQuestion", (question) => {
        setGameState(GameState.QUESTION_SCREEN, question);
    });
    
    socket.on("nextQuestion", () => {
        questionNumber++;
        io.emit("nextQuestion", questionNumber);
    });

    socket.on("clientAnswer", (answer) => {
        const player = players.find(p => p.id === socket.id);
        console.info(player.name + " Answered: " + answer);
        io.emit("sendClientAnswerToHost", player, answer);
        setGameState(GameState.ANSWER_SCREEN, {}, player.id);
    });

    socket.on("sendAnswerToServer", (answer) => {
        console.info(answer);
        socket.broadcast.emit("showAnswer", answer);
    });

    socket.on("disconnect", () => {
        players = players.filter(player => player.id !== socket.id);
        io.emit("updatePlayers", players);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://${require("ip").address()}:${PORT}/`)
});
