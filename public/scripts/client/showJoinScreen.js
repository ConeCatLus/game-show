let playerName = "";
let playerId = localStorage.getItem("playerId");

if (!playerId) {
    playerId = crypto.randomUUID(); // Generate a new unique ID
    localStorage.setItem("playerId", playerId);
    console.log("Generated new player ID:", playerId);
    socket.emit("connectedPlayer");
}
else {
    // Send playerId to the server
    console.log("Player reconnected", playerId);
    socket.emit("reconnectPlayer", playerId);
}

// Set screen -> JOIN_SCREEN
function showJoinScreen() {
    clearScreen();
    document.getElementById("player-name").value = "";
    document.getElementById("join-container").style.display = "block";
}


// Action function for onClick -> Join button
function joinGame() {
    playerName = document.getElementById("player-name").value.trim();
    if (!playerName) {
        updateStatus("Please enter a name.");
        return;
    }
    else {
        socket.emit("joinGame", {playerId, playerName});
    }   
}