/* Show game over screen - Triggered by move to next button if last question */
function showGameOverScreen() {
    // Show the game-over container
    document.getElementById("game-over-container").style.display = "flex";
    
    socket.emit("gameOver", topPlayers);
}