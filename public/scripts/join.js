const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get("code");
let playerName = "";
let prevAnswer = "";

document.getElementById("game-code").innerText = gameCode;

function joinGame() {
    playerName = document.getElementById("player-name").value.trim();
    if (!playerName) {
        document.getElementById("status").innerText = "Please enter a name.";
        return;
    }
    else {
        socket.emit("joinGame", playerName);
    }

    document.getElementById("status").innerText = `Joined as ${playerName}!`;
}

function submitAnswer()
{
    prevAnswer = document.getElementById("client-answer").value.trim();
    if (!prevAnswer) {
        document.getElementById("status").innerText = "Please enter an answer.";
        return;
    }
    else {
        socket.emit("clientAnswer", prevAnswer);
    }

    document.getElementById("answer-container").style.display = "none";
    document.getElementById("display-your-answer").innerText = "Your answer: " + prevAnswer;
    document.getElementById("display-wait-message").style.display = "block";
    document.getElementById("display-wait-message").innerText = "Correct answer will show soon!";
    document.getElementById("waiting-message").style.display = "block";
}

socket.on("playerAdded", () => {
    document.getElementById("join-container").style.display = "none";
    document.getElementById("waiting-message").style.display = "block";
    document.getElementById("display-wait-message").innerText = "Waiting for host to start...";
    document.getElementById("join-screen-name").innerText = "Bubblegum Limbo";
});

socket.on("gameStarted", () => {
    document.getElementById("join-screen-name").innerText = "Bubblegum Game - Question 1";
    document.getElementById("waiting-message").style.display = "none";
    document.getElementById("answer-container").style.display = "block";
});

socket.on("nextQuestion", (questionNumber) => {
    document.getElementById("client-answer").value = "";
    document.getElementById("join-screen-name").innerText = "Bubblegum Game - Question " + questionNumber;
    document.getElementById("waiting-message").style.display = "none";
    document.getElementById("display-correct-answer").style.display = "none";
    document.getElementById("display-wait-message").style.display = "none";
    document.getElementById("answer-container").style.display = "block";
});

socket.on("gameAlreadyStarted", () => {
    alert("The game has already started. Please wait for the next round.");
});

socket.on("broadcastAnswer", (answer) => {
    console.info("Player answer received by the server!");
    document.getElementById("answer-container").style.display = "none";
    document.getElementById("display-correct-answer").style.display = "block";
    document.getElementById("display-correct-answer").innerText = "Correct answer: " + answer;
    document.getElementById("display-wait-message").style.display = "none";
    document.getElementById("display-wait-message").innerText = "";
    document.getElementById("waiting-message").style.display = "block";
});
