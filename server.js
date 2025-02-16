const express = require("express");
const https = require("https");
const fs = require("fs");
const socketIo = require("socket.io");
const QRCode = require("qrcode");
const path = require("path");
const IP = require("ip").address();
const PORT = process.env.PORT || 4000;

// Load SSL certificates
const options = {
    key: fs.readFileSync("certs/key.pem"),
    cert: fs.readFileSync("certs/cert.pem")
};

const app = express();
const server = https.createServer(options, app); // Use HTTPS
const io = socketIo(server);

let currentTheme = "default";

const GameState = Object.freeze({
    JOIN_SCREEN: "time to join",
    LIMBO_SCREEN: "waiting for host to start",
    QUESTION_SCREEN: "answer question",
    ANSWER_SCREEN: "show answer",
    GAME_OVER: "game over",
    CHANGE_THEME: "change theme"
});

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Default route to serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "game-show.html"));
});

let gameCode = Math.floor(100000 + Math.random() * 900000).toString();
let questionNumber = 1;
let players = [];

// Generate QR Code
app.get("/qr", async (req, res) => {
    try {
        const qrData = `https://${IP}:${PORT}/join?code=${gameCode}`;
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
    } else {
        io.emit("newState", state, data); // Send state to all clients
    }
}

// Handle connected players
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.emit("gameCode", gameCode);

    // Send JOIN_SCREEN when player connects
    socket.emit("newState", GameState.JOIN_SCREEN);
    setGameState(GameState.CHANGE_THEME, currentTheme);

    socket.on("changeTheme", (theme) => {
        currentTheme = theme;
        setGameState(GameState.CHANGE_THEME, theme);
    });

    socket.on("hostStarted", () => {
        console.log("setGameState - Host Started");
        players = []; // Reset players
        setGameState(GameState.JOIN_SCREEN);
    });

    socket.on("joinGame", (playerName) => {
        const player = { id: socket.id, name: playerName, score: 0, answer: "" };
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
        players.forEach(player => {
            player.answer = "";
        });
        questionNumber++;
        io.emit("nextQuestion", questionNumber);
    });

    socket.on("clientAnswer", (answer) => {
        const player = players.find(p => p.id === socket.id);
        if (player) {
            console.info(`${player.name} Answered: ${answer}`);
            player.answer = answer;
            setGameState(GameState.ANSWER_SCREEN, {}, player.id);
            io.emit("sendClientAnswerToHost", players); // Send answers to the host
        }
    });
    
    socket.on("sendAnswerToServer", (answer) => {
        console.info("Correct Answer:", answer);
        io.emit("showAnswer", answer);
        io.emit("displayAnswerMatrix", players); // Send the answers to the host screen
    });

    socket.on("gameOver", (topPlayers) => {
        setGameState(GameState.GAME_OVER, topPlayers);
    });

    socket.on("disconnect", () => {
        players = players.filter(player => player.id !== socket.id);
        io.emit("updatePlayers", players);
    });
});

// Start HTTPS server
server.listen(PORT, () => {
    console.log(`🚀 Server running at https://${IP}:${PORT}/`);
});
