function showGameOverScreen(topPlayers) {
    clearScreen();

    updateTopPlayersList(topPlayers);
    document.getElementById("game-over-container").style.display = "block";
}

function updateTopPlayersList(topPlayers) {
    const topPlayersListElement = document.getElementById("top-players-list");
    topPlayersListElement.innerHTML = ""; // Clear the existing list

    topPlayers.forEach(player => {
        const playerItem = document.createElement("li");
        playerItem.textContent = `${player.medal} ${player.name}: ${player.score} points`;
        topPlayersListElement.appendChild(playerItem);
    });
}