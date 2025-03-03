let topPlayers = [];

// Listen for updated player list from the server
socket.on("updatePlayers", (updatedPlayers) => {
    updatePlayerList(updatedPlayers);
});

function updatePlayerList(players) {
    players.sort((a, b) => {
        if (b.score === a.score) {
            return a.name.localeCompare(b.name);
        }
        return b.score - a.score;
    });

    // Code to update the player list in the UI
    const playerListElement = document.getElementById("player-list");
    playerListElement.innerHTML = ""; // Clear the existing list

    const highestScore = players[0]?.score || 0;

    players.forEach((player) => {
        const playerItem = document.createElement("li");
        playerItem.textContent = `${player.name}: ${player.score}pts`;
        if (player.score === highestScore && player.score > 0) {
            playerItem.textContent = `👑 ${playerItem.textContent}`; // Add crown emoji to players with the highest score
        }
        playerListElement.appendChild(playerItem);
    });

    // Update the top players list in the game-over-container
    updateTopPlayersList(players);
}

function getTopPlayers() {
    const playerListElement = document.getElementById("player-list");
    const playerItems = Array.from(playerListElement.getElementsByTagName("li"));

    // Extract player data from the list items
    const players = playerItems.map(item => {
        const [name, score] = item.textContent.split(": ");
        return { name, score: parseInt(score) };
    });

    // Sort players by score in descending order
    players.sort((a, b) => b.score - a.score);

    const topPlayers = players.slice(0, 3).map((player, index) => {
        const medals = ["🥇", "🥈", "🥉"];
        const medal = medals[index] || "";
        return { ...player, medal };
    });

    return topPlayers;
}

function updateTopPlayersList() {
    topPlayers = getTopPlayers();
    const topPlayersListElement = document.getElementById("top-players-list");
    topPlayersListElement.innerHTML = ""; // Clear the existing list

    topPlayers.forEach(player => {
        const playerItem = document.createElement("li");
        playerItem.textContent = `${player.medal} ${player.name}: ${player.score} points`;
        topPlayersListElement.appendChild(playerItem);
    });
}
