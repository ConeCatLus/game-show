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

    const playerListElement = document.getElementById("player-list");
    playerListElement.innerHTML = ""; // Clear the existing list

    const highestScore = players[0]?.score || 0;

    players.forEach((player) => {
        // Create the player item
        const playerItem = document.createElement("li");
        playerItem.classList.add("player-entry");
        playerItem.textContent = `${player.name}: ${player.score}pts`;

        // Add crown for highest score
        if (player.score === highestScore && player.score > 0) {
            playerItem.textContent = `👑 ${playerItem.textContent}`;
        }

        // Add the animated score bubble (if the player recently scored)
        if (player.answerScore > 0) {
            const scoreBubble = document.createElement("span");
            scoreBubble.classList.add("score-bubble");
            scoreBubble.textContent = `+${player.answerScore}`;
            playerItem.appendChild(scoreBubble);
        }

        if (player.answered) {
            const lock = document.createElement("span");
            lock.classList.add("locked-in");
            lock.textContent = `🔒`;
            playerItem.appendChild(lock);
        }

        playerListElement.appendChild(playerItem);
    });

    // Update top players
    updateTopPlayersList(players);
}

// Function to remove bubbles
function removeScoreBubbles() {
    document.querySelectorAll(".score-bubble").forEach(bubble => {
        bubble.classList.add("fade-out");
        setTimeout(() => bubble.remove(), 500);
    });
}

// Function to remove bubbles
function removeAnswerLock() {
    document.querySelectorAll(".locked-in").forEach(lock => {
        lock.classList.add("fade-out");
        setTimeout(() => lock.remove(), 500);
    });
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
