const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get("code");
let playerName = "";
let prevAnswer = "";
const GameState = Object.freeze({
    JOIN_SCREEN: "time to join",      // Players are joining, waiting for the host to start
    LIMBO_SCREEN: "waiting for host to start", // Game is currently running
    QUESTION_SCREEN: "answer question", // Showing the answer
    ANSWER_SCREEN: "show answer",      // Game is over
    GAME_OVER: "game over"
});
let gameState = GameState.JOIN_SCREEN;

document.getElementById("game-code").innerText = gameCode;

function joinGame() {
    playerName = document.getElementById("player-name").value.trim();
    if (!playerName) {
        document.getElementById("status").innerText = "Please enter a name.";
        return;
    }
    else {
        socket.emit("joinGame", playerName);
        gameState = GameState.LIMBO_SCREEN;
    }

    document.getElementById("status").innerText = `Joined as ${playerName}!`;
}

function submitAnswer(noAnswer = false)
{
    prevAnswer = document.getElementById("client-answer").value.trim();
    if (!prevAnswer && !noAnswer) {
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

function startProgressBar(duration) {
    let progressBar = document.getElementById("progress-bar");
    progressBar.style.transition = "none";
    progressBar.style.width = "100%";
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}s linear`;
        progressBar.style.width = "0%";
    }, 100);
}

socket.on("startQuestion", (question) => {
    let timer;
    let timeLeft = question.timer;
    let timerEnabled = timeLeft > 0;
    document.getElementById("display-question").innerText = question.question;

    if (timerEnabled) {
        document.getElementById("progress-container").style.display = "block";
        startProgressBar(timeLeft);
        timer = setTimeout(() => {
            console.info("TIMES UP");
            submitAnswer(true);
        }, timeLeft * 1000);
    } else {
        document.getElementById("progress-container").style.display = "none";
    }
});

socket.on("playerAdded", () => {
    document.getElementById("join-container").style.display = "none";
    document.getElementById("waiting-message").style.display = "block";
    document.getElementById("display-wait-message").innerText = "Waiting for host to start...";
    document.getElementById("join-screen-name").innerText = "Bubblegum Limbo";
});

socket.on("gameStarted", () => {
    if (gameState === GameState.LIMBO_SCREEN)
    {
        document.getElementById("join-screen-name").innerText = "Bubblegum Game - Question 1";
        document.getElementById("waiting-message").style.display = "none";
        document.getElementById("answer-container").style.display = "block";
    }
    else
    {
        document.getElementById("join-screen-name").innerText = "Bubblegum Game";
        document.getElementById("join-container").style.display = "none";
        document.getElementById("waiting-message").style.display = "block";
        document.getElementById("display-wait-message").innerText = "Game has already started!";
    }
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
