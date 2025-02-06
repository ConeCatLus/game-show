const socket = io();

let questions = [];
let currentIndex = 0;
let timer;
let timeLeft = 10;
let timerEnabled = true;
let players = [];

// Fetch and display QR Code & Game Code
fetch("/qr")
    .then(res => res.json())
    .then(data => {
        document.getElementById("qr-code").src = data.qr;
    })
    .catch(error => console.error("QR Code Error:", error));

socket.on("gameCode", (code) => {
    document.getElementById("game-code").innerText = code;
});

// Add player and sync with server
function addPlayer() {
    let playerName = document.getElementById("player-name").value.trim();
    if (playerName) {
        socket.emit("addPlayer", playerName);
        document.getElementById("player-name").value = ""; 
    }
}

// Listen for updated player list from the server
socket.on("updatePlayers", (updatedPlayers) => {
    players = updatedPlayers;
    updatePlayerList();
});

function updatePlayerList() {
    let playerList = document.getElementById("player-list");
    playerList.innerHTML = ""; // Clear list before updating

    players.forEach(player => {
        let li = document.createElement("li");

        let playerText = document.createElement("span");
        playerText.textContent = `${player.name}: ${player.score}`;

        let minusBtn = document.createElement("button");
        minusBtn.textContent = "-";
        minusBtn.classList.add("minus");
        minusBtn.addEventListener("click", () => {
            if (player.score > 0) {
                player.score--;
                socket.emit("updateScore", { id: player.id, score: player.score });
            }
        });

        let plusBtn = document.createElement("button");
        plusBtn.textContent = "+";
        plusBtn.classList.add("plus");
        plusBtn.addEventListener("click", () => {
            player.score++;
            socket.emit("updateScore", { id: player.id, score: player.score });
        });

        li.appendChild(minusBtn);
        li.appendChild(playerText);
        li.appendChild(plusBtn);
        playerList.appendChild(li);
    });
}

// Load questions from JSON
document.addEventListener("DOMContentLoaded", () => {
    loadQuestions();
});

function loadQuestions() {
    fetch("questions.json")
        .then(response => response.json())
        .then(data => {
            questions = data;
        })
        .catch(error => console.error("Error loading questions:", error));
}

function startGame() {
    document.getElementById("start-btn").style.display = "none";
    document.getElementById("question-container").style.display = "flex";
    document.getElementById("setup-container").style.display = "none";
    nextQuestion();
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

function nextQuestion() {
    clearInterval(timer);

    if (currentIndex >= questions.length) {
        document.getElementById("question-text").innerText = "Game Over!";
        document.getElementById("progress-container").style.display = "none";
        document.getElementById("show-answer-btn").style.display = "none";
        document.getElementById("next-btn").style.display = "none";
        document.getElementById("media-container").style.display = "none";
        return;
    }

    let question = questions[currentIndex];
    document.getElementById("question-text").innerText = question.question;
    document.getElementById("media-container").innerHTML = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("show-answer-btn").style.display = "none";
    document.getElementById("media-container").style.display = "block";

    let showAnswerBtn = document.getElementById("show-answer-btn");
    showAnswerBtn.innerHTML = "Show Answer";

    document.getElementById("progress-container").style.display = "block";

    if (question.image) {
        let img = document.createElement("img");
        img.src = question.image;
        img.alt = "Question Image";
        document.getElementById("media-container").appendChild(img);
    }

    if (question.video) {
        let iframe = document.createElement("iframe");
        iframe.src = question.video;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        document.getElementById("media-container").appendChild(iframe);
    }

    timeLeft = question.timer;
    timerEnabled = timeLeft > 0;

    if (timerEnabled) {
        startProgressBar(timeLeft);
        timer = setTimeout(() => {
            document.getElementById("progress-container").style.display = "none";
            document.getElementById("show-answer-btn").style.display = "block";
        }, timeLeft * 1000);
    } else {
        document.getElementById("progress-container").style.display = "none";
        document.getElementById("show-answer-btn").style.display = "block";
    }
}

function showAnswer() {
    let question = questions[currentIndex];
    let showAnswerBtn = document.getElementById("show-answer-btn");

    if (showAnswerBtn.innerHTML === "Show Answer") {
        showAnswerBtn.innerHTML = question.answer;
        showAnswerBtn.style.background = "#ff4da6";
        document.getElementById("next-btn").style.display = "block";
    }
}

function moveToNextQuestion() {
    clearTimeout(timer);
    currentIndex++;
    nextQuestion();
}
