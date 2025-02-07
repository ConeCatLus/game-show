const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get("code");

document.getElementById("game-code").innerText = gameCode;

function joinGame() {
    const playerName = document.getElementById("player-name").value.trim();
    if (!playerName) {
        document.getElementById("status").innerText = "Please enter a name.";
        return;
    }

    socket.emit("addPlayer", playerName);
    document.getElementById("status").innerText = `Joined as ${playerName}!`;
}
