// Set screen -> LIMBO_SCREEN
function showLimboScreen() {
    clearScreen()
    updateStatus("Joined game as " + "<strong>"+playerName+"</strong>");
    document.getElementById("display-limbo-message").innerText = "Waiting for host to start...";
    document.getElementById("limbo-container").style.display = "block";
}