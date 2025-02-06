const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const QRCode = require("qrcode");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Default route to serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "game-show.html"));
});

let gameCode = Math.floor(100000 + Math.random() * 900000).toString();
let players = [];

// Generate QR Code
app.get("/qr", async (req, res) => {
    try {
         const ip = require("ip").address(); // Get local IP address
        const qrData = `http://${ip}:3000/join?code={gameCode}`;
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

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.emit("gameCode", gameCode);
    socket.emit("updatePlayers", players);

    socket.on("addPlayer", (playerName) => {
        const player = { id: socket.id, name: playerName, score: 0 };
        players.push(player);
        io.emit("updatePlayers", players);
    });

    socket.on("updateScore", ({ id, score }) => {
        let player = players.find(p => p.id === id);
        if (player) {
            player.score = score;
            io.emit("updatePlayers", players);
        }
    });

    socket.on("disconnect", () => {
        players = players.filter(player => player.id !== socket.id);
        io.emit("updatePlayers", players);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://${require("ip").address()}:${PORT}/`)
});
