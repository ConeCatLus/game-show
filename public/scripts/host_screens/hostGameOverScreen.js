/* Show game over screen - Triggered by move to next button if last question */
function showGameOverScreen() {
    // Show the game-over container
    document.getElementById("game-over-container").classList.add("active");
    socket.emit("gameOver", topPlayers);
}