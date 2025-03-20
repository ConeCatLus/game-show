const express = require("express");
const https = require("https");
const fs = require("fs");
const socketIo = require("socket.io");
const QRCode = require("qrcode");
const path = require("path");
const config = require("./config");
const ssid = process.argv[2] || "No network";
const password = process.argv[3] || "No password";

const app = express();

app.use(express.static("public/scripts")); // Serve scripts

app.get("/api/network", (req, res) => {
    res.json({ ssid: ssid, password: password });
});

// API route to get the server IP dynamically
app.get("/api/ip", (req, res) => {
    res.json({ ip: config.IP, port: config.PORT, clientId: config.CLIENT_ID });
});

// API to get available quizzes
app.get("/api/quizes", (req, res) => {
    const quizDir = path.join(__dirname, "public", "quizes");

    fs.readdir(quizDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Unable to fetch quizzes" });
        }

        // Return only .json files
        const quizFiles = files.filter(file => file.endsWith(".json"));
        res.json(quizFiles);
    });
});

// Load SSL certificates
const options = {
    key: fs.readFileSync("certs/key.pem"),
    cert: fs.readFileSync("certs/cert.pem")
};

const server = https.createServer(options, app); // Use HTTPS
const io = socketIo(server);


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

let questionNumber = 1;
let players = {}; // Store players as an object (dictionary)
let currentTheme = "default";

// Generate QR Code
app.get("/qr", async (req, res) => {
    try {
        const qrData = `https://${config.IP}:${config.PORT}/join`;
        const qrImage = await QRCode.toDataURL(qrData);
        res.json({ qr: qrImage });
    } catch (error) {
        console.error("Error generating QR Code:", error);
        res.status(500).json({ error: "QR generation failed" });
    }
});

app.get("/join", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "client.html"));
});

// Function to update the game state and notify clients
function setGameState(state, data = {}, CLIENT_ID = null, force = false) {
    if (CLIENT_ID) {
        io.to(CLIENT_ID).emit("newState", state, data, force); // Send to specific client
    } else {
        // Move save state to disconnect.
        io.emit("newState", state, data, force); // Send state to all clients
    }
}

// Handle connected players
io.on("connection", (socket) => {
    socket.on("connectedPlayer", () => {
        console.log("A player connected:", socket.id);
        setGameState(GameState.JOIN_SCREEN);
        setGameState(GameState.CHANGE_THEME, currentTheme);
    });

    socket.on("reconnectPlayer", (playerId) => {
        console.log("A player re-connected:", socket.id);
        if (players[playerId]) {
            players[playerId].id = socket.id; // Update the socket ID
            setGameState(GameState.CHANGE_THEME, currentTheme, socket.id);
            setGameState(players[playerId].state, players[playerId].data, socket.id, true); // Overrite client state machine
            console.log(`✅ Player ${players[playerId].name} reconnected!`);
            io.emit("updatePlayers", Object.values(players));
        }
        else {
            // A player how refreshed in the join screen
            console.log("A player connected:", socket.id);
            setGameState(GameState.JOIN_SCREEN);
            setGameState(GameState.CHANGE_THEME, currentTheme);
        }
    });

    socket.on("changeQuizTitle", (title) => {
        io.emit("setClientTitle", title);
    });

    socket.on("changeTheme", (theme) => {
        currentTheme = theme;
        setGameState(GameState.CHANGE_THEME, theme);
    });

    socket.on("hostStarted", () => {
        console.log("setGameState - Host Started");
        players = {}; // Reset players
        setGameState(GameState.JOIN_SCREEN);
    });

    socket.on("joinGame", ({ playerId, playerName }) => {
        if (!players[playerId]) {
            players[playerId] = { id: socket.id, name: playerName, score: 0, answer: "" };
        } else {
            players[playerId].id = socket.id; // Update socket ID for reconnecting players
        }
        io.emit("updatePlayers", Object.values(players));
        players[playerId].state = GameState.LIMBO_SCREEN;
        players[playerId].data = {};
        setGameState(GameState.LIMBO_SCREEN, {}, socket.id);
    });

    // Update player score on server
    socket.on("updateScore", ({ id, score, answerScore }) => {
        const playerEntry = Object.entries(players).find(([playerId, player]) => player.id === id);
        
        if (playerEntry) {
            const [playerId, player] = playerEntry;
            player.score = score;
            player.answerScore = answerScore;
            io.emit("updatePlayers", Object.values(players));
        } else {
            console.warn(`Player with socket ID ${id} not found!`);
        }
    });

    socket.on("startQuestion", (question) => {
        Object.values(players).forEach(player => {
            player.state = GameState.QUESTION_SCREEN;
            player.data = {question: question};
        });
        setGameState(GameState.QUESTION_SCREEN, {question: question});
    });
    
    socket.on("nextQuestion", () => {
        Object.values(players).forEach(player => {
            player.answer = "";
        });
        questionNumber++;
        io.emit("nextQuestion", questionNumber);
    });

    socket.on("clientAnswer", ({playerId, playerAnswer}) => {
        if (players[playerId]) {
            let playerAnswerDisplay = "";
            if (typeof playerAnswer === "object") {
                playerAnswerDisplay += Object.entries(playerAnswer).map(([key, value]) => `${key}: ${value}`).join(", ");
            } else {
                playerAnswerDisplay += playerAnswer;
            }
            console.info(`${players[playerId].name} Answered: ${playerAnswerDisplay}`);
            players[playerId].answer = playerAnswer;
            players[playerId].state = GameState.ANSWER_SCREEN;
            players[playerId].data.playerAnswer = playerAnswer; // Append player answer to data
            players[playerId].answered = true;

            io.emit("updatePlayers", Object.values(players));
            
            setGameState(GameState.ANSWER_SCREEN, players[playerId].data, players[playerId].id);
        }
        else {
            console.error("Player not found:", playerId);
        }
    });

    socket.on("sendAnswerToServer", (question) => { 
        Object.values(players).forEach(player => {
            player.state = GameState.ANSWER_SCREEN;
            player.data.showAnswer = true;
            player.answered = false;
        });       
        console.info("Correct Answer:", question.answer);
        io.emit("showAnswer", question); 
        io.emit("displayAnswerMatrix", Object.values(players)); // Send the answers to the host screen
    });

    socket.on("gameOver", (topPlayers) => {
        Object.values(players).forEach(player => {
            player.state = GameState.GAME_OVER;
            player.data = topPlayers;
        });
        setGameState(GameState.GAME_OVER, topPlayers);
    });

    socket.on("disconnect", () => {
        let disconnectedPlayerId = null;
        
        // Find the player by socket ID
        Object.keys(players).forEach((playerId) => {
            if (players[playerId].id === socket.id) {
                disconnectedPlayerId = playerId;
            }
        });

        if (disconnectedPlayerId) {
            console.log(`❌ Player ${players[disconnectedPlayerId].name} disconnected`);
            // Keep the player in the scoreboard, but mark them as disconnected
            players[disconnectedPlayerId].id = null; // Remove the active socket ID
            io.emit("updatePlayers", Object.values(players));
        }
    });
});

// Start HTTPS server
server.listen(config.PORT, () => {
    console.log(`🚀 Server running at https://${config.IP}:${config.PORT}/`);
});
